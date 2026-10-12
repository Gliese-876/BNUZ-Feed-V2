// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useIncrementalFeedWindow } from "./useIncrementalFeedWindow";

describe("incremental feed rendering", () => {
  it("provides manual pagination when IntersectionObserver is unavailable and resets on filtering", () => {
    const { result, rerender } = renderHook(({ count, key }) => useIncrementalFeedWindow(count, key), { initialProps: { count: 120, key: "all" } });
    expect(result.current.renderedCount).toBe(48);
    act(() => result.current.loadMore());
    expect(result.current.renderedCount).toBe(84);
    act(() => result.current.loadMore());
    expect(result.current.renderedCount).toBe(120);
    expect(result.current.canLoadMore).toBe(false);
    rerender({ count: 10, key: "filtered" });
    expect(result.current.renderedCount).toBe(10);
  });
});
