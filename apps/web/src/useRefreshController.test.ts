// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { FeedSnapshot } from "@bnuz-feed/contracts";
import { useRefreshController } from "./useRefreshController";

function createSnapshot(origin: FeedSnapshot["origin"] = "snapshot"): FeedSnapshot {
  return { version: 1, origin, updatedAt: "2026-10-12T01:00:00Z", items: [], sourceHealth: {} };
}

afterEach(() => vi.useRealTimers());

describe("refresh controller", () => {
  it("avoids redownloading a fresh bootstrap snapshot and keeps manual refresh available", async () => {
    const snapshot = createSnapshot();
    const refresh = vi.fn().mockResolvedValue(snapshot);
    const { result } = renderHook(() => useRefreshController({ autoRefresh: true, refresh, snapshot, sourceMode: "snapshot" }));
    expect(refresh).not.toHaveBeenCalled();
    await act(() => result.current.refreshAll());
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("updates a cached snapshot once after bootstrap", async () => {
    const refresh = vi.fn().mockResolvedValue(createSnapshot());
    const { rerender } = renderHook(({ snapshot }) => useRefreshController({ autoRefresh: true, refresh, snapshot, sourceMode: "snapshot" }), { initialProps: { snapshot: null as FeedSnapshot | null } });
    expect(refresh).not.toHaveBeenCalled();
    await act(async () => rerender({ snapshot: createSnapshot("cache") }));
    expect(refresh).toHaveBeenCalledOnce();
    await act(async () => rerender({ snapshot: createSnapshot() }));
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("limits browser retries to two attempts", async () => {
    vi.useFakeTimers();
    const snapshot = createSnapshot("live");
    snapshot.sourceHealth.notice = { sourceId: "notice", status: "network_error", checkedAt: snapshot.updatedAt, itemCount: 0 };
    const refresh = vi.fn().mockResolvedValue(snapshot);
    const { unmount } = renderHook(() => useRefreshController({ autoRefresh: true, refresh, snapshot, sourceMode: "browser" }));
    await act(async () => undefined);
    expect(refresh).toHaveBeenCalledOnce();
    await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
    expect(refresh).toHaveBeenLastCalledWith(["notice"]);
    expect(refresh).toHaveBeenCalledTimes(2);
    await act(async () => { await vi.advanceTimersByTimeAsync(9000); });
    expect(refresh).toHaveBeenCalledTimes(3);
    await act(async () => { await vi.advanceTimersByTimeAsync(60000); });
    expect(refresh).toHaveBeenCalledTimes(3);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("cancels a pending browser retry when the reading interface unmounts", async () => {
    vi.useFakeTimers();
    const snapshot = createSnapshot("live");
    snapshot.sourceHealth.notice = { sourceId: "notice", status: "network_error", checkedAt: snapshot.updatedAt, itemCount: 0 };
    const refresh = vi.fn().mockResolvedValue(snapshot);
    const { unmount } = renderHook(() => useRefreshController({ autoRefresh: true, refresh, snapshot, sourceMode: "browser" }));
    await act(async () => undefined);
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    await act(async () => { await vi.advanceTimersByTimeAsync(12000); });
    expect(refresh).toHaveBeenCalledOnce();
  });
});
