// @vitest-environment jsdom

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

const defaultScopeOptions = [
  { id: "0", name: "All sites" },
  { id: "notice", name: "Notice" },
];

describe("OfficialSearchDialog", () => {
  beforeEach(() => {
    submitOfficialSiteSearchMock.mockClear();
  });

  it("renders as a fixed body portal with visible select controls", async () => {
    setViewport(1280, 900);
    const { trigger, triggerRef } = createTriggerRef();

    const { unmount } = render(
      <OfficialSearchDialog
        dialogId="official-search-dialog"
        initialQuery="seed"
        onClose={() => undefined}
        open
        scopeOptions={defaultScopeOptions}
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
    expect(screen.getAllByRole("searchbox")[0]).toBeInTheDocument();
    expect(screen.getAllByRole("combobox").length).toBeGreaterThan(1);

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
        scopeOptions={defaultScopeOptions}
        triggerRef={triggerRef}
      />,
    );

    fireEvent.change(screen.getAllByRole("searchbox")[0] as HTMLInputElement, {
      target: { value: "scholarship" },
    });
    fireEvent.click(document.querySelector('button[type="submit"]') as HTMLButtonElement);

    expect(submitOfficialSiteSearchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        query: "scholarship",
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
        scopeOptions={defaultScopeOptions}
        triggerRef={triggerRef}
      />,
    );

    fireEvent.click(document.querySelector(".search-dialog__advanced summary") as HTMLElement);

    const keywordInput = document.querySelector(
      '.search-dialog__advanced-grid input[type="search"]',
    ) as HTMLInputElement;
    const keywordLabel = document.querySelector(`label[for="${keywordInput.id}"]`);

    expect(keywordInput.id).not.toBe("");
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
        scopeOptions={defaultScopeOptions}
        triggerRef={triggerRef}
      />,
    );

    const scopeCombobox = screen.getAllByRole("combobox")[0] as HTMLElement;

    fireEvent.click(scopeCombobox);
    fireEvent.click(screen.getAllByRole("option")[1] as HTMLElement);

    expect(scopeCombobox).toHaveTextContent("Notice");

    trigger.remove();
  });

  it("keeps the dialog mounted long enough to play its exit animation", () => {
    vi.useFakeTimers();
    setViewport(1280, 900);
    const { trigger, triggerRef } = createTriggerRef();

    try {
      const { rerender } = render(
        <OfficialSearchDialog
          dialogId="official-search-dialog"
          initialQuery=""
          onClose={() => undefined}
          open
          scopeOptions={defaultScopeOptions}
          triggerRef={triggerRef}
        />,
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();

      rerender(
        <OfficialSearchDialog
          dialogId="official-search-dialog"
          initialQuery=""
          onClose={() => undefined}
          open={false}
          scopeOptions={defaultScopeOptions}
          triggerRef={triggerRef}
        />,
      );

      expect(screen.getByRole("dialog")).toHaveClass("is-closing");
      expect(document.querySelector(".search-dialog__backdrop")).toHaveClass("is-closing");

      act(() => {
        vi.advanceTimersByTime(240);
      });

      expect(screen.queryByRole("dialog")).toBeNull();
      expect(document.querySelector(".search-dialog__backdrop")).toBeNull();
    } finally {
      vi.useRealTimers();
      trigger.remove();
    }
  });

  it("keeps the custom select menu mounted long enough to play its exit animation", () => {
    vi.useFakeTimers();
    setViewport(1280, 900);
    const { trigger, triggerRef } = createTriggerRef();

    try {
      render(
        <OfficialSearchDialog
          dialogId="official-search-dialog"
          initialQuery=""
          onClose={() => undefined}
          open
          scopeOptions={defaultScopeOptions}
          triggerRef={triggerRef}
        />,
      );

      fireEvent.click(screen.getAllByRole("combobox")[0] as HTMLElement);
      expect(document.querySelector(".field__select-menu")).toHaveClass("is-open");

      fireEvent.pointerDown(document.body);
      expect(document.querySelector(".field__select-menu")).toHaveClass("is-closing");

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(document.querySelector(".field__select-menu")).toBeNull();
    } finally {
      vi.useRealTimers();
      trigger.remove();
    }
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
          scopeOptions={defaultScopeOptions}
          triggerRef={triggerRef}
        />,
      );

      fireEvent.click(document.querySelector(".search-dialog__advanced summary") as HTMLElement);

      const startDateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      const startDateButton = document.querySelector(".field__date-trigger") as HTMLButtonElement;

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
