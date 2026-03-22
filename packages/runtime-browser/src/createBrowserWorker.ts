export function createBrowserWorker(): Worker {
  return new Worker(new URL("./worker/browserAggregationWorker.ts", import.meta.url), {
    type: "module",
  });
}
