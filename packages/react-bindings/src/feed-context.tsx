import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import type { AggregationService, FeedSnapshot, SourceHealth } from "@bnuz-feed/contracts";

interface FeedContextValue {
  snapshot: FeedSnapshot | null;
  sourceHealth: Record<string, SourceHealth>;
  refreshing: boolean;
  error: Error | null;
  refresh: (sourceIds?: string[]) => Promise<FeedSnapshot | null>;
}

const FeedContext = createContext<FeedContextValue | null>(null);

export interface FeedProviderProps extends PropsWithChildren {
  service: AggregationService;
  autoRefresh?: boolean;
}

export function FeedProvider({
  autoRefresh = false,
  children,
  service,
}: FeedProviderProps) {
  const [snapshot, setSnapshot] = useState<FeedSnapshot | null>(() => service.getSnapshot());
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const session = useMemo(() => ({ active: true, pending: 0 }), [service]);

  const runRefresh = useCallback(async (sourceIds?: string[]) => {
    if (!session.active) {
      return service.getSnapshot();
    }

    session.pending += 1;
    setRefreshing(true);
    setError(null);
    try {
      const nextSnapshot = await service.refresh(sourceIds);
      if (session.active) {
        setError(null);
        startTransition(() => {
          setSnapshot((current) => session.active ? nextSnapshot : current);
        });
      }
      return nextSnapshot;
    } catch (refreshError) {
      if (session.active) {
        setError(normalizeError(refreshError));
      }
      return service.getSnapshot();
    } finally {
      session.pending -= 1;
      if (session.active) {
        setRefreshing(session.pending > 0);
      }
    }
  }, [service, session]);

  useEffect(() => {
    session.active = true;
    setSnapshot(service.getSnapshot());
    setRefreshing(session.pending > 0);
    setError(null);
    let active = true;
    const unsubscribe = service.subscribe(() => {
      startTransition(() => {
        setSnapshot((current) => active ? service.getSnapshot() : current);
      });
    });

    void service.bootstrap().then((bootstrappedSnapshot) => {
      if (!active) {
        return;
      }

      startTransition(() => {
        setSnapshot((current) => active ? bootstrappedSnapshot : current);
      });

      if (autoRefresh) {
        void runRefresh();
      }
    }).catch((bootstrapError: unknown) => {
      if (active) {
        setError(normalizeError(bootstrapError));
      }
    });

    return () => {
      active = false;
      session.active = false;
      unsubscribe();
    };
  }, [autoRefresh, runRefresh, service, session]);

  const value = useMemo(() => ({
    snapshot,
    sourceHealth: snapshot?.sourceHealth ?? {},
    refreshing,
    error,
    refresh: runRefresh,
  }), [snapshot, refreshing, error, runRefresh]);

  return <FeedContext.Provider value={value}>{children}</FeedContext.Provider>;
}

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error("Unknown feed failure.");
}

function useFeedContext(): FeedContextValue {
  const value = useContext(FeedContext);

  if (!value) {
    throw new Error("Feed hooks must be used inside <FeedProvider />.");
  }

  return value;
}

export function useFeedSnapshot(): FeedSnapshot | null {
  return useFeedContext().snapshot;
}

export function useSourceHealth(): Record<string, SourceHealth> {
  return useFeedContext().sourceHealth;
}

export function useFeedRefresh() {
  const context = useFeedContext();

  return {
    refresh: context.refresh,
    refreshing: context.refreshing,
    error: context.error,
  };
}
