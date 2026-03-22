// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { AggregationService, FeedSnapshot } from "@bnuz-feed/contracts";

import { FeedProvider, useFeedRefresh, useFeedSnapshot } from "./feed-context";

function createSnapshot(): FeedSnapshot {
  return {
    version: 1,
    updatedAt: "2026-03-15T10:00:00.000Z",
    origin: "live",
    items: [
      {
        id: "item-1",
        sourceId: "notice",
        sourceIds: ["notice"],
        title: "Hello",
        url: "https://notice/item-1",
        fetchedAt: "2026-03-15T10:00:00.000Z",
        freshness: "live",
      },
    ],
    sourceHealth: {},
  };
}

function Probe() {
  const snapshot = useFeedSnapshot();
  const { refreshing } = useFeedRefresh();

  return (
    <div>
      <span data-testid="count">{snapshot?.items.length ?? 0}</span>
      <span data-testid="refreshing">{String(refreshing)}</span>
    </div>
  );
}

describe("FeedProvider", () => {
  it("hydrates snapshot state from the service bootstrap", async () => {
    const snapshot = createSnapshot();
    const listeners = new Set<() => void>();
    const service: AggregationService = {
      bootstrap: vi.fn().mockResolvedValue(snapshot),
      refresh: vi.fn().mockResolvedValue(snapshot),
      getSnapshot: vi.fn().mockReturnValue(snapshot),
      subscribe: vi.fn((listener: () => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      }),
    };

    render(
      <FeedProvider service={service}>
        <Probe />
      </FeedProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("count")).toHaveTextContent("1");
    });
  });
});
