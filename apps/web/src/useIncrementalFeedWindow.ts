import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

const initialRenderCount = 48;
const renderStep = 36;

interface UseIncrementalFeedWindowResult {
  canLoadMore: boolean;
  loadMore: () => void;
  renderedCount: number;
  sentinelRef: RefObject<HTMLDivElement | null>;
}

export function useIncrementalFeedWindow(
  totalCount: number,
  resetKey: string,
): UseIncrementalFeedWindowResult {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const previousWindow = useRef({ resetKey, totalCount });
  const [renderedCount, setRenderedCount] = useState(() =>
    Math.min(totalCount, initialRenderCount),
  );

  const loadMore = useCallback(() => {
    setRenderedCount((current) => Math.min(totalCount, current + renderStep));
  }, [totalCount]);

  useEffect(() => {
    const previous = previousWindow.current;
    const reset = previous.resetKey !== resetKey || previous.totalCount === 0;
    const growth = Math.max(0, totalCount - previous.totalCount);
    previousWindow.current = { resetKey, totalCount };
    setRenderedCount((current) => Math.min(totalCount,
      reset ? initialRenderCount : Math.max(initialRenderCount, current + growth),
    ));
  }, [resetKey, totalCount]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || renderedCount >= totalCount || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            loadMore();
            break;
          }
        }
      },
      {
        rootMargin: "640px 0px",
      },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [loadMore, renderedCount, resetKey, totalCount]);

  return {
    canLoadMore: renderedCount < totalCount,
    loadMore,
    renderedCount,
    sentinelRef,
  };
}
