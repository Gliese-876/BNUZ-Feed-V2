// @vitest-environment jsdom

import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { submitOfficialSiteSearchMock } = vi.hoisted(() => ({
  submitOfficialSiteSearchMock: vi.fn(() => true),
}));

vi.mock("./siteSearch", async () => ({
  ...await vi.importActual<typeof import("./siteSearch")>("./siteSearch"),
  submitOfficialSiteSearch: submitOfficialSiteSearchMock,
}));

import { OfficialSearchDialog } from "./OfficialSearchDialog";

const defaultProps = {
  dialogId: "official-search-dialog",
  initialQuery: "seed",
  onClose: vi.fn(),
  open: true,
  scopeOptions: [
    { id: "0", name: "全部站点" },
    { id: "notice", name: "通知公告" },
  ],
  triggerRef: createRef<HTMLButtonElement>(),
};

function openAdvancedSearch() {
  fireEvent.click(screen.getByText("复合检索", { selector: "summary" }));
}

function submitSearch() {
  fireEvent.click(screen.getByRole("button", { name: "开始检索" }));
}

describe("OfficialSearchDialog", () => {
  beforeEach(() => {
    submitOfficialSiteSearchMock.mockReset().mockReturnValue(true);
    defaultProps.onClose.mockReset();
  });

  it("renders an accessible modal portal with native form controls", () => {
    render(<OfficialSearchDialog {...defaultProps} />);

    const dialog = screen.getByRole("dialog", { name: "搜索全站或单个站点" });
    expect(dialog.parentElement).toBe(document.body);
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleDescription(/官方搜索/);
    expect(screen.getByRole("searchbox", { name: "搜索词" })).toHaveValue("seed");
    expect(screen.getByRole("combobox", { name: "站点范围" }).tagName).toBe("SELECT");

    openAdvancedSearch();
    expect(screen.getByLabelText("开始时间")).toHaveAttribute("type", "date");
    expect(screen.getByLabelText("关键词", { exact: true })).toHaveAttribute("type", "search");
  });

  it("submits a regular query and selected scope without forcing compound rows", () => {
    render(<OfficialSearchDialog {...defaultProps} />);

    fireEvent.change(screen.getByRole("searchbox", { name: "搜索词" }), {
      target: { value: "奖学金" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "站点范围" }), {
      target: { value: "notice" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "搜索词匹配" }), {
      target: { value: "fuzzy" },
    });
    submitSearch();

    expect(submitOfficialSiteSearchMock).toHaveBeenCalledWith(expect.objectContaining({
      query: "奖学金",
      queryMatchMode: "fuzzy",
      rows: undefined,
      siteId: "notice",
    }));
    expect(defaultProps.onClose).toHaveBeenCalledOnce();
  });

  it("preserves all compound fields, matching modes and default row count", () => {
    render(<OfficialSearchDialog {...defaultProps} initialQuery="" />);
    openAdvancedSearch();

    for (const [label, value] of [
      ["关键词", "交流"],
      ["标题", "公告"],
      ["正文", "申请"],
      ["开始时间", "2026-01-01"],
      ["结束时间", "2026-10-12"],
    ] as const) {
      fireEvent.change(screen.getByLabelText(label, { exact: true }), { target: { value } });
    }
    for (const label of ["关键词匹配", "标题匹配", "正文匹配"]) {
      fireEvent.change(screen.getByRole("combobox", { name: label }), {
        target: { value: "fuzzy" },
      });
    }
    submitSearch();

    expect(submitOfficialSiteSearchMock).toHaveBeenCalledWith({
      content: "申请",
      contentMatchMode: "fuzzy",
      endDate: "2026-10-12",
      keyword: "交流",
      keywordMatchMode: "fuzzy",
      query: "",
      queryMatchMode: "exact",
      rows: 10,
      siteId: "0",
      startDate: "2026-01-01",
      title: "公告",
      titleMatchMode: "fuzzy",
    });
  });

  it.each([
    ["25", 25],
    ["", undefined],
  ])("submits a custom or empty row count (%s)", (value, expectedRows) => {
    render(<OfficialSearchDialog {...defaultProps} />);
    openAdvancedSearch();
    fireEvent.change(screen.getByLabelText("每页条数"), { target: { value } });
    submitSearch();

    expect(submitOfficialSiteSearchMock).toHaveBeenCalledWith(expect.objectContaining({
      rows: expectedRows,
    }));
  });

  it("reports an unsuccessful submission and keeps the modal open", () => {
    submitOfficialSiteSearchMock.mockReturnValue(false);
    render(<OfficialSearchDialog {...defaultProps} initialQuery="" />);
    submitSearch();

    expect(screen.getByRole("alert")).toHaveTextContent("请至少填写搜索词");
    expect(defaultProps.onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("resets edited fields and errors when reopened with a new query", () => {
    const { rerender } = render(<OfficialSearchDialog {...defaultProps} />);
    openAdvancedSearch();
    fireEvent.change(screen.getByLabelText("关键词", { exact: true }), {
      target: { value: "旧关键词" },
    });
    submitOfficialSiteSearchMock.mockReturnValue(false);
    submitSearch();

    rerender(<OfficialSearchDialog {...defaultProps} open={false} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    rerender(<OfficialSearchDialog {...defaultProps} initialQuery="  新搜索  " />);

    expect(screen.getByRole("searchbox", { name: "搜索词" })).toHaveValue("新搜索");
    expect(screen.queryByRole("alert")).toBeNull();
    openAdvancedSearch();
    expect(screen.getByLabelText("关键词", { exact: true })).toHaveValue("");
    expect(screen.getByLabelText("每页条数")).toHaveValue(10);
  });

  it("closes from Escape, close, cancel, and the backdrop", () => {
    render(<OfficialSearchDialog {...defaultProps} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(defaultProps.onClose).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole("button", { name: "关闭" }));
    fireEvent.click(screen.getByRole("button", { name: "取消" }));
    fireEvent.click(document.querySelector("[data-modal-backdrop]") as HTMLElement);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(4);
  });
});
