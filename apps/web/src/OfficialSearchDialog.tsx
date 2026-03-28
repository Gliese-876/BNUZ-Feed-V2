import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

import {
  allSiteSearchId,
  officialSiteSearchUrl,
  submitOfficialSiteSearch,
  type OfficialSiteSearchParams,
  type OfficialSiteSearchMatchMode,
} from "./siteSearch";
import { FadingTextInput } from "./FadingTextInput";

const dialogGap = 20;
const dialogOffset = 12;
const dialogMaxWidth = 720;
const dialogMinHeight = 320;
const selectMenuMaxHeight = 280;

interface DialogSelectOption {
  label: string;
  value: string;
}

const matchModeOptions: DialogSelectOption[] = [
  { label: "精确", value: "exact" },
  { label: "模糊", value: "fuzzy" },
];

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

function hasCompoundSearchInput(form: SearchFormState): boolean {
  return (
    form.keyword.trim().length > 0 ||
    form.title.trim().length > 0 ||
    form.content.trim().length > 0 ||
    form.startDate.trim().length > 0 ||
    form.endDate.trim().length > 0
  );
}

function resolveRowsForSubmission(form: SearchFormState): number | undefined {
  const normalizedRows = form.rows.trim();

  if (!normalizedRows) {
    return undefined;
  }

  if (!hasCompoundSearchInput(form) && normalizedRows === "10") {
    return undefined;
  }

  return Number(normalizedRows);
}

function buildSearchSubmitParams(form: SearchFormState): OfficialSiteSearchParams {
  return {
    content: form.content,
    contentMatchMode: form.contentMatchMode,
    endDate: form.endDate,
    keyword: form.keyword,
    keywordMatchMode: form.keywordMatchMode,
    query: form.query,
    queryMatchMode: form.queryMatchMode,
    rows: resolveRowsForSubmission(form),
    siteId: form.siteId,
    startDate: form.startDate,
    title: form.title,
    titleMatchMode: form.titleMatchMode,
  };
}

interface DialogSelectProps {
  id: string;
  labelId: string;
  onChange: (value: string) => void;
  options: readonly DialogSelectOption[];
  value: string;
}

interface DialogDateInputProps {
  id: string;
  label: string;
  labelId: string;
  onChange: (value: string) => void;
  value: string;
}

function DialogSelect({ id, labelId, onChange, options, value }: DialogSelectProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listboxId = `${id}-listbox`;
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const selectedOption = options[selectedIndex] ?? options[0];
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});

  useEffect(() => {
    if (!open) {
      return;
    }

    const syncMenuStyle = () => {
      const triggerRect = buttonRef.current?.getBoundingClientRect();

      if (!triggerRect) {
        return;
      }

      const viewportGap = 16;
      const left = Math.round(
        Math.max(
          viewportGap,
          Math.min(triggerRect.left, window.innerWidth - viewportGap - triggerRect.width),
        ),
      );
      const top = Math.round(triggerRect.bottom + 8);

      setMenuStyle({
        left: `${left}px`,
        maxHeight: `${selectMenuMaxHeight}px`,
        top: `${top}px`,
        width: `${Math.round(triggerRect.width)}px`,
      });
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (
        !(target instanceof Node) ||
        (!containerRef.current?.contains(target) && !menuRef.current?.contains(target))
      ) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    syncMenuStyle();
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", syncMenuStyle);
    window.addEventListener("scroll", syncMenuStyle, true);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", syncMenuStyle);
      window.removeEventListener("scroll", syncMenuStyle, true);
    };
  }, [open]);

  const commitValue = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
    window.requestAnimationFrame(() => {
      buttonRef.current?.focus();
    });
  };

  const moveSelection = (delta: number) => {
    const nextIndex = Math.min(options.length - 1, Math.max(0, selectedIndex + delta));
    const nextOption = options[nextIndex];

    if (nextOption && nextOption.value !== value) {
      onChange(nextOption.value);
    }

    setOpen(true);
  };

  const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveSelection(1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveSelection(-1);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen((current) => !current);
      return;
    }

    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
    }
  };

  const handleOptionMouseDown = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  return (
    <div
      className={`field__control field__select-control ${open ? "is-open" : ""}`}
      ref={containerRef}
    >
      <button
        aria-controls={listboxId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-labelledby={labelId}
        className="field__select-trigger"
        id={id}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleTriggerKeyDown}
        ref={buttonRef}
        role="combobox"
        type="button"
      >
        <span className="field__select-value">{selectedOption?.label ?? ""}</span>
      </button>
      <span
        aria-hidden="true"
        className="field__select-chevron"
      />
      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              aria-labelledby={labelId}
              className="field__select-menu"
              id={listboxId}
              ref={menuRef}
              role="listbox"
              style={menuStyle}
            >
              {options.map((option) => (
                <button
                  aria-selected={option.value === selectedOption?.value}
                  className={`field__select-option ${option.value === selectedOption?.value ? "is-selected" : ""}`}
                  key={option.value}
                  onClick={() => commitValue(option.value)}
                  onMouseDown={handleOptionMouseDown}
                  role="option"
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function DialogDateInput({ id, label, labelId, onChange, value }: DialogDateInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (!(target instanceof Node) || !containerRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  const openPicker = () => {
    const input = inputRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;

    if (!input) {
      return;
    }

    if (typeof input.showPicker === "function") {
      input.showPicker();
    } else {
      input.click();
    }
    setOpen(true);
  };

  const closePicker = () => {
    inputRef.current?.blur();
    setOpen(false);
  };

  const handleToggleMouseDown = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  return (
    <div
      className={`field__control field__date-control ${open ? "is-open" : ""}`}
      ref={containerRef}
    >
      <input
        aria-hidden="true"
        className="field__date-native"
        id={`${id}-native`}
        onBlur={() => setOpen(false)}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
          }
        }}
        ref={inputRef}
        tabIndex={-1}
        type="date"
        value={value}
      />
      <button
        aria-labelledby={labelId}
        className={`field__date-trigger ${value ? "has-value" : ""}`}
        id={id}
        onClick={() => {
          if (open) {
            closePicker();
            return;
          }

          openPicker();
        }}
        onMouseDown={handleToggleMouseDown}
        type="button"
      >
        <span className="field__date-value">{value || "请选择日期"}</span>
        <span
          aria-hidden="true"
          className="field__date-icon"
        />
      </button>
    </div>
  );
}

function buildDialogStyle(triggerRef: RefObject<HTMLButtonElement | null>): CSSProperties {
  if (typeof window === "undefined") {
    return {};
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const horizontalGap = viewportWidth <= 640 ? 14 : dialogGap;
  const verticalGap = viewportWidth <= 640 ? 14 : dialogGap;
  const dialogWidth = Math.min(dialogMaxWidth, viewportWidth - horizontalGap * 2);
  const triggerRect = triggerRef.current?.getBoundingClientRect();
  const top = Math.round(
    Math.max(
      verticalGap,
      Math.min(
        (triggerRect?.bottom ?? verticalGap) + dialogOffset,
        viewportHeight - verticalGap - dialogMinHeight,
      ),
    ),
  );
  const left = Math.round(
    Math.max(
      horizontalGap,
      Math.min(
        (triggerRect?.right ?? viewportWidth - horizontalGap) - dialogWidth,
        viewportWidth - horizontalGap - dialogWidth,
      ),
    ),
  );
  const maxHeight = Math.max(0, viewportHeight - top - verticalGap);

  return {
    left: `${left}px`,
    maxHeight: `${Math.round(maxHeight)}px`,
    top: `${top}px`,
    width: `${Math.round(dialogWidth)}px`,
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
  const [dialogStyle, setDialogStyle] = useState<CSSProperties>({});
  const titleId = useId();
  const descriptionId = useId();
  const fieldIdBase = useId();
  const queryFieldId = `${fieldIdBase}-query`;
  const siteFieldId = `${fieldIdBase}-site`;
  const siteFieldLabelId = `${fieldIdBase}-site-label`;
  const queryMatchModeFieldId = `${fieldIdBase}-query-match`;
  const queryMatchModeFieldLabelId = `${fieldIdBase}-query-match-label`;
  const keywordFieldId = `${fieldIdBase}-keyword`;
  const keywordMatchModeFieldId = `${fieldIdBase}-keyword-match`;
  const keywordMatchModeFieldLabelId = `${fieldIdBase}-keyword-match-label`;
  const titleFieldId = `${fieldIdBase}-title`;
  const titleMatchModeFieldId = `${fieldIdBase}-title-match`;
  const titleMatchModeFieldLabelId = `${fieldIdBase}-title-match-label`;
  const contentFieldId = `${fieldIdBase}-content`;
  const contentMatchModeFieldId = `${fieldIdBase}-content-match`;
  const contentMatchModeFieldLabelId = `${fieldIdBase}-content-match-label`;
  const startDateFieldId = `${fieldIdBase}-start-date`;
  const startDateFieldLabelId = `${fieldIdBase}-start-date-label`;
  const endDateFieldId = `${fieldIdBase}-end-date`;
  const endDateFieldLabelId = `${fieldIdBase}-end-date-label`;
  const rowsFieldId = `${fieldIdBase}-rows`;

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

    const syncDialogStyle = () => {
      setDialogStyle(buildDialogStyle(triggerRef));
    };

    syncDialogStyle();
    window.addEventListener("resize", syncDialogStyle);
    window.addEventListener("scroll", syncDialogStyle, true);
    return () => {
      window.removeEventListener("resize", syncDialogStyle);
      window.removeEventListener("scroll", syncDialogStyle, true);
    };
  }, [open, triggerRef]);

  if (!open || typeof document === "undefined") {
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

    const submitted = submitOfficialSiteSearch(buildSearchSubmitParams(form));

    if (!submitted) {
      setError("请至少填写搜索词、关键词、标题或正文中的一项。");
      return;
    }

    onClose();
  };

  return createPortal(
    <>
      <div
        aria-hidden="true"
        className="search-dialog__backdrop"
        onClick={onClose}
      />
      <section
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        className="search-dialog"
        id={dialogId}
        role="dialog"
        style={dialogStyle}
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
            <div className="field">
              <label htmlFor={queryFieldId}>搜索词</label>
              <FadingTextInput
                autoFocus
                id={queryFieldId}
                onChange={(event) => updateField("query", event.target.value)}
                placeholder="例如：奖学金、交换、通知公告"
                type="search"
                value={form.query}
              />
            </div>

            <div className="field">
              <label
                htmlFor={siteFieldId}
                id={siteFieldLabelId}
              >
                站点范围
              </label>
              <DialogSelect
                id={siteFieldId}
                labelId={siteFieldLabelId}
                onChange={(nextValue) => updateField("siteId", nextValue)}
                options={scopeOptions.map((option) => ({
                  label: option.name,
                  value: option.id,
                }))}
                value={form.siteId}
              />
            </div>

            <div className="field">
              <label
                htmlFor={queryMatchModeFieldId}
                id={queryMatchModeFieldLabelId}
              >
                关键词匹配
              </label>
              <DialogSelect
                id={queryMatchModeFieldId}
                labelId={queryMatchModeFieldLabelId}
                onChange={(nextValue) =>
                  updateField("queryMatchMode", nextValue as OfficialSiteSearchMatchMode)
                }
                options={matchModeOptions}
                value={form.queryMatchMode}
              />
            </div>
          </div>

          <details className="search-dialog__advanced">
            <summary>复合检索</summary>
            <p className="search-dialog__hint">
              可选补充关键词、标题、正文、时间区间和每页条数，对应官方搜索页的复合检索能力。
            </p>

            <div className="search-dialog__advanced-grid">
              <div className="field">
                <label htmlFor={keywordFieldId}>关键词</label>
                <FadingTextInput
                  id={keywordFieldId}
                  onChange={(event) => updateField("keyword", event.target.value)}
                  placeholder="请输入关键词"
                  type="search"
                  value={form.keyword}
                />
              </div>

              <div className="field">
                <label
                  htmlFor={keywordMatchModeFieldId}
                  id={keywordMatchModeFieldLabelId}
                >
                  关键词匹配
                </label>
                <DialogSelect
                  id={keywordMatchModeFieldId}
                  labelId={keywordMatchModeFieldLabelId}
                  onChange={(nextValue) =>
                    updateField("keywordMatchMode", nextValue as OfficialSiteSearchMatchMode)
                  }
                  options={matchModeOptions}
                  value={form.keywordMatchMode}
                />
              </div>

              <div className="field">
                <label htmlFor={titleFieldId}>标题</label>
                <FadingTextInput
                  id={titleFieldId}
                  onChange={(event) => updateField("title", event.target.value)}
                  placeholder="请输入标题"
                  type="search"
                  value={form.title}
                />
              </div>

              <div className="field">
                <label
                  htmlFor={titleMatchModeFieldId}
                  id={titleMatchModeFieldLabelId}
                >
                  标题匹配
                </label>
                <DialogSelect
                  id={titleMatchModeFieldId}
                  labelId={titleMatchModeFieldLabelId}
                  onChange={(nextValue) =>
                    updateField("titleMatchMode", nextValue as OfficialSiteSearchMatchMode)
                  }
                  options={matchModeOptions}
                  value={form.titleMatchMode}
                />
              </div>

              <div className="field search-dialog__advanced-field">
                <label htmlFor={contentFieldId}>正文</label>
                <FadingTextInput
                  id={contentFieldId}
                  onChange={(event) => updateField("content", event.target.value)}
                  placeholder="请输入正文关键词"
                  type="search"
                  value={form.content}
                />
              </div>

              <div className="field">
                <label
                  htmlFor={contentMatchModeFieldId}
                  id={contentMatchModeFieldLabelId}
                >
                  正文匹配
                </label>
                <DialogSelect
                  id={contentMatchModeFieldId}
                  labelId={contentMatchModeFieldLabelId}
                  onChange={(nextValue) =>
                    updateField("contentMatchMode", nextValue as OfficialSiteSearchMatchMode)
                  }
                  options={matchModeOptions}
                  value={form.contentMatchMode}
                />
              </div>

              <div className="field">
                <label
                  htmlFor={startDateFieldId}
                  id={startDateFieldLabelId}
                >
                  开始时间
                </label>
                <DialogDateInput
                  id={startDateFieldId}
                  label="开始时间"
                  labelId={startDateFieldLabelId}
                  onChange={(nextValue) => updateField("startDate", nextValue)}
                  value={form.startDate}
                />
              </div>

              <div className="field">
                <label
                  htmlFor={endDateFieldId}
                  id={endDateFieldLabelId}
                >
                  结束时间
                </label>
                <DialogDateInput
                  id={endDateFieldId}
                  label="结束时间"
                  labelId={endDateFieldLabelId}
                  onChange={(nextValue) => updateField("endDate", nextValue)}
                  value={form.endDate}
                />
              </div>

              <div className="field">
                <label htmlFor={rowsFieldId}>每页条数</label>
                <input
                  id={rowsFieldId}
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
    </>,
    document.body,
  );
}
