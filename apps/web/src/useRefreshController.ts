import { useCallback, useEffect, useRef } from "react";
import type { FeedSnapshot, SourceHealthStatus } from "@bnuz-feed/contracts";

const retryDelays = [3000, 9000];
const retryableStatuses = new Set<SourceHealthStatus>([
  "partial", "timeout", "network_error", "parser_error", "empty",
]);

interface UseRefreshControllerOptions {
  autoRefresh: boolean;
  refresh: (sourceIds?: string[]) => Promise<FeedSnapshot | null>;
  snapshot: FeedSnapshot | null;
  sourceMode: "browser" | "snapshot";
}

export function useRefreshController(options: UseRefreshControllerOptions) {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const mountedRef = useRef(true);
  const startedRef = useRef(false);
  const attemptsRef = useRef(new Map<string, number>());
  const timersRef = useRef(new Map<string, number>());
  const queueRef = useRef(Promise.resolve<FeedSnapshot | null>(null));

  const runRefresh = useCallback(async (sourceIds?: string[], resetRetries = true): Promise<FeedSnapshot | null> => {
    if (resetRetries) {
      const targets = sourceIds ?? [...new Set([...timersRef.current.keys(), ...attemptsRef.current.keys()])];
      for (const id of targets) {
        window.clearTimeout(timersRef.current.get(id));
        timersRef.current.delete(id);
        attemptsRef.current.delete(id);
      }
    }

    const pending = queueRef.current.catch(() => null).then(() => mountedRef.current ? optionsRef.current.refresh(sourceIds) : null);
    queueRef.current = pending;
    const snapshot = await pending;
    if (!snapshot || !mountedRef.current || optionsRef.current.sourceMode !== "browser") return snapshot;

    for (const id of sourceIds ?? Object.keys(snapshot.sourceHealth)) {
      const health = snapshot.sourceHealth[id];
      const attempt = attemptsRef.current.get(id) ?? 0;
      if (!health || !retryableStatuses.has(health.status)) {
        window.clearTimeout(timersRef.current.get(id));
        timersRef.current.delete(id);
        attemptsRef.current.delete(id);
        continue;
      }
      const delay = retryDelays[attempt];
      if (delay === undefined || timersRef.current.has(id)) continue;
      timersRef.current.set(id, window.setTimeout(() => {
        timersRef.current.delete(id);
        attemptsRef.current.set(id, attempt + 1);
        void runRefresh([id], false);
      }, delay));
    }
    return snapshot;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      for (const timer of timersRef.current.values()) window.clearTimeout(timer);
      timersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!options.autoRefresh || startedRef.current || !options.snapshot) return;
    startedRef.current = true;
    // A freshly downloaded snapshot already is current. Cached snapshots still need an update.
    if (options.sourceMode !== "snapshot" || options.snapshot.origin !== "snapshot") {
      void runRefresh();
    }
  }, [options.autoRefresh, options.snapshot, options.sourceMode, runRefresh]);

  return { refreshAll: useCallback(() => runRefresh(), [runRefresh]) };
}
