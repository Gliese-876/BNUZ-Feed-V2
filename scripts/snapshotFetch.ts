import type { Browser, Page } from "playwright";

type FetchFn = typeof fetch;

export interface SnapshotFetchOptions {
  browserHosts: Iterable<string>;
  browserTimeoutMs: number;
  browserChannel?: string;
  browserExecutablePath?: string;
  nativeFetch?: FetchFn;
}

export interface SnapshotFetchHandle {
  fetchFn: FetchFn;
  dispose(): Promise<void>;
}

function normalizeHost(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeOptionalValue(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function parseBrowserHostList(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return [...new Set(value.split(",").map(normalizeHost).filter(Boolean))];
}

function resolveHost(input: RequestInfo | URL): string | null {
  try {
    if (input instanceof URL) {
      return normalizeHost(input.hostname);
    }

    if (typeof input === "string") {
      return normalizeHost(new URL(input).hostname);
    }

    return normalizeHost(new URL(input.url).hostname);
  } catch {
    return null;
  }
}

function createAbortError(): DOMException {
  return new DOMException("The operation was aborted.", "AbortError");
}

export function createHostScopedFetch(
  nativeFetch: FetchFn,
  browserFetch: FetchFn,
  browserHosts: Iterable<string>,
): FetchFn {
  const hostSet = new Set([...browserHosts].map(normalizeHost).filter(Boolean));

  if (hostSet.size === 0) {
    return nativeFetch;
  }

  return async (input, init) => {
    const host = resolveHost(input);

    if (host && hostSet.has(host)) {
      return browserFetch(input, init);
    }

    return nativeFetch(input, init);
  };
}

async function createPlaywrightFetch(options: {
  browserTimeoutMs: number;
  browserChannel?: string;
  browserExecutablePath?: string;
}): Promise<FetchFn & { dispose(): Promise<void> }> {
  let browserPromise: Promise<Browser> | undefined;
  let disposalPromise: Promise<void> | undefined;
  let disposed = false;
  const browserChannel = normalizeOptionalValue(options.browserChannel);
  const browserExecutablePath = normalizeOptionalValue(options.browserExecutablePath);

  function getBrowser(): Promise<Browser> {
    if (disposed) {
      return Promise.reject(new Error("Snapshot fetcher has been disposed."));
    }

    browserPromise ??= import("playwright")
      .then(({ chromium }) => chromium.launch({
        headless: true,
        args: ["--disable-dev-shm-usage"],
        ...(browserChannel ? { channel: browserChannel } : {}),
        ...(browserExecutablePath ? { executablePath: browserExecutablePath } : {}),
      }))
      .catch((error: unknown) => {
        browserPromise = undefined;
        throw error;
      });
    return browserPromise;
  }

  const fetchFn = (async (input, init) => {
    const url = input instanceof URL ? input.toString() : typeof input === "string" ? input : input.url;
    const signal = init?.signal === undefined && input instanceof Request ? input.signal : init?.signal;

    if (signal?.aborted) {
      throw createAbortError();
    }

    let abortHandler: (() => void) | undefined;
    let page: Page | undefined;
    const abortPromise = signal ? new Promise<never>((_, reject) => {
      abortHandler = () => {
        void page?.close().catch(() => undefined);
        reject(createAbortError());
      };
      signal.addEventListener("abort", abortHandler, { once: true });
    }) : undefined;

    try {
      const navigationPromise = (async () => {
        const browserInstance = await getBrowser();
        if (signal?.aborted) {
          throw createAbortError();
        }
        if (disposed) {
          throw new Error("Snapshot fetcher has been disposed.");
        }
        page = await browserInstance.newPage();
        if (signal?.aborted) {
          await page.close().catch(() => undefined);
          throw createAbortError();
        }
        const response = await page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: options.browserTimeoutMs,
        });

        if (!response) {
          throw new Error(`Browser navigation to ${url} returned no response.`);
        }

        const bodyText = await page.content();
        const headers = new Headers(await response.allHeaders());

        const status = response.status();
        const result = new Response([204, 205, 304].includes(status) ? null : bodyText, { status, headers });
        Object.defineProperty(result, "url", { value: response.url() });
        return result;
      })();

      return await (abortPromise ? Promise.race([navigationPromise, abortPromise]) : navigationPromise);
    } finally {
      if (signal && abortHandler) {
        signal.removeEventListener("abort", abortHandler);
      }

      await page?.close().catch(() => undefined);
    }
  }) as FetchFn & { dispose(): Promise<void> };

  fetchFn.dispose = () => {
    disposed = true;
    disposalPromise ??= browserPromise
      ? browserPromise.then((browser) => browser.close(), () => undefined)
      : Promise.resolve();
    return disposalPromise;
  };

  return fetchFn;
}

export async function createSnapshotFetch(options: SnapshotFetchOptions): Promise<SnapshotFetchHandle> {
  const browserHosts = [...new Set([...options.browserHosts].map(normalizeHost).filter(Boolean))];
  const nativeFetch = options.nativeFetch ?? fetch;

  if (browserHosts.length === 0) {
    return {
      fetchFn: nativeFetch,
      async dispose() {},
    };
  }

  const browserFetch = await createPlaywrightFetch({
    browserTimeoutMs: options.browserTimeoutMs,
    browserChannel: options.browserChannel,
    browserExecutablePath: options.browserExecutablePath,
  });

  return {
    fetchFn: createHostScopedFetch(nativeFetch, browserFetch, browserHosts),
    dispose: () => browserFetch.dispose(),
  };
}
