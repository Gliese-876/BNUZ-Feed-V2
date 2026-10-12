import { useDeferredValue, useId, useMemo, useRef, useState } from "react";
import { FeedProvider, useFeedRefresh, useFeedSnapshot } from "@bnuz-feed/react-bindings";
import { bnuzhSources } from "@bnuz-feed/source-registry/catalog";

import { buildFeedIndex, filterFeedIndex } from "./feedIndex";
import { FeedList } from "./FeedList";
import { formatDate } from "./formatDate";
import { OfficialSearchDialog } from "./OfficialSearchDialog";
import { aggregationService, appRuntimeConfig } from "./runtime/createAggregationService";
import { buildItemStats, countVisibleRawItems, sourceCatalog, totalSourceChannelCount } from "./sourceCatalog";
import { SourcePanel } from "./SourcePanel";
import { useIncrementalFeedWindow } from "./useIncrementalFeedWindow";
import { useRefreshController } from "./useRefreshController";
import { useSourceSelection } from "./useSourceSelection";

const sourceNamesById = Object.fromEntries(sourceCatalog.map((source) => [source.id, source.name]));
const officialSearchScopeOptions = [
  { id: "0", name: "所有站点" },
  ...bnuzhSources.map(({ id, name }) => ({ id, name })),
];
const numberFormatter = new Intl.NumberFormat("zh-CN");

function RuntimeShell() {
  const snapshot = useFeedSnapshot();
  const { refresh, refreshing, error } = useFeedRefresh();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [feedQuery, setFeedQuery] = useState("");
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const sourceButtonRef = useRef<HTMLButtonElement>(null);
  const searchDialogId = useId();
  const sourceDrawerId = useId();
  const feedSearchId = useId();
  const selection = useSourceSelection(sourceCatalog);
  const { refreshAll } = useRefreshController({
    autoRefresh: appRuntimeConfig.autoRefresh,
    refresh,
    snapshot,
    sourceMode: appRuntimeConfig.sourceMode,
  });

  const deferredFeedQuery = useDeferredValue(feedQuery.trim().toLowerCase());
  const selectedSourceIds = useDeferredValue(selection.selectedSourceIds);
  const selectedChannelKeys = useDeferredValue(selection.selectedChannelKeys);
  const sourceSet = useMemo(() => new Set(selectedSourceIds), [selectedSourceIds]);
  const channelSet = useMemo(() => new Set(selectedChannelKeys), [selectedChannelKeys]);
  const indexedItems = useMemo(() => buildFeedIndex(snapshot?.items ?? [], sourceNamesById), [snapshot?.items]);
  const itemStats = useMemo(() => buildItemStats(snapshot?.items ?? []), [snapshot?.items]);
  const visibleItems = useMemo(() => {
    if (!snapshot?.items.length) return [];
    return filterFeedIndex(indexedItems, sourceSet, channelSet, deferredFeedQuery);
  }, [channelSet, deferredFeedQuery, indexedItems, snapshot?.items, sourceSet]);
  const visibleRawItemCount = useMemo(() => countVisibleRawItems(visibleItems, sourceSet, channelSet), [channelSet, sourceSet, visibleItems]);
  const resetKey = `${snapshot?.updatedAt ?? "empty"}::${deferredFeedQuery}::${selectedSourceIds.join("|")}::${selectedChannelKeys.join("|")}`;
  const { canLoadMore, loadMore, renderedCount, sentinelRef } = useIncrementalFeedWindow(visibleItems.length, resetKey);
  const renderedItems = useMemo(() => visibleItems.slice(0, renderedCount), [renderedCount, visibleItems]);

  return (
    <main className="app">
      <a className="skip-link" href="#feed-content">跳转到内容</a>
      <header className="topbar">
        <a aria-label="BNUZ Feed 首页" className="topbar__brand" href={import.meta.env.BASE_URL}>
          <span><strong>BNUZ Feed<span aria-hidden="true" className="topbar__mark" /></strong><span className="topbar__eyebrow">北师大珠海校区公开信息</span></span>
        </a>
        <div className="topbar__actions">
          <button aria-controls={searchDialogOpen ? searchDialogId : undefined} aria-expanded={searchDialogOpen} aria-haspopup="dialog" className="button button--tonal" onClick={() => setSearchDialogOpen(true)} ref={searchButtonRef} type="button">全站检索 <span aria-hidden="true">↗</span></button>
          <button className="button button--filled" disabled={refreshing} onClick={() => void refreshAll()} type="button">{refreshing ? "更新中…" : "更新内容"}</button>
        </div>
      </header>

      <section aria-labelledby="intro-title" className="intro-card">
        <div className="intro-card__main">
          <span className="intro-card__eyebrow">01 — CAMPUS INFORMATION</span>
          <h1 id="intro-title"><span>校园动态，</span><span>一处读完。</span></h1>
          <p>官方通知、校园新闻、栏目更新。<br />从分散的信息里，找到你关心的事。</p>
        </div>
        <div className="intro-metrics" aria-label="信息源概览">
          <div><span className="intro-metrics__label">SOURCES / 信息源</span><strong>{sourceCatalog.length}<small> 个</small></strong><span>公开站点持续收录</span></div>
          <div><span className="intro-metrics__label">CHANNELS / 栏目</span><strong>{totalSourceChannelCount}<small> 个</small></strong><span>按你的关注自由筛选</span></div>
        </div>
        <div className="intro-card__footer"><span>最近更新 / {formatDate(snapshot?.updatedAt, true)}</span><span>公开信息聚合 · 原文直达 ↗</span></div>
      </section>

      <section aria-labelledby="feed-title" className="content" id="feed-content" tabIndex={-1}>
        <div className="content__heading">
          <div><span className="section-eyebrow">02 — THE LATEST</span><h2 id="feed-title">最新公开信息</h2></div>
          <button aria-controls={sourceDrawerId} aria-expanded={drawerOpen} aria-haspopup="dialog" className="button button--outline topbar__drawer-toggle" onClick={() => setDrawerOpen(true)} ref={sourceButtonRef} type="button">选择栏目 <span className="button__count">{selection.selectedSourceIds.length}</span></button>
        </div>
        <div className="content__toolbar">
          <label className="field content__search" htmlFor={feedSearchId}>
            <span>搜索当前内容</span>
            <input id={feedSearchId} onChange={(event) => setFeedQuery(event.target.value)} placeholder="搜索标题、摘要、站点或栏目" type="search" value={feedQuery} />
          </label>
          <div className="content__meta" aria-live="polite" aria-atomic="true">
            <span className="content__count">当前结果 <strong>{numberFormatter.format(visibleItems.length)}</strong> 条</span>
            <span>原始收录 {numberFormatter.format(visibleRawItemCount)} 条 · 重复条目已合并</span>
          </div>
        </div>

        {error ? <div className="notice" role="alert"><span>{snapshot ? "本次更新未完成，正在显示上次成功更新的内容。" : "暂时无法载入信息，请重试。"}</span><button className="button button--text" disabled={refreshing} onClick={() => void refreshAll()} type="button">重试更新</button></div> : null}

        {visibleItems.length > 0 ? (
          <>
            <FeedList items={renderedItems} />
            <div className="feed-list__footer">
              <span>已显示 {renderedItems.length} / {visibleItems.length} 条内容</span>
              {canLoadMore ? <><button className="button button--outline" onClick={loadMore} type="button">加载更多</button><div aria-hidden="true" className="feed-list__sentinel" ref={sentinelRef} /></> : <span>已读到这里，校园动态尽在此处</span>}
            </div>
          </>
        ) : (
          <div className="empty-state" role="status">
            <span aria-hidden="true" className="empty-state__symbol">⌕</span>
            <strong>{!snapshot && !error ? "正在载入校园信息…" : "当前没有可显示的内容"}</strong>
            {snapshot ? <><span>试试其他关键词，或恢复全部站点与栏目。</span><button className="button button--tonal" onClick={() => { selection.toggleAll(true); setFeedQuery(""); }} type="button">恢复默认筛选</button></> : <span>{error ? "请使用上方的重试按钮重新载入。" : "汇集多个官方站点，精彩内容即将呈现。"}</span>}
          </div>
        )}
      </section>
      <footer className="app-footer"><strong>BNUZ Feed</strong><span>公开信息聚合 · 以官方站点原文为准</span></footer>
      <SourcePanel id={sourceDrawerId} itemStats={itemStats} onClose={() => setDrawerOpen(false)} open={drawerOpen} selection={selection} triggerRef={sourceButtonRef} />
      <OfficialSearchDialog dialogId={searchDialogId} initialQuery={feedQuery} onClose={() => setSearchDialogOpen(false)} open={searchDialogOpen} scopeOptions={officialSearchScopeOptions} triggerRef={searchButtonRef} />
    </main>
  );
}

export default function App() {
  return <FeedProvider autoRefresh={false} service={aggregationService}><RuntimeShell /></FeedProvider>;
}
