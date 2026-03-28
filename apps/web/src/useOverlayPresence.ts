import { useEffect, useState } from "react";

export function useOverlayPresence(open: boolean, exitDurationMs: number) {
  const [present, setPresent] = useState(open);

  useEffect(() => {
    if (open) {
      setPresent(true);
      return;
    }

    if (!present) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPresent(false);
    }, exitDurationMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [exitDurationMs, open, present]);

  return {
    isClosing: present && !open,
    shouldRender: open || present,
  };
}
