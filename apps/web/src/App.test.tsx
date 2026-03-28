// @vitest-environment jsdom

import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@bnuz-feed/react-bindings", () => ({
  FeedProvider: ({ children }: { children: ReactNode }) => children,
  useFeedRefresh: () => ({
    error: null,
    refresh: vi.fn(),
    refreshing: false,
  }),
  useFeedSnapshot: () => ({
    items: [],
    updatedAt: undefined,
  }),
}));

vi.mock("./feedIndex", () => ({
  buildFeedIndex: () => [],
  filterFeedIndex: () => [],
}));

vi.mock("./runtime/createAggregationService", () => ({
  aggregationService: {},
  appRuntimeConfig: {
    autoRefresh: false,
    sourceMode: "snapshot",
  },
}));

vi.mock("./sourceCatalog", () => ({
  buildItemStats: () => ({
    channelCounts: {
      "notice::通知动态": 0,
    },
    sourceCounts: {
      notice: 0,
    },
  }),
  defaultChannelLabel: "通知动态",
  sourceCatalog: [
    {
      channels: [{ label: "通知动态" }],
      fetchTargetCount: 1,
      id: "notice",
      name: "通知公告",
      searchText: "通知公告 通知动态",
    },
  ],
  sourceCatalogById: {
    notice: {
      id: "notice",
      name: "通知公告",
    },
  },
  totalSourceChannelCount: 1,
}));

vi.mock("./useIncrementalFeedWindow", () => ({
  useIncrementalFeedWindow: () => ({
    canLoadMore: false,
    renderedCount: 0,
    sentinelRef: { current: null },
  }),
}));

vi.mock("./useRefreshController", () => ({
  useRefreshController: () => ({
    refreshAll: vi.fn(),
  }),
}));

vi.mock("./useSourceSelection", () => ({
  useSourceSelection: () => ({
    allSelected: true,
    getSourceSelectionState: () => "all",
    selectedChannelKeys: ["notice::通知动态"],
    selectedChannelSet: new Set(["notice::通知动态"]),
    selectedSourceIds: ["notice"],
    toggleAll: vi.fn(),
    toggleChannel: vi.fn(),
    toggleSource: vi.fn(),
  }),
}));

import App from "./App";

describe("App drawer", () => {
  it("uses the same drawer interaction on desktop and keeps the closing state long enough to animate", () => {
    vi.useFakeTimers();

    try {
      render(<App />);

      fireEvent.click(screen.getByRole("button", { name: "选择栏目" }));

      const panel = document.querySelector(".source-panel");
      const scrim = document.querySelector(".app__scrim");

      expect(panel).toHaveClass("is-open");
      expect(scrim).toHaveClass("is-open");

      fireEvent.click(screen.getByRole("button", { name: "关闭" }));

      expect(panel).toHaveClass("is-closing");
      expect(scrim).toHaveClass("is-closing");

      act(() => {
        vi.advanceTimersByTime(240);
      });

      expect(panel).not.toHaveClass("is-open");
      expect(panel).not.toHaveClass("is-closing");
      expect(scrim).not.toHaveClass("is-open");
      expect(scrim).not.toHaveClass("is-closing");
    } finally {
      vi.useRealTimers();
    }
  });
});
