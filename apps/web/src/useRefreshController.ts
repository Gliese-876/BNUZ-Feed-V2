import { useEffect, useEffectEvent, useRef, useState } from "react";

import type { FeedSnapshot, SourceHealthStatus } from "@bnuz-feed/contracts";

const maxRetryAttempts = 2;
const retryDelayMs = [3000, 9000];
const retryableStatuses = new Set<SourceHealthStatus>([
  "partial",
  "timeout",
  "network_error",
  "parser_error",
  "empty",
]);

interface UseRefreshControllerOptions {
  autoRefresh: boolean;
  refresh: (sourceIds?: string[]) => Promise<FeedSnapshot | null>;
  snapshot: FeedSnapshot | null;
  sourceMode: "browser" | "snapshot";
}

export function useRefreshController({
  autoRefresh,
  refresh,
  snapshot,
  sourceMode,
}: UseRefreshControllerOptions) {
  const [lastCompletedAt, setLastCompletedAt] = useState<string | null>(null);
  const [retryAttempts, setRetryAttempts] = useState<Record<string, number>>({});
  const [retryingSourceIds, setRetryingSourceIds] = useState<string[]>([]);

  const hasStartedRef = useRef(false);
  const retryAttemptsRef = useRef<Record<string, number>>({});
  const retryTimersRef = useRef(new Map<string, number>());
  const refreshQueueRef = useRef(Promise.resolve<FeedSnapshot | null>(null));

  const removeRetryTimer = useEffectEvent((sourceId: string) => {
    const timer = retryTimersRef.current.get(sourceId);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      retryTimersRef.current.delete(sourceId);
    }

    setRetryingSourceIds((current) => current.filter((value) => value !== sourceId));
  });

  const setAttemptValue = useEffectEvent((sourceId: string, value: number | undefined) => {
    const nextAttempts = { ...retryAttemptsRef.current };

    if (value === undefined) {
      delete nextAttempts[sourceId];
    } else {
      nextAttempts[sourceId] = value;
    }

    retryAttemptsRef.current = nextAttempts;
    setRetryAttempts(nextAttempts);
  });

  const resetRetryState = useEffectEvent((sourceIds?: string[]) => {
    const targets =
      sourceIds && sourceIds.length > 0
        ? sourceIds
        : [...new Set([...retryTimersRef.current.keys(), ...Object.keys(retryAttemptsRef.current)])];

    for (const sourceId of targets) {
      removeRetryTimer(sourceId);
      setAttemptValue(sourceId, undefined);
    }
  });

  const enqueueRefresh = useEffectEvent((sourceIds?: string[]) => {
    const nextPromise = refreshQueueRef.current
      .catch(() => null)
      .then(() => refresh(sourceIds));

    refreshQueueRef.current = nextPromise;
    return nextPromise;
  });

  const processRetryTargets = useEffectEvent((nextSnapshot: FeedSnapshot | null, sourceIds?: string[]) => {
    if (!nextSnapshot || sourceMode !== "browser") {
      return;
    }

    const targetSourceIds =
      sourceIds && sourceIds.length > 0 ? sourceIds : Object.keys(nextSnapshot.sourceHealth);

    for (const sourceId of targetSourceIds) {
      const health = nextSnapshot.sourceHealth[sourceId];
      const attempt = retryAttemptsRef.current[sourceId] ?? 0;

      if (!health || !retryableStatuses.has(health.status)) {
        removeRetryTimer(sourceId);
        setAttemptValue(sourceId, undefined);
        continue;
      }

      if (attempt >= maxRetryAttempts || retryTimersRef.current.has(sourceId)) {
        continue;
      }

      const delay = retryDelayMs[Math.min(attempt, retryDelayMs.length - 1)] ?? retryDelayMs[0];
      setRetryingSourceIds((current) =>
        current.includes(sourceId) ? current : [...current, sourceId],
      );

      const timer = window.setTimeout(() => {
        retryTimersRef.current.delete(sourceId);
        setRetryingSourceIds((current) => current.filter((value) => value !== sourceId));
        setAttemptValue(sourceId, attempt + 1);

        void enqueueRefresh([sourceId]).then((retrySnapshot) => {
          processRetryTargets(retrySnapshot, [sourceId]);
        });
      }, delay);

      retryTimersRef.current.set(sourceId, timer);
    }
  });

  const runRefresh = useEffectEvent(async (sourceIds?: string[]) => {
    resetRetryState(sourceIds);
    const nextSnapshot = await enqueueRefresh(sourceIds);
    setLastCompletedAt(nextSnapshot?.updatedAt ?? null);
    processRetryTargets(nextSnapshot, sourceIds);
    return nextSnapshot;
  });

  useEffect(() => {
    if (!autoRefresh || hasStartedRef.current || snapshot === null) {
      return;
    }

    hasStartedRef.current = true;
    void runRefresh();
  }, [autoRefresh, runRefresh, snapshot]);

  useEffect(() => {
    return () => {
      for (const timer of retryTimersRef.current.values()) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  return {
    lastCompletedAt,
    refreshAll: () => runRefresh(),
    refreshSelected: (sourceIds: string[]) => runRefresh(sourceIds),
    retryAttempts,
    retryingSourceIds,
  };
}
