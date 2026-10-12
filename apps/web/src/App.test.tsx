// @vitest-environment jsdom

import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import type { FeedItem } from "@bnuz-feed/contracts";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ items: [] as FeedItem[], error: null as Error | null, refreshAll: vi.fn() }));

vi.mock("@bnuz-feed/react-bindings", () => ({
  FeedProvider: ({ children }: { children: ReactNode }) => children,
  useFeedRefresh: () => ({ error: state.error, refresh: vi.fn(), refreshing: false }),
  useFeedSnapshot: () => ({ items: state.items, updatedAt: "2026-10-12T01:00:00Z", origin: "snapshot", sourceHealth: {}, version: 1 }),
}));
vi.mock("./runtime/createAggregationService", () => ({
  aggregationService: {}, appRuntimeConfig: { autoRefresh: false, sourceMode: "snapshot" },
}));
vi.mock("./sourceCatalog", async () => ({
  ...await vi.importActual<typeof import("./sourceCatalog")>("./sourceCatalog"),
  sourceCatalog: [{ channels: [{ label: "通知公告" }, { label: "综合新闻" }], fetchTargetCount: 2, id: "75e9fe7e62fb4d13a04c54339b880077", name: "教务部", searchText: "教务部 通知公告 综合新闻" }],
  sourceCatalogById: { "75e9fe7e62fb4d13a04c54339b880077": { id: "75e9fe7e62fb4d13a04c54339b880077", name: "教务部" } },
  totalSourceChannelCount: 2,
}));
vi.mock("./useRefreshController", () => ({ useRefreshController: () => ({ refreshAll: state.refreshAll }) }));

import App from "./App";

function createItem(overrides: Partial<FeedItem> = {}): FeedItem {
  return { id: "one", title: "Scholarship applications", sourceId: "75e9fe7e62fb4d13a04c54339b880077", sourceIds: ["75e9fe7e62fb4d13a04c54339b880077"], channel: "通知公告", url: "https://www.bnuzh.edu.cn/example.html", fetchedAt: "2026-10-12T01:00:00Z", freshness: "snapshot", ...overrides };
}

describe("App reading and filtering", () => {
  beforeEach(() => {
    localStorage.clear();
    state.items = [];
    state.error = null;
    state.refreshAll.mockClear();
  });

  it("opens an accessible drawer, closes with Escape, and restores the opener", () => {
    const { container } = render(<App />);
    const trigger = screen.getByRole("button", { name: /选择栏目/ });
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(trigger);

    const panel = screen.getByRole("dialog", { name: "站点与栏目" });
    expect(panel).toHaveAttribute("aria-modal", "true");
    expect(panel).toContainElement(document.activeElement as HTMLElement);
    expect(container).toHaveAttribute("aria-hidden", "true");
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(trigger).toHaveFocus();
    expect(container).not.toHaveAttribute("aria-hidden");
    expect(document.body.style.overflow).toBe("");
  });

  it("traps keyboard focus and supports backdrop dismissal", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /选择栏目/ }));
    const first = screen.getByRole("button", { name: "关闭栏目筛选" });
    const last = screen.getByRole("button", { name: "完成筛选" });
    first.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(last).toHaveFocus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(first).toHaveFocus();
    fireEvent.click(document.querySelector(".app__scrim") as HTMLElement);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("keeps deduplicated and raw counts and opens feed entries with native links", () => {
    state.items = [createItem({ rawCount: 3, rawOccurrences: [{ sourceId: "75e9fe7e62fb4d13a04c54339b880077", channel: "通知公告", count: 3 }] })];
    render(<App />);
    expect(document.querySelector(".content__count")).toHaveTextContent("当前结果 1 条");
    expect(screen.getByText("原始收录 3 条 · 重复条目已合并")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /Scholarship applications/ });
    expect(link).toHaveAttribute("href", state.items[0]?.url);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("defaults to student channels and lets readers switch to all information", () => {
    state.items = [createItem(), createItem({ id: "news", title: "Department meeting", channel: "综合新闻" })];
    render(<App />);

    expect(screen.getByRole("heading", { name: "学生精选", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /学生精选.*默认推荐/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("link", { name: /Scholarship applications/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Department meeting/ })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "全部信息" }));
    expect(screen.getByRole("heading", { name: "全部公开信息", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Department meeting/ })).toBeInTheDocument();
    expect(document.querySelector(".content__count")).toHaveTextContent("当前结果 2 条");

    fireEvent.click(screen.getByRole("button", { name: /学生精选.*默认推荐/ }));
    expect(screen.queryByRole("link", { name: /Department meeting/ })).toBeNull();
    expect(document.querySelector(".content__count")).toHaveTextContent("当前结果 1 条");
  });

  it("searches locally, filters a channel, and restores default selection", () => {
    state.items = [createItem(), createItem({ id: "two", title: "Campus library hours" })];
    render(<App />);
    fireEvent.change(screen.getByRole("searchbox", { name: "搜索当前内容" }), { target: { value: "library" } });
    expect(screen.queryByRole("link", { name: /Scholarship applications/ })).toBeNull();
    expect(screen.getByRole("link", { name: /Campus library hours/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /选择栏目/ }));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("checkbox", { name: /通知公告/ }));
    fireEvent.click(within(dialog).getByRole("button", { name: "完成筛选" }));
    expect(screen.getByText("当前没有可显示的内容")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "恢复默认筛选" }));
    expect(screen.getByRole("link", { name: /Scholarship applications/ })).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "搜索当前内容" })).toHaveValue("");
  });

  it("hides stale cached entries whose source is no longer in the catalog", () => {
    state.items = [createItem({ sourceId: "removed", sourceIds: ["removed"] })];
    render(<App />);
    expect(screen.queryByRole("link", { name: /Scholarship applications/ })).toBeNull();
    expect(document.querySelector(".content__count")).toHaveTextContent("当前结果 0 条");
    expect(screen.getByText("原始收录 0 条 · 重复条目已合并")).toBeInTheDocument();
  });

  it("labels a merged article using the source and channel selected by the reader", () => {
    state.items = [createItem({
      sourceId: "other-source", sourceIds: ["other-source", "75e9fe7e62fb4d13a04c54339b880077"], channel: "综合新闻",
      rawOccurrences: [
        { sourceId: "other-source", channel: "综合新闻", count: 1 },
        { sourceId: "75e9fe7e62fb4d13a04c54339b880077", channel: "通知公告", count: 1 },
      ],
    })];
    render(<App />);
    const link = screen.getByRole("link", { name: /Scholarship applications/ });
    expect(link).toHaveTextContent("教务部");
    expect(link).toHaveTextContent("通知公告");
    expect(link).not.toHaveTextContent("other-source");
    expect(document.querySelector(".content__count")).toHaveTextContent("当前结果 1 条");
  });

  it("offers a retry after a failed update", () => {
    state.error = new Error("network");
    render(<App />);
    expect(screen.getByRole("alert")).toHaveTextContent("本次更新未完成");
    fireEvent.click(screen.getByRole("button", { name: "重试更新" }));
    expect(state.refreshAll).toHaveBeenCalledOnce();
  });
});
