import { useEffect, useRef, type RefObject } from "react";

const focusableSelector =
  'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [tabindex]:not([tabindex="-1"])';

function focusableElements(panel: HTMLElement): HTMLElement[] {
  return Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector)).filter((element) => {
    if (element.closest('[hidden], [inert], [aria-hidden="true"]')) return false;
    const collapsed = element.closest("details:not([open])");
    return !collapsed || element === collapsed.querySelector("summary");
  });
}

/** Keep modal keyboard focus inside the panel, and restore the opener on close. */
export function useModalFocus(
  open: boolean,
  panelRef: RefObject<HTMLElement | null>,
  onClose: () => void,
  triggerRef?: RefObject<HTMLElement | null>,
) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const panel = panelRef.current;
    if (!open || !panel) return;

    const opener = triggerRef?.current ?? document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const background = Array.from(document.body.children)
      .filter((element): element is HTMLElement => element instanceof HTMLElement)
      .filter((element) => !element.contains(panel) && !element.hasAttribute("data-modal-backdrop"));
    const previousAttributes = background.map((element) => ({
      element,
      inert: element.inert,
      ariaHidden: element.getAttribute("aria-hidden"),
    }));

    document.body.style.overflow = "hidden";
    for (const element of background) {
      element.inert = true;
      element.setAttribute("aria-hidden", "true");
    }

    if (!panel.contains(document.activeElement)) {
      const initial = panel.querySelector<HTMLElement>("[autofocus]") ?? focusableElements(panel)[0];
      (initial ?? panel).focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
      } else if (event.key === "Tab") {
        const elements = focusableElements(panel);
        const first = elements[0];
        const last = elements.at(-1);
        if (!first || !last) {
          event.preventDefault();
          panel.focus();
        } else if (event.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      for (const { element, inert, ariaHidden } of previousAttributes) {
        element.inert = inert;
        if (ariaHidden === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", ariaHidden);
      }
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, [open, panelRef, triggerRef]);
}
