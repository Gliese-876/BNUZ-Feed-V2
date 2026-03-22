import { FeedProvider, useFeedRefresh, useFeedSnapshot, useSourceHealth } from "@bnuz-feed/react-bindings";

import { aggregationService, appRuntimeConfig } from "./runtime/createAggregationService";

function RuntimeShell() {
  const snapshot = useFeedSnapshot();
  const sourceHealth = useSourceHealth();
  const { refresh, refreshing, error } = useFeedRefresh();

  const healthEntries = Object.values(sourceHealth);
  const liveCount = healthEntries.filter((entry) => entry.status === "live").length;
  const blockedCount = healthEntries.filter((entry) =>
    ["cors", "timeout", "network_error", "parser_error", "parser_not_implemented"].includes(
      entry.status,
    ),
  ).length;

  return (
    <main className="app-shell">
      <h1>BNUZH Feed Architecture Shell</h1>
      <p>
        当前仅实现抓取-解析-标准化-仓储-React 消费链路的框架层。具体页面解析器和正式 UI
        未接入。
      </p>
      <div className="app-shell__controls">
        <button
          className="app-shell__button"
          disabled={refreshing}
          onClick={() => {
            void refresh();
          }}
          type="button"
        >
          {refreshing ? "Refreshing..." : "Run Pipeline"}
        </button>
      </div>
      <section className="app-shell__card">
        <dl className="app-shell__grid">
          <div className="app-shell__metric">
            <dt>Source Mode</dt>
            <dd>{appRuntimeConfig.sourceMode}</dd>
          </div>
          <div className="app-shell__metric">
            <dt>Snapshot Origin</dt>
            <dd>{snapshot?.origin ?? "none"}</dd>
          </div>
          <div className="app-shell__metric">
            <dt>Items</dt>
            <dd>{snapshot?.items.length ?? 0}</dd>
          </div>
          <div className="app-shell__metric">
            <dt>Healthy Sources</dt>
            <dd>{liveCount}</dd>
          </div>
          <div className="app-shell__metric">
            <dt>Blocked Sources</dt>
            <dd>{blockedCount}</dd>
          </div>
        </dl>
        <pre>
          {JSON.stringify(
            {
              updatedAt: snapshot?.updatedAt ?? null,
              refreshing,
              error: error?.message ?? null,
              sourceHealth,
            },
            null,
            2,
          )}
        </pre>
      </section>
    </main>
  );
}

export default function App() {
  return (
    <FeedProvider
      autoRefresh={appRuntimeConfig.autoRefresh}
      service={aggregationService}
    >
      <RuntimeShell />
    </FeedProvider>
  );
}
