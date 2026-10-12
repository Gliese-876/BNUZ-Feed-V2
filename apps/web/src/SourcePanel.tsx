import { useDeferredValue, useEffect, useId, useMemo, useRef, useState, type InputHTMLAttributes, type RefObject } from "react";
import { createPortal } from "react-dom";

import { sourceCatalog, type FeedItemStats } from "./sourceCatalog";
import type { useSourceSelection } from "./useSourceSelection";
import { useModalFocus } from "./useModalFocus";

type Selection = ReturnType<typeof useSourceSelection>;

function SelectionCheckbox({ indeterminate = false, ...props }: InputHTMLAttributes<HTMLInputElement> & { indeterminate?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return <input {...props} ref={ref} type="checkbox" />;
}

interface SourcePanelProps {
  id: string;
  itemStats: FeedItemStats;
  onClose: () => void;
  open: boolean;
  selection: Selection;
  triggerRef: RefObject<HTMLButtonElement | null>;
}

export function SourcePanel({ id, itemStats, onClose, open, selection, triggerRef }: SourcePanelProps) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const sources = useMemo(() => sourceCatalog.filter((source) => source.searchText.includes(deferredQuery)), [deferredQuery]);
  const panelRef = useRef<HTMLElement>(null);
  const titleId = useId();
  const searchId = useId();
  useModalFocus(open, panelRef, onClose, triggerRef);

  if (!open) return null;

  return createPortal(
    <>
      <div aria-hidden="true" className="app__scrim" data-modal-backdrop onClick={onClose} />
      <section aria-labelledby={titleId} aria-modal="true" className="source-panel" id={id} ref={panelRef} role="dialog" tabIndex={-1}>
        <header className="source-panel__header">
          <div>
            <span className="source-panel__eyebrow">定制你的阅读范围</span>
            <h2 id={titleId}>站点与栏目</h2>
          </div>
          <button aria-label="关闭栏目筛选" className="icon-button source-panel__close" onClick={onClose} type="button">关闭</button>
        </header>
        <div className="source-panel__body">
          <label className="field" htmlFor={searchId}>
            <span>搜索站点或栏目</span>
            <input id={searchId} onChange={(event) => setQuery(event.target.value)} placeholder="例如：教务部、通知公告" type="search" value={query} />
          </label>
          <div className="source-panel__toolbar">
            <label className="source-toggle">
              <SelectionCheckbox checked={selection.allSelected} indeterminate={!selection.allSelected && selection.selectedSourceIds.length > 0} onChange={(event) => selection.toggleAll(event.target.checked)} />
              <span>全选站点</span>
            </label>
            <button className="button button--text" onClick={selection.resetDefault} type="button">恢复学生精选</button>
          </div>
          <p className="source-panel__summary">{selection.selectedSourceIds.length} / {sourceCatalog.length} 个站点已启用 · 数字为原始条数</p>
          <div className="source-tree">
            {sources.map((source) => {
              const state = selection.getSourceSelectionState(source);
              return (
                <section className="source-tree__card" key={source.id}>
                  <div className="source-tree__header">
                    <label className="source-toggle">
                      <SelectionCheckbox checked={state === "all"} indeterminate={state === "partial"} onChange={(event) => selection.toggleSource(source, event.target.checked)} />
                      <strong>{source.name}</strong>
                    </label>
                    <span className="source-tree__count">{itemStats.sourceCounts[source.id] ?? 0}</span>
                  </div>
                  <div className="channel-grid">
                    {source.channels.map((channel) => {
                      const channelKey = `${source.id}::${channel.label}`;
                      return (
                        <label className="channel-chip" key={channelKey}>
                          <SelectionCheckbox checked={selection.selectedChannelSet.has(channelKey)} onChange={(event) => selection.toggleChannel(source, channel.label, event.target.checked)} />
                          <span>{channel.label}</span>
                          <small>{itemStats.channelCounts[channelKey] ?? 0}</small>
                        </label>
                      );
                    })}
                  </div>
                </section>
              );
            })}
            {sources.length === 0 ? <p className="source-panel__summary" role="status">没有匹配的站点或栏目，请换一个关键词。</p> : null}
          </div>
        </div>
        <footer className="source-panel__footer"><span>筛选会自动保存在此设备</span><button className="button button--filled" onClick={onClose} type="button">完成筛选</button></footer>
      </section>
    </>,
    document.body,
  );
}
