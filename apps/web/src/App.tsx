import {
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type InputHTMLAttributes,
} from "react";

import {
  FeedProvider,
  useFeedRefresh,
  useFeedSnapshot,
} from "@bnuz-feed/react-bindings";

import { buildFeedIndex, filterFeedIndex } from "./feedIndex";
import { OfficialSearchDialog } from "./OfficialSearchDialog";
import {
  aggregationService,
  appRuntimeConfig,
} from "./runtime/createAggregationService";
import {
  buildItemStats,
  defaultChannelLabel,
  sourceCatalog,
  sourceCatalogById,
  totalSourceChannelCount,
  type SourceCatalogNode,
} from "./sourceCatalog";
import { useIncrementalFeedWindow } from "./useIncrementalFeedWindow";
import { useRefreshController } from "./useRefreshController";
import { useSourceSelection } from "./useSourceSelection";

function formatDateTime(value: string | undefined): string {
  if (!value) {
    return "暂无更新记录";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatPublishedAt(value: string | undefined): string {
  if (!value) {
    return "未标注日期";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
  }).format(date);
}

function matchesSourceQuery(source: SourceCatalogNode, query: string): boolean {
  if (!query) {
    return true;
  }

  return source.searchText.includes(query);
}

function SelectionCheckbox({
  indeterminate = false,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { indeterminate?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <input
      {...props}
      ref={ref}
      type="checkbox"
    />
  );
}

function RuntimeShell() {
  const snapshot = useFeedSnapshot();
  const { refresh, refreshing, error } = useFeedRefresh();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sourcePanelCollapsed, setSourcePanelCollapsed] = useState(false);
  const [feedQuery, setFeedQuery] = useState("");
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const [sourceQuery, setSourceQuery] = useState("");
  const [useDrawerLayout, setUseDrawerLayout] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia("(max-width: 1180px)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 1180px)");
    const syncLayout = (event?: MediaQueryList | MediaQueryListEvent) => {
      setUseDrawerLayout((event ?? mediaQuery).matches);
    };

    syncLayout(mediaQuery);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncLayout);
      return () => {
        mediaQuery.removeEventListener("change", syncLayout);
      };
    }

    mediaQuery.addListener(syncLayout);
    return () => {
      mediaQuery.removeListener(syncLayout);
    };
  }, []);

  useEffect(() => {
    if (!useDrawerLayout && drawerOpen) {
      setDrawerOpen(false);
    }
  }, [drawerOpen, useDrawerLayout]);

  useEffect(() => {
    if (useDrawerLayout && sourcePanelCollapsed) {
      setSourcePanelCollapsed(false);
    }
  }, [sourcePanelCollapsed, useDrawerLayout]);

  const deferredFeedQuery = useDeferredValue(feedQuery.trim().toLowerCase());
  const deferredSourceQuery = useDeferredValue(sourceQuery.trim().toLowerCase());

  const {
    allSelected,
    getSourceSelectionState,
    selectedChannelKeys,
    selectedChannelSet,
    selectedSourceIds,
    toggleAll,
    toggleChannel,
    toggleSource,
  } = useSourceSelection(sourceCatalog);

  const { refreshAll } = useRefreshController({
    autoRefresh: appRuntimeConfig.autoRefresh,
    refresh,
    snapshot,
    sourceMode: appRuntimeConfig.sourceMode,
  });

  const deferredSelectedSourceIds = useDeferredValue(selectedSourceIds);
  const deferredSelectedChannelKeys = useDeferredValue(selectedChannelKeys);

  const sourceNamesById = useMemo(
    () =>
      Object.fromEntries(sourceCatalog.map((source) => [source.id, source.name])) as Record<
        string,
        string
      >,
    [],
  );
  const indexedItems = useMemo(
    () => buildFeedIndex(snapshot?.items ?? [], sourceNamesById),
    [snapshot?.items, sourceNamesById],
  );
  const itemStats = useMemo(() => buildItemStats(snapshot?.items ?? []), [snapshot?.items]);
  const filteredSources = useMemo(
    () => sourceCatalog.filter((source) => matchesSourceQuery(source, deferredSourceQuery)),
    [deferredSourceQuery],
  );
  const officialSearchScopeOptions = useMemo(
    () => [
      { id: "0", name: "所有站点" },
      ...sourceCatalog.map((source) => ({
        id: source.id,
        name: source.name,
      })),
    ],
    [],
  );
  const deferredSelectedSourceSet = useMemo(
    () => new Set(deferredSelectedSourceIds),
    [deferredSelectedSourceIds],
  );
  const deferredSelectedChannelSet = useMemo(
    () => new Set(deferredSelectedChannelKeys),
    [deferredSelectedChannelKeys],
  );
  const allFiltersSelected =
    deferredSelectedSourceIds.length === sourceCatalog.length &&
    deferredSelectedChannelKeys.length === totalSourceChannelCount;
  const visibleItems = useMemo(() => {
    if (!snapshot?.items || snapshot.items.length === 0) {
      return [];
    }

    if (allFiltersSelected && !deferredFeedQuery) {
      return snapshot.items;
    }

    return filterFeedIndex(
      indexedItems,
      deferredSelectedSourceSet,
      deferredSelectedChannelSet,
      deferredFeedQuery,
    );
  }, [
    allFiltersSelected,
    deferredFeedQuery,
    deferredSelectedChannelSet,
    deferredSelectedSourceSet,
    indexedItems,
    snapshot?.items,
  ]);

  const feedResetKey = useMemo(
    () =>
      [
        snapshot?.updatedAt ?? "empty",
        deferredFeedQuery,
        deferredSelectedSourceIds.join("|"),
        deferredSelectedChannelKeys.join("|"),
      ].join("::"),
    [
      deferredFeedQuery,
      deferredSelectedChannelKeys,
      deferredSelectedSourceIds,
      snapshot?.updatedAt,
    ],
  );
  const { canLoadMore, renderedCount, sentinelRef } = useIncrementalFeedWindow(
    visibleItems.length,
    feedResetKey,
  );
  const renderedItems = useMemo(
    () => visibleItems.slice(0, renderedCount),
    [renderedCount, visibleItems],
  );

  const feedLabelId = useId();
  const sourceLabelId = useId();
  const searchDialogId = useId();
  const sourcePanelCollapsedOnDesktop = !useDrawerLayout && sourcePanelCollapsed;

  return (
    <main className="app">
      <div
        aria-hidden={!(useDrawerLayout && drawerOpen)}
        className={`app__scrim ${useDrawerLayout && drawerOpen ? "is-visible" : ""}`}
        onClick={() => setDrawerOpen(false)}
      />

      <header className="topbar">
        <div className="topbar__brand">
          <span className="topbar__eyebrow">北师大珠海校区公开信息</span>
          <h1>BNUZ Feed</h1>
          <p>把多个公开站点的通知、新闻与栏目内容整理到同一个阅读入口。</p>
        </div>
        <div className="topbar__actions">
          <div className="topbar__search">
            <button
              aria-controls={searchDialogOpen ? searchDialogId : undefined}
              aria-expanded={searchDialogOpen}
              aria-haspopup="dialog"
              className="button button--tonal"
              onClick={() => setSearchDialogOpen((current) => !current)}
              ref={searchButtonRef}
              type="button"
            >
              全站检索
            </button>
            <OfficialSearchDialog
              dialogId={searchDialogId}
              initialQuery={feedQuery}
              onClose={() => setSearchDialogOpen(false)}
              open={searchDialogOpen}
              scopeOptions={officialSearchScopeOptions}
              triggerRef={searchButtonRef}
            />
          </div>
          {useDrawerLayout ? (
            <button
              className="button button--tonal topbar__drawer-toggle"
              onClick={() => setDrawerOpen(true)}
              type="button"
            >
              选择栏目
            </button>
          ) : null}
          <button
            className="button button--filled"
            disabled={refreshing}
            onClick={() => {
              void refreshAll();
            }}
            type="button"
          >
            {refreshing ? "更新中..." : "更新内容"}
          </button>
        </div>
      </header>

      <section className="intro-card">
        <div className="intro-card__main">
          <h2>按站点结构筛选你真正关心的信息</h2>
          <p>默认已选中全部 43 个可用站点，你可以随时只保留自己真正关心的栏目。</p>
        </div>
        <div className="intro-metrics">
          <article className="metric-card">
            <span>信息源</span>
            <strong>{sourceCatalog.length}</strong>
          </article>
          <article className="metric-card">
            <span>栏目</span>
            <strong>{totalSourceChannelCount}</strong>
          </article>
          <article className="metric-card">
            <span>当前显示</span>
            <strong>{visibleItems.length}</strong>
          </article>
          <article className="metric-card metric-card--wide">
            <span>最近更新</span>
            <strong>{formatDateTime(snapshot?.updatedAt)}</strong>
          </article>
        </div>
      </section>

      <div className={`layout ${sourcePanelCollapsedOnDesktop ? "layout--collapsed" : ""}`}>
        <aside
          aria-hidden={useDrawerLayout ? !drawerOpen : undefined}
          className={`source-panel ${useDrawerLayout && drawerOpen ? "is-open" : ""} ${sourcePanelCollapsedOnDesktop ? "is-collapsed" : ""}`}
        >
          <div className="source-panel__header">
            <div>
              <span className="source-panel__eyebrow">信息源筛选</span>
              <h3>按站点和栏目勾选</h3>
            </div>
            {!useDrawerLayout ? (
              <button
                aria-expanded={!sourcePanelCollapsedOnDesktop}
                className="icon-button source-panel__toggle"
                onClick={() => setSourcePanelCollapsed((current) => !current)}
                type="button"
              >
                {sourcePanelCollapsedOnDesktop ? "展开" : "收起"}
              </button>
            ) : null}
            {useDrawerLayout ? (
              <button
                className="icon-button source-panel__close"
                onClick={() => setDrawerOpen(false)}
                type="button"
              >
                关闭
              </button>
            ) : null}
          </div>

          {sourcePanelCollapsedOnDesktop ? (
            <div className="source-panel__collapsed">
              <div className="source-panel__collapsed-stat">
                <span>站点</span>
                <strong>{selectedSourceIds.length}</strong>
              </div>
              <div className="source-panel__collapsed-stat">
                <span>栏目</span>
                <strong>{selectedChannelKeys.length}</strong>
              </div>
              <button
                className="button button--text source-panel__collapsed-reset"
                onClick={() => toggleAll(true)}
                type="button"
              >
                默认
              </button>
            </div>
          ) : (
            <>
          <label
            aria-labelledby={sourceLabelId}
            className="field"
          >
            <span id={sourceLabelId}>搜索站点或栏目</span>
            <input
              onChange={(event) => setSourceQuery(event.target.value)}
              placeholder="例如：教务部、国际交流、通知公告"
              type="search"
              value={sourceQuery}
            />
          </label>

          <div className="source-panel__toolbar">
            <label className="source-toggle">
              <SelectionCheckbox
                checked={allSelected}
                indeterminate={!allSelected && selectedSourceIds.length > 0}
                onChange={(event) => toggleAll(event.target.checked)}
              />
              <span>全选</span>
            </label>
            <button
              className="button button--text"
              onClick={() => toggleAll(true)}
              type="button"
            >
              恢复默认
            </button>
          </div>

          <div className="source-panel__summary">
            <span>
              {selectedSourceIds.length} / {sourceCatalog.length} 个站点已启用
            </span>
          </div>

          <div className="source-tree">
            {filteredSources.map((source) => {
              const selectionState = getSourceSelectionState(source);

              return (
                <section
                  className="source-tree__card"
                  key={source.id}
                >
                  <div className="source-tree__header">
                    <label className="source-toggle">
                      <SelectionCheckbox
                        checked={selectionState === "all"}
                        indeterminate={selectionState === "partial"}
                        onChange={(event) => toggleSource(source, event.target.checked)}
                      />
                      <div>
                        <strong>{source.name}</strong>
                        <span>{source.fetchTargetCount} 个入口</span>
                      </div>
                    </label>
                    <span className="source-tree__count">
                      {itemStats.sourceCounts[source.id] ?? 0}
                    </span>
                  </div>

                  <div className="channel-grid">
                    {source.channels.map((channel) => {
                      const channelKey = `${source.id}::${channel.label}`;

                      return (
                        <label
                          className="channel-chip"
                          key={channelKey}
                        >
                          <SelectionCheckbox
                            checked={selectedChannelSet.has(channelKey)}
                            onChange={(event) =>
                              toggleChannel(source, channel.label, event.target.checked)
                            }
                          />
                          <span>{channel.label}</span>
                          <small>{itemStats.channelCounts[channelKey] ?? 0}</small>
                        </label>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
            </>
          )}
        </aside>

        <section className="content">
          <div className="content__toolbar">
            <label
              aria-labelledby={feedLabelId}
              className="field"
            >
              <span id={feedLabelId}>搜索当前内容</span>
              <input
                onChange={(event) => setFeedQuery(event.target.value)}
                placeholder="搜索标题、摘要、站点或栏目"
                type="search"
                value={feedQuery}
              />
            </label>
            <div className="content__meta">
              <span>{visibleItems.length} 条内容</span>
              <span>已渲染 {renderedCount} 条</span>
              {error ? <span>当前展示最近一次成功同步的内容</span> : null}
            </div>
          </div>

          {visibleItems.length > 0 ? (
            <>
              <div className="feed-list">
                {renderedItems.map((item) => {
                  const primarySource =
                    sourceCatalogById[item.sourceId] ??
                    item.sourceIds
                      .map((sourceId) => sourceCatalogById[sourceId])
                      .find((source) => source !== undefined);

                  return (
                    <article
                      className="feed-card"
                      key={item.id}
                      onClick={() => window.open(item.url, "_blank", "noopener,noreferrer")}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          window.open(item.url, "_blank", "noopener,noreferrer");
                        }
                      }}
                      role="link"
                      tabIndex={0}
                    >
                      <div className="feed-card__meta">
                        <span className="feed-chip feed-chip--source">
                          {primarySource?.name ?? item.sourceId}
                        </span>
                        <span className="feed-chip">
                          {item.channel?.trim() || defaultChannelLabel}
                        </span>
                        <span className="feed-card__date">
                          {formatPublishedAt(item.publishedAt)}
                        </span>
                      </div>
                      <h3>{item.title}</h3>
                      {item.summary ? <p>{item.summary}</p> : null}
                      <div className="feed-card__footer">
                        <span>更新于 {formatDateTime(item.fetchedAt)}</span>
                        <a
                          className="button button--text"
                          href={item.url}
                          onClick={(event) => event.stopPropagation()}
                          onKeyDown={(event) => event.stopPropagation()}
                          rel="noreferrer"
                          target="_blank"
                        >
                          查看原文
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>

              {canLoadMore ? (
                <div className="feed-list__footer">
                  <span>继续向下滚动会自动加载更多内容</span>
                  <div
                    aria-hidden="true"
                    className="feed-list__sentinel"
                    ref={sentinelRef}
                  />
                </div>
              ) : null}
            </>
          ) : (
            <div className="empty-state">
              <strong>当前筛选条件下没有可显示的内容。</strong>
              <span>可以恢复默认筛选，或者换一个关键词再试。</span>
            </div>
          )}
        </section>
      </div>

    </main>
  );
}

export default function App() {
  return (
    <FeedProvider
      autoRefresh={false}
      service={aggregationService}
    >
      <RuntimeShell />
    </FeedProvider>
  );
}
