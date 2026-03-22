import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useEffectEvent,
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
  const [snapshot, setSnapshot] = useState<FeedSnapshot | null>(service.getSnapshot());
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const syncFromService = useEffectEvent(() => {
    startTransition(() => {
      setSnapshot(service.getSnapshot());
    });
  });

  const runRefresh = useEffectEvent(async (sourceIds?: string[]) => {
    setRefreshing(true);
    setError(null);

    try {
      const nextSnapshot = await service.refresh(sourceIds);
      startTransition(() => {
        setSnapshot(nextSnapshot);
      });
      return nextSnapshot;
    } catch (refreshError) {
      const normalizedError =
        refreshError instanceof Error ? refreshError : new Error("Unknown refresh failure.");
      setError(normalizedError);
      return service.getSnapshot();
    } finally {
      setRefreshing(false);
    }
  });

  useEffect(() => {
    const unsubscribe = service.subscribe(() => {
      syncFromService();
    });

    let active = true;

    void service.bootstrap().then((bootstrappedSnapshot) => {
      if (!active) {
        return;
      }

      startTransition(() => {
        setSnapshot(bootstrappedSnapshot);
      });

      if (autoRefresh) {
        void runRefresh();
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [autoRefresh, runRefresh, service, syncFromService]);

  return (
    <FeedContext.Provider
      value={{
        snapshot,
        sourceHealth: snapshot?.sourceHealth ?? {},
        refreshing,
        error,
        refresh: runRefresh,
      }}
    >
      {children}
    </FeedContext.Provider>
  );
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
