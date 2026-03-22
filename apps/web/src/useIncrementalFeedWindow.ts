import { useEffect, useEffectEvent, useRef, useState, type RefObject } from "react";

const initialRenderCount = 48;
const renderStep = 36;

interface UseIncrementalFeedWindowResult {
  canLoadMore: boolean;
  renderedCount: number;
  sentinelRef: RefObject<HTMLDivElement | null>;
}

export function useIncrementalFeedWindow(
  totalCount: number,
  resetKey: string,
): UseIncrementalFeedWindowResult {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [renderedCount, setRenderedCount] = useState(() =>
    Math.min(totalCount, initialRenderCount),
  );

  const loadMore = useEffectEvent(() => {
    setRenderedCount((current) => Math.min(totalCount, current + renderStep));
  });

  useEffect(() => {
    setRenderedCount(Math.min(totalCount, initialRenderCount));
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
    renderedCount,
    sentinelRef,
  };
}
