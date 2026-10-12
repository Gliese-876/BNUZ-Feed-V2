import { Fragment, useEffect, useId, useRef, useState, type FormEvent, type RefObject } from "react";
import { createPortal } from "react-dom";

import {
  allSiteSearchId,
  officialSiteSearchUrl,
  submitOfficialSiteSearch,
  type OfficialSiteSearchParams,
  type OfficialSiteSearchMatchMode,
} from "./siteSearch";
import { useModalFocus } from "./useModalFocus";

export interface OfficialSearchScopeOption {
  id: string;
  name: string;
}

interface OfficialSearchDialogProps {
  dialogId: string;
  initialQuery: string;
  onClose: () => void;
  open: boolean;
  scopeOptions: OfficialSearchScopeOption[];
  triggerRef: RefObject<HTMLButtonElement | null>;
}

type SearchTextField = "query" | "keyword" | "title" | "content";
type MatchModeField = `${SearchTextField}MatchMode`;
type SearchFormState = Record<SearchTextField | "startDate" | "endDate" | "rows" | "siteId", string> &
  Record<MatchModeField, OfficialSiteSearchMatchMode>;

const compoundFields = [
  { field: "keyword", label: "关键词", placeholder: "请输入关键词" },
  { field: "title", label: "标题", placeholder: "请输入标题" },
  { field: "content", label: "正文", placeholder: "请输入正文关键词" },
] as const;

function createInitialFormState(initialQuery: string): SearchFormState {
  return {
    content: "",
    contentMatchMode: "exact",
    endDate: "",
    keyword: "",
    keywordMatchMode: "exact",
    query: initialQuery.trim(),
    queryMatchMode: "exact",
    rows: "10",
    siteId: allSiteSearchId,
    startDate: "",
    title: "",
    titleMatchMode: "exact",
  };
}

function buildSearchSubmitParams(form: SearchFormState): OfficialSiteSearchParams {
  const rows = form.rows.trim();
  const hasCompoundInput = [form.keyword, form.title, form.content, form.startDate, form.endDate]
    .some((value) => value.trim());

  return {
    ...form,
    // The official service treats a supplied row count as a compound search.
    rows: !rows || (!hasCompoundInput && rows === "10") ? undefined : Number(rows),
  };
}

export function OfficialSearchDialog({
  dialogId,
  initialQuery,
  onClose,
  open,
  scopeOptions,
  triggerRef,
}: OfficialSearchDialogProps) {
  const [form, setForm] = useState(() => createInitialFormState(initialQuery));
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const fieldIdBase = useId();

  useModalFocus(open, dialogRef, onClose, triggerRef);

  useEffect(() => {
    if (open) {
      setForm(createInitialFormState(initialQuery));
      setError("");
    }
  }, [initialQuery, open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  const updateField = <Key extends keyof SearchFormState>(field: Key, value: SearchFormState[Key]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const renderTextField = (field: SearchTextField, label: string, placeholder: string) => (
    <div className="field">
      <label htmlFor={`${fieldIdBase}-${field}`}>{label}</label>
      <input
        autoFocus={field === "query"}
        id={`${fieldIdBase}-${field}`}
        onChange={(event) => updateField(field, event.target.value)}
        placeholder={placeholder}
        type="search"
        value={form[field]}
      />
    </div>
  );

  const renderMatchField = (field: SearchTextField, label: string) => {
    const key: MatchModeField = `${field}MatchMode`;
    const id = `${fieldIdBase}-${field}-match`;

    return (
      <div className="field">
        <label htmlFor={id}>{label}</label>
        <select
          className="field__select-trigger"
          id={id}
          onChange={(event) => updateField(key, event.target.value as OfficialSiteSearchMatchMode)}
          value={form[key]}
        >
          <option value="exact">精确</option>
          <option value="fuzzy">模糊</option>
        </select>
      </div>
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!submitOfficialSiteSearch(buildSearchSubmitParams(form))) {
      setError("请至少填写搜索词、关键词、标题或正文中的一项。");
      return;
    }

    onClose();
  };

  return createPortal(
    <>
      <div
        aria-hidden="true"
        className="search-dialog__backdrop is-open"
        data-modal-backdrop
        onClick={onClose}
      />
      <section
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="search-dialog is-open"
        id={dialogId}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="search-dialog__header">
          <div>
            <span className="source-panel__eyebrow">全站检索</span>
            <h2 id={titleId}>搜索全站或单个站点</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button">关闭</button>
        </div>

        <p className="search-dialog__description" id={descriptionId}>
          直接使用校区官方搜索，结果将在新标签页打开。更多筛选和排序可在结果页调整。
        </p>

        <form className="search-dialog__form" onSubmit={handleSubmit}>
          <div className="search-dialog__grid">
            {renderTextField("query", "搜索词", "例如：奖学金、交换、通知公告")}
            <div className="field">
              <label htmlFor={`${fieldIdBase}-site`}>站点范围</label>
              <select
                className="field__select-trigger"
                id={`${fieldIdBase}-site`}
                onChange={(event) => updateField("siteId", event.target.value)}
                value={form.siteId}
              >
                {scopeOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.name}</option>
                ))}
              </select>
            </div>
            {renderMatchField("query", "搜索词匹配")}
          </div>

          <details className="search-dialog__advanced">
            <summary>复合检索</summary>
            <p className="search-dialog__hint">可补充关键词、标题、正文、时间区间和每页条数。</p>
            <div className="search-dialog__advanced-grid">
              {compoundFields.map(({ field, label, placeholder }) => (
                <Fragment key={field}>
                  {renderTextField(field, label, placeholder)}
                  {renderMatchField(field, `${label}匹配`)}
                </Fragment>
              ))}
              {([
                ["startDate", "开始时间"],
                ["endDate", "结束时间"],
              ] as const).map(([field, label]) => (
                <div className="field" key={field}>
                  <label htmlFor={`${fieldIdBase}-${field}`}>{label}</label>
                  <input
                    className="field__date-native"
                    id={`${fieldIdBase}-${field}`}
                    onChange={(event) => updateField(field, event.target.value)}
                    type="date"
                    value={form[field]}
                  />
                </div>
              ))}
              <div className="field">
                <label htmlFor={`${fieldIdBase}-rows`}>每页条数</label>
                <input
                  id={`${fieldIdBase}-rows`}
                  max="500"
                  min="1"
                  onChange={(event) => updateField("rows", event.target.value)}
                  step="1"
                  type="number"
                  value={form.rows}
                />
              </div>
            </div>
          </details>

          {error ? <p className="search-dialog__error" role="alert">{error}</p> : null}

          <div className="search-dialog__actions">
            <a
              className="button button--text"
              href={officialSiteSearchUrl}
              rel="noreferrer"
              target="_blank"
            >
              打开原始搜索页
            </a>
            <div className="search-dialog__action-group">
              <button className="button button--text" onClick={onClose} type="button">取消</button>
              <button className="button button--filled" type="submit">开始检索</button>
            </div>
          </div>
        </form>
      </section>
    </>,
    document.body,
  );
}
