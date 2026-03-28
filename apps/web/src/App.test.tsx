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
      "notice::Announcements": 0,
    },
    sourceCounts: {
      notice: 0,
    },
  }),
  countVisibleRawItems: () => 0,
  defaultChannelLabel: "Announcements",
  sourceCatalog: [
    {
      channels: [{ label: "Announcements" }],
      fetchTargetCount: 1,
      id: "notice",
      name: "Notice Board",
      searchText: "notice board announcements",
    },
  ],
  sourceCatalogById: {
    notice: {
      id: "notice",
      name: "Notice Board",
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
    selectedChannelKeys: ["notice::Announcements"],
    selectedChannelSet: new Set(["notice::Announcements"]),
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

      const drawerToggle = document.querySelector(".topbar__drawer-toggle");
      const closeButton = document.querySelector(".source-panel__close");
      const panel = document.querySelector(".source-panel");
      const scrim = document.querySelector(".app__scrim");

      expect(drawerToggle).toBeInstanceOf(HTMLButtonElement);
      expect(closeButton).toBeInstanceOf(HTMLButtonElement);
      expect(panel).toBeInstanceOf(HTMLElement);
      expect(scrim).toBeInstanceOf(HTMLElement);

      fireEvent.click(drawerToggle as HTMLButtonElement);

      expect(panel).toHaveClass("is-open");
      expect(scrim).toHaveClass("is-open");

      fireEvent.click(closeButton as HTMLButtonElement);

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

  it("shows the visible count as deduplicated and raw totals", () => {
    render(<App />);

    expect(screen.getByText("去重后条数（原始条数）")).toBeInTheDocument();
    expect(screen.getByText("0（0）")).toBeInTheDocument();
  });
});
