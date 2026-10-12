// @vitest-environment jsdom

import { act, cleanup, fireEvent, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { FeedSnapshot } from "@bnuz-feed/contracts";
import { useRefreshController } from "./useRefreshController";

function createSnapshot(origin: FeedSnapshot["origin"] = "snapshot"): FeedSnapshot {
  return { version: 1, origin, updatedAt: "2026-10-12T01:00:00Z", items: [], sourceHealth: {} };
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("refresh controller", () => {
  it("refreshes foreground snapshots every fifteen minutes and reschedules after a manual update", async () => {
    vi.useFakeTimers();
    const snapshot = createSnapshot();
    const refresh = vi.fn().mockResolvedValue(snapshot);
    const { result } = renderHook(() => useRefreshController({ autoRefresh: true, refresh, snapshot, sourceMode: "snapshot" }));
    await act(() => vi.advanceTimersByTimeAsync(15 * 60_000));
    expect(refresh).toHaveBeenCalledOnce();
    await act(() => vi.advanceTimersByTimeAsync(14 * 60_000));
    await act(() => result.current.refreshAll());
    expect(refresh).toHaveBeenCalledTimes(2);
    await act(() => vi.advanceTimersByTimeAsync(60_000));
    expect(refresh).toHaveBeenCalledTimes(2);
    await act(() => vi.advanceTimersByTimeAsync(14 * 60_000));
    expect(refresh).toHaveBeenCalledTimes(3);
  });

  it("defers offline startup and immediately synchronizes when the connection returns", async () => {
    vi.useFakeTimers();
    const online = vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    const snapshot = createSnapshot("cache");
    const refresh = vi.fn().mockResolvedValue(snapshot);
    renderHook(() => useRefreshController({ autoRefresh: true, refresh, snapshot, sourceMode: "snapshot" }));
    await act(() => vi.advanceTimersByTimeAsync(60 * 60_000));
    expect(refresh).not.toHaveBeenCalled();
    online.mockReturnValue(true);
    await act(async () => { fireEvent(window, new Event("online")); });
    expect(refresh).toHaveBeenCalledOnce();
    online.mockReturnValue(false);
    fireEvent(window, new Event("offline"));
    expect(vi.getTimerCount()).toBe(0);
    await act(() => vi.advanceTimersByTimeAsync(60 * 60_000));
    expect(refresh).toHaveBeenCalledOnce();
    online.mockReturnValue(true);
    await act(async () => {
      fireEvent(window, new Event("online"));
      fireEvent(window, new Event("focus"));
      fireEvent(document, new Event("visibilitychange"));
    });
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("pauses in the background and coalesces focus and visibility events on return", async () => {
    vi.useFakeTimers();
    const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    const snapshot = createSnapshot();
    const refresh = vi.fn().mockResolvedValue(snapshot);
    renderHook(() => useRefreshController({ autoRefresh: true, refresh, snapshot, sourceMode: "snapshot" }));
    visibility.mockReturnValue("hidden");
    fireEvent(document, new Event("visibilitychange"));
    expect(vi.getTimerCount()).toBe(0);
    await act(() => vi.advanceTimersByTimeAsync(30 * 60_000));
    expect(refresh).not.toHaveBeenCalled();
    visibility.mockReturnValue("visible");
    await act(async () => {
      fireEvent(document, new Event("visibilitychange"));
      fireEvent(window, new Event("focus"));
    });
    expect(refresh).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(1);
  });

  it("shares a pending request and does not restart timers after unmount", async () => {
    vi.useFakeTimers();
    const snapshot = createSnapshot();
    let resolve!: (value: FeedSnapshot) => void;
    const refresh = vi.fn(() => new Promise<FeedSnapshot>((complete) => { resolve = complete; }));
    const { unmount } = renderHook(() => useRefreshController({ autoRefresh: true, refresh, snapshot, sourceMode: "snapshot" }));
    await act(async () => {
      fireEvent(window, new Event("online"));
      fireEvent(window, new Event("online"));
      fireEvent(window, new Event("focus"));
    });
    expect(refresh).toHaveBeenCalledOnce();
    unmount();
    await act(async () => { resolve(snapshot); });
    expect(vi.getTimerCount()).toBe(0);
  });

  it("honors disabled automatic refresh while keeping manual updates available", async () => {
    vi.useFakeTimers();
    const snapshot = createSnapshot("cache");
    const refresh = vi.fn().mockResolvedValue(snapshot);
    const { result } = renderHook(() => useRefreshController({ autoRefresh: false, refresh, snapshot, sourceMode: "snapshot" }));
    fireEvent(window, new Event("online"));
    await act(() => vi.advanceTimersByTimeAsync(60 * 60_000));
    expect(refresh).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    await act(() => result.current.refreshAll());
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("waits for the next interval after an automatic request fails", async () => {
    vi.useFakeTimers();
    const snapshot = createSnapshot();
    const refresh = vi.fn().mockRejectedValueOnce(new Error("network failed")).mockResolvedValue(snapshot);
    renderHook(() => useRefreshController({ autoRefresh: true, refresh, snapshot, sourceMode: "snapshot" }));
    await act(() => vi.advanceTimersByTimeAsync(15 * 60_000));
    expect(refresh).toHaveBeenCalledOnce();
    await act(() => vi.advanceTimersByTimeAsync(15 * 60_000));
    expect(refresh).toHaveBeenCalledTimes(2);
  });

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
