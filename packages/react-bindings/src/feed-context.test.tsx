// @vitest-environment jsdom

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { AggregationService, FeedSnapshot } from "@bnuz-feed/contracts";

import { FeedProvider, useFeedRefresh, useFeedSnapshot } from "./feed-context";

function createSnapshot(title = "Hello"): FeedSnapshot {
  return {
    version: 1,
    updatedAt: "2026-03-15T10:00:00.000Z",
    origin: "live",
    items: [
      {
        id: "item-1",
        sourceId: "notice",
        sourceIds: ["notice"],
        title,
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
  const { refresh, refreshing, error } = useFeedRefresh();

  return (
    <div>
      <span data-testid="count">{snapshot?.items.length ?? 0}</span>
      <span data-testid="title">{snapshot?.items[0]?.title}</span>
      <span data-testid="refreshing">{String(refreshing)}</span>
      <span data-testid="error">{error?.message}</span>
      <button onClick={() => void refresh(["notice"])}>Refresh</button>
    </div>
  );
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function createService(initialSnapshot: FeedSnapshot | null = createSnapshot()) {
  let snapshot = initialSnapshot;
  const listeners = new Set<() => void>();
  const service = {
    bootstrap: vi.fn<AggregationService["bootstrap"]>().mockResolvedValue(snapshot),
    refresh: vi.fn<AggregationService["refresh"]>().mockResolvedValue(snapshot!),
    getSnapshot: vi.fn(() => snapshot),
    subscribe: vi.fn((listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }),
  } satisfies AggregationService;

  return {
    service,
    publish(nextSnapshot: FeedSnapshot) {
      snapshot = nextSnapshot;
      listeners.forEach((listener) => listener());
    },
  };
}

describe("FeedProvider", () => {
  it("hydrates snapshot state from the service bootstrap", async () => {
    const snapshot = createSnapshot();
    const bootstrap = deferred<FeedSnapshot | null>();
    const { service } = createService(null);
    service.bootstrap.mockReturnValue(bootstrap.promise);

    render(
      <FeedProvider service={service}>
        <Probe />
      </FeedProvider>,
    );

    expect(screen.getByTestId("count")).toHaveTextContent("0");
    await act(async () => bootstrap.resolve(snapshot));
    await waitFor(() => {
      expect(screen.getByTestId("count")).toHaveTextContent("1");
    });
  });

  it("reports bootstrap failures and permits a manual refresh", async () => {
    const { service } = createService();
    service.bootstrap.mockRejectedValue(new Error("Bootstrap failed"));
    service.refresh.mockResolvedValue(createSnapshot("Recovered"));
    render(<FeedProvider service={service}><Probe /></FeedProvider>);

    await waitFor(() => expect(screen.getByTestId("error")).toHaveTextContent("Bootstrap failed"));
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await waitFor(() => expect(screen.getByTestId("title")).toHaveTextContent("Recovered"));
    expect(service.refresh).toHaveBeenCalledWith(["notice"]);
    expect(screen.getByTestId("error")).toBeEmptyDOMElement();
  });

  it("keeps refreshing until every overlapping request has completed", async () => {
    const first = deferred<FeedSnapshot>();
    const second = deferred<FeedSnapshot>();
    const { service } = createService();
    service.refresh.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    render(<FeedProvider service={service}><Probe /></FeedProvider>);
    await act(async () => undefined);

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await act(async () => first.reject(new Error("First failed")));
    expect(screen.getByTestId("refreshing")).toHaveTextContent("true");
    expect(screen.getByTestId("error")).toHaveTextContent("First failed");

    await act(async () => second.resolve(createSnapshot("Second completed")));
    expect(screen.getByTestId("refreshing")).toHaveTextContent("false");
    expect(screen.getByTestId("title")).toHaveTextContent("Second completed");
    expect(screen.getByTestId("error")).toBeEmptyDOMElement();
  });

  it("ignores bootstrap results from a replaced service", async () => {
    const bootstrap = deferred<FeedSnapshot | null>();
    const first = createService(null).service;
    const second = createService(createSnapshot("Current service")).service;
    first.bootstrap.mockReturnValue(bootstrap.promise);
    const view = render(<FeedProvider service={first}><Probe /></FeedProvider>);

    view.rerender(<FeedProvider service={second}><Probe /></FeedProvider>);
    await act(async () => bootstrap.resolve(createSnapshot("Previous service")));
    expect(screen.getByTestId("title")).toHaveTextContent("Current service");
  });

  it.each(["resolve", "reject"] as const)("ignores a replaced service refresh when it %ss", async (completion) => {
    const oldRequest = deferred<FeedSnapshot>();
    const newRequest = deferred<FeedSnapshot>();
    const first = createService().service;
    const second = createService(createSnapshot("Current service")).service;
    first.refresh.mockReturnValue(oldRequest.promise);
    second.refresh.mockReturnValue(newRequest.promise);
    const view = render(<FeedProvider service={first}><Probe /></FeedProvider>);
    await act(async () => undefined);
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    view.rerender(<FeedProvider service={second}><Probe /></FeedProvider>);
    await act(async () => undefined);
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await act(async () => {
      if (completion === "resolve") {
        oldRequest.resolve(createSnapshot("Previous service"));
      } else {
        oldRequest.reject(new Error("Previous service failed"));
      }
    });
    expect(screen.getByTestId("title")).toHaveTextContent("Current service");
    expect(screen.getByTestId("refreshing")).toHaveTextContent("true");
    expect(screen.getByTestId("error")).toBeEmptyDOMElement();

    await act(async () => newRequest.resolve(createSnapshot("Current refresh")));
    expect(screen.getByTestId("title")).toHaveTextContent("Current refresh");
    expect(screen.getByTestId("refreshing")).toHaveTextContent("false");
  });

  it("subscribes to the current service and removes the previous subscription", async () => {
    const first = createService();
    const second = createService(createSnapshot("Current service"));
    const view = render(<FeedProvider service={first.service}><Probe /></FeedProvider>);
    await act(async () => undefined);
    act(() => first.publish(createSnapshot("Published")));
    expect(screen.getByTestId("title")).toHaveTextContent("Published");

    view.rerender(<FeedProvider service={second.service}><Probe /></FeedProvider>);
    await act(async () => undefined);
    act(() => first.publish(createSnapshot("Old publication")));
    expect(screen.getByTestId("title")).toHaveTextContent("Current service");
    act(() => second.publish(createSnapshot("Current publication")));
    expect(screen.getByTestId("title")).toHaveTextContent("Current publication");
  });
});
