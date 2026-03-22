import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type RefObject,
} from "react";

import {
  allSiteSearchId,
  officialSiteSearchUrl,
  submitOfficialSiteSearch,
  type OfficialSiteSearchMatchMode,
} from "./siteSearch";

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

interface SearchFormState {
  content: string;
  contentMatchMode: OfficialSiteSearchMatchMode;
  endDate: string;
  keyword: string;
  keywordMatchMode: OfficialSiteSearchMatchMode;
  query: string;
  queryMatchMode: OfficialSiteSearchMatchMode;
  rows: string;
  siteId: string;
  startDate: string;
  title: string;
  titleMatchMode: OfficialSiteSearchMatchMode;
}

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
  const queryInputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(createInitialFormState(initialQuery));
    setError("");
  }, [initialQuery, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    queryInputRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (dialogRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }

      onClose();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [onClose, open, triggerRef]);

  if (!open) {
    return null;
  }

  const updateField = <Key extends keyof SearchFormState>(
    field: Key,
    value: SearchFormState[Key],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const submitted = submitOfficialSiteSearch({
      content: form.content,
      contentMatchMode: form.contentMatchMode,
      endDate: form.endDate,
      keyword: form.keyword,
      keywordMatchMode: form.keywordMatchMode,
      query: form.query,
      queryMatchMode: form.queryMatchMode,
      rows: form.rows.trim() ? Number(form.rows) : undefined,
      siteId: form.siteId,
      startDate: form.startDate,
      title: form.title,
      titleMatchMode: form.titleMatchMode,
    });

    if (!submitted) {
      setError("请至少填写搜索词、关键词、标题或正文中的一项。");
      return;
    }

    onClose();
  };

  return (
    <section
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      className="search-dialog"
      id={dialogId}
      ref={dialogRef}
      role="dialog"
    >
      <div className="search-dialog__header">
        <div>
          <span className="source-panel__eyebrow">全站检索</span>
          <h2 id={titleId}>搜索全站或单个站点</h2>
        </div>
        <button
          className="icon-button"
          onClick={onClose}
          type="button"
        >
          关闭
        </button>
      </div>

      <p
        className="search-dialog__description"
        id={descriptionId}
      >
        这里直接封装校区官方搜索。结果会在新标签页打开，时间、位置和排序等进一步筛选仍可在结果页继续调整。
      </p>

      <form
        className="search-dialog__form"
        onSubmit={handleSubmit}
      >
        <div className="search-dialog__grid">
          <label className="field">
            <span>搜索词</span>
            <input
              onChange={(event) => updateField("query", event.target.value)}
              placeholder="例如：奖学金、交换、通知公告"
              ref={queryInputRef}
              type="search"
              value={form.query}
            />
          </label>

          <label className="field">
            <span>站点范围</span>
            <select
              onChange={(event) => updateField("siteId", event.target.value)}
              value={form.siteId}
            >
              {scopeOptions.map((option) => (
                <option
                  key={option.id}
                  value={option.id}
                >
                  {option.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>关键词匹配</span>
            <select
              onChange={(event) =>
                updateField(
                  "queryMatchMode",
                  event.target.value as OfficialSiteSearchMatchMode,
                )
              }
              value={form.queryMatchMode}
            >
              <option value="exact">精确</option>
              <option value="fuzzy">模糊</option>
            </select>
          </label>
        </div>

        <details className="search-dialog__advanced">
          <summary>复合检索</summary>
          <p className="search-dialog__hint">
            可选补充关键词、标题、正文、时间区间和每页条数，对应官方搜索页的复合检索能力。
          </p>

          <div className="search-dialog__advanced-grid">
            <label className="field">
              <span>关键词</span>
              <input
                onChange={(event) => updateField("keyword", event.target.value)}
                placeholder="请输入关键词"
                type="search"
                value={form.keyword}
              />
            </label>

            <label className="field">
              <span>关键词匹配</span>
              <select
                onChange={(event) =>
                  updateField(
                    "keywordMatchMode",
                    event.target.value as OfficialSiteSearchMatchMode,
                  )
                }
                value={form.keywordMatchMode}
              >
                <option value="exact">精确</option>
                <option value="fuzzy">模糊</option>
              </select>
            </label>

            <label className="field">
              <span>标题</span>
              <input
                onChange={(event) => updateField("title", event.target.value)}
                placeholder="请输入标题"
                type="search"
                value={form.title}
              />
            </label>

            <label className="field">
              <span>标题匹配</span>
              <select
                onChange={(event) =>
                  updateField(
                    "titleMatchMode",
                    event.target.value as OfficialSiteSearchMatchMode,
                  )
                }
                value={form.titleMatchMode}
              >
                <option value="exact">精确</option>
                <option value="fuzzy">模糊</option>
              </select>
            </label>

            <label className="field search-dialog__advanced-field">
              <span>正文</span>
              <input
                onChange={(event) => updateField("content", event.target.value)}
                placeholder="请输入正文关键词"
                type="search"
                value={form.content}
              />
            </label>

            <label className="field">
              <span>正文匹配</span>
              <select
                onChange={(event) =>
                  updateField(
                    "contentMatchMode",
                    event.target.value as OfficialSiteSearchMatchMode,
                  )
                }
                value={form.contentMatchMode}
              >
                <option value="exact">精确</option>
                <option value="fuzzy">模糊</option>
              </select>
            </label>

            <label className="field">
              <span>开始时间</span>
              <input
                onChange={(event) => updateField("startDate", event.target.value)}
                type="date"
                value={form.startDate}
              />
            </label>

            <label className="field">
              <span>结束时间</span>
              <input
                onChange={(event) => updateField("endDate", event.target.value)}
                type="date"
                value={form.endDate}
              />
            </label>

            <label className="field">
              <span>每页条数</span>
              <input
                max="500"
                min="1"
                onChange={(event) => updateField("rows", event.target.value)}
                step="1"
                type="number"
                value={form.rows}
              />
            </label>
          </div>
        </details>

        {error ? <p className="search-dialog__error">{error}</p> : null}

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
            <button
              className="button button--text"
              onClick={onClose}
              type="button"
            >
              取消
            </button>
            <button
              className="button button--filled"
              type="submit"
            >
              开始检索
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
