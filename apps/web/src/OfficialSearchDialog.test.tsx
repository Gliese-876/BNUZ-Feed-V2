// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

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
    expect(screen.getByLabelText("站点范围")).toBeInTheDocument();
    expect(screen.getAllByLabelText("关键词匹配")[0]).toBeInTheDocument();

    unmount();
    trigger.remove();
  });
});
