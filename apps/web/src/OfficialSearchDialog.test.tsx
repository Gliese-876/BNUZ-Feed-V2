// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { submitOfficialSiteSearchMock } = vi.hoisted(() => ({
  submitOfficialSiteSearchMock: vi.fn(() => true),
}));

vi.mock("./siteSearch", async () => {
  const actual = await vi.importActual<typeof import("./siteSearch")>("./siteSearch");

  return {
    ...actual,
    submitOfficialSiteSearch: submitOfficialSiteSearchMock,
  };
});

import { OfficialSearchDialog } from "./OfficialSearchDialog";

function setViewport(width: number, height: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: width,
    writable: true,
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: height,
    writable: true,
  });
}

function createTriggerRef() {
  const trigger = document.createElement("button");
  Object.defineProperty(trigger, "getBoundingClientRect", {
    value: () => ({
      bottom: 68,
      height: 44,
      left: 900,
      right: 1020,
      top: 24,
      width: 120,
      x: 900,
      y: 24,
      toJSON: () => undefined,
    }),
  });
  document.body.append(trigger);

  return {
    trigger,
    triggerRef: { current: trigger },
  };
}

describe("OfficialSearchDialog", () => {
  beforeEach(() => {
    submitOfficialSiteSearchMock.mockClear();
  });

  it("renders as a fixed body portal with visible scope and match selects", async () => {
    setViewport(1280, 900);
    const { trigger, triggerRef } = createTriggerRef();

    const { unmount } = render(
      <OfficialSearchDialog
        dialogId="official-search-dialog"
        initialQuery="奖学金"
        onClose={() => undefined}
        open
        scopeOptions={[
          { id: "0", name: "所有站点" },
          { id: "notice", name: "通知公告" },
        ]}
        triggerRef={triggerRef}
      />,
    );

    const dialog = await screen.findByRole("dialog");

    await waitFor(() => {
      expect(dialog).toHaveStyle({
        left: "300px",
        maxHeight: "800px",
        top: "80px",
        width: "720px",
      });
    });

    expect(dialog.parentElement).toBe(document.body);
    expect(screen.getByRole("combobox", { name: "站点范围" })).toBeInTheDocument();
    expect(screen.getAllByRole("combobox", { name: "关键词匹配" }).length).toBeGreaterThan(0);

    unmount();
    trigger.remove();
  });

  it("submits a regular query without forcing default rows into compound search", () => {
    setViewport(1280, 900);
    const { trigger, triggerRef } = createTriggerRef();

    render(
      <OfficialSearchDialog
        dialogId="official-search-dialog"
        initialQuery=""
        onClose={() => undefined}
        open
        scopeOptions={[{ id: "0", name: "所有站点" }]}
        triggerRef={triggerRef}
      />,
    );

    fireEvent.change(screen.getByLabelText("搜索词"), {
      target: { value: "奖学金" },
    });
    fireEvent.click(screen.getByRole("button", { name: "开始检索" }));

    expect(submitOfficialSiteSearchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        query: "奖学金",
        rows: undefined,
      }),
    );

    trigger.remove();
  });

  it("binds the advanced keyword label to its own input id", () => {
    setViewport(1280, 900);
    const { trigger, triggerRef } = createTriggerRef();

    render(
      <OfficialSearchDialog
        dialogId="official-search-dialog"
        initialQuery=""
        onClose={() => undefined}
        open
        scopeOptions={[{ id: "0", name: "所有站点" }]}
        triggerRef={triggerRef}
      />,
    );

    fireEvent.click(screen.getByText("复合检索"));
    const keywordInput = screen.getByLabelText("关键词");
    const keywordLabel = document.querySelector(`label[for="${keywordInput.id}"]`);

    expect(keywordLabel).not.toBeNull();
    expect(keywordLabel).toHaveAttribute("for", keywordInput.id);

    trigger.remove();
  });

  it("opens the scope menu and applies the selected site option", () => {
    setViewport(1280, 900);
    const { trigger, triggerRef } = createTriggerRef();

    render(
      <OfficialSearchDialog
        dialogId="official-search-dialog"
        initialQuery=""
        onClose={() => undefined}
        open
        scopeOptions={[
          { id: "0", name: "所有站点" },
          { id: "notice", name: "通知公告" },
        ]}
        triggerRef={triggerRef}
      />,
    );

    const scopeCombobox = screen.getByRole("combobox", { name: "站点范围" });

    fireEvent.click(scopeCombobox);
    fireEvent.click(screen.getByRole("option", { name: "通知公告" }));

    expect(scopeCombobox).toHaveTextContent("通知公告");

    trigger.remove();
  });

  it("toggles the native start date picker from the date trigger", () => {
    setViewport(1280, 900);
    const { trigger, triggerRef } = createTriggerRef();
    const inputPrototype = HTMLInputElement.prototype as HTMLInputElement & {
      showPicker?: () => void;
    };
    const originalShowPicker = inputPrototype.showPicker;
    const showPickerMock = vi.fn();
    const blurSpy = vi.spyOn(HTMLInputElement.prototype, "blur");

    Object.defineProperty(inputPrototype, "showPicker", {
      configurable: true,
      value: showPickerMock,
    });

    try {
      render(
        <OfficialSearchDialog
          dialogId="official-search-dialog"
          initialQuery=""
          onClose={() => undefined}
          open
          scopeOptions={[{ id: "0", name: "所有站点" }]}
          triggerRef={triggerRef}
        />,
      );

      fireEvent.click(screen.getByText("复合检索"));
      const startDateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      const startDateButton = screen.getByRole("button", { name: "开始时间" });

      fireEvent.click(startDateButton);
      expect(showPickerMock).toHaveBeenCalledTimes(1);
      expect(startDateInput).not.toHaveFocus();

      fireEvent.click(startDateButton);
      expect(blurSpy).toHaveBeenCalled();
      expect(startDateInput).not.toHaveFocus();
    } finally {
      blurSpy.mockRestore();
      if (originalShowPicker) {
        Object.defineProperty(inputPrototype, "showPicker", {
          configurable: true,
          value: originalShowPicker,
        });
      } else {
        Reflect.deleteProperty(inputPrototype, "showPicker");
      }
      trigger.remove();
    }
  });
});
