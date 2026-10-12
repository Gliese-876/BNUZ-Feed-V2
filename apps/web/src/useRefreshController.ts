import { useCallback, useEffect, useRef } from "react";
import type { FeedSnapshot, SourceHealthStatus } from "@bnuz-feed/contracts";

const retryDelays = [3000, 9000];
const snapshotRefreshIntervalMs = 15 * 60_000;
const retryableStatuses = new Set<SourceHealthStatus>([
  "partial", "timeout", "network_error", "parser_error", "empty",
]);

function isOnlineForeground(): boolean {
  return navigator.onLine !== false && document.visibilityState !== "hidden";
}

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
  const pendingCountRef = useRef(0);
  const lastRefreshAtRef = useRef<number | null>(null);

  const runRefresh = useCallback(async (sourceIds?: string[], resetRetries = true): Promise<FeedSnapshot | null> => {
    if (resetRetries) {
      const targets = sourceIds ?? [...new Set([...timersRef.current.keys(), ...attemptsRef.current.keys()])];
      for (const id of targets) {
        window.clearTimeout(timersRef.current.get(id));
        timersRef.current.delete(id);
        attemptsRef.current.delete(id);
      }
    }

    pendingCountRef.current += 1;
    lastRefreshAtRef.current = Date.now();
    if (!sourceIds?.length) startedRef.current = true;
    const pending = queueRef.current.catch(() => null).then(() => mountedRef.current ? optionsRef.current.refresh(sourceIds) : null);
    queueRef.current = pending;
    try {
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
          void runRefresh([id], false).catch(() => null);
        }, delay));
      }
      return snapshot;
    } finally {
      pendingCountRef.current -= 1;
    }
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
    if (options.sourceMode === "snapshot" && !isOnlineForeground()) return;
    startedRef.current = true;
    // A freshly downloaded snapshot already is current. Cached snapshots still need an update.
    if (options.sourceMode !== "snapshot" || options.snapshot.origin !== "snapshot") {
      void runRefresh().catch(() => null);
    } else {
      lastRefreshAtRef.current = Date.now();
    }
  }, [options.autoRefresh, options.snapshot, options.sourceMode, runRefresh]);

  const hasSnapshot = Boolean(options.snapshot);
  useEffect(() => {
    if (!options.autoRefresh || options.sourceMode !== "snapshot" || !hasSnapshot) return;
    let stopped = false;
    let timer: number | undefined;
    const clearTimer = () => {
      window.clearTimeout(timer);
      timer = undefined;
    };
    const schedule = () => {
      clearTimer();
      if (stopped || !isOnlineForeground()) return;
      const last = lastRefreshAtRef.current;
      const delay = last === null ? snapshotRefreshIntervalMs
        : Math.max(1000, snapshotRefreshIntervalMs - (Date.now() - last));
      timer = window.setTimeout(() => sync(), delay);
    };
    const sync = (force = false) => {
      clearTimer();
      if (stopped || !isOnlineForeground()) return;
      if (pendingCountRef.current > 0) {
        // Activity events share the pending refresh instead of queuing more requests.
        void queueRef.current.then(schedule, schedule);
        return;
      }
      const last = lastRefreshAtRef.current;
      if (!force && last !== null && Date.now() - last < snapshotRefreshIntervalMs) {
        schedule();
        return;
      }
      void runRefresh().catch(() => null).finally(schedule);
    };
    const resume = () => sync();
    const reconnect = () => sync(true);
    const visibilityChanged = () => document.visibilityState === "hidden" ? clearTimer() : resume();
    window.addEventListener("online", reconnect);
    window.addEventListener("offline", clearTimer);
    window.addEventListener("focus", resume);
    document.addEventListener("visibilitychange", visibilityChanged);
    schedule();
    return () => {
      stopped = true;
      clearTimer();
      window.removeEventListener("online", reconnect);
      window.removeEventListener("offline", clearTimer);
      window.removeEventListener("focus", resume);
      document.removeEventListener("visibilitychange", visibilityChanged);
    };
  }, [hasSnapshot, options.autoRefresh, options.sourceMode, runRefresh]);

  return { refreshAll: useCallback(() => runRefresh(), [runRefresh]) };
}
