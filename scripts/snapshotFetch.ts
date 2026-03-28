import type { Browser } from "playwright";

type FetchFn = typeof fetch;

export interface SnapshotFetchOptions {
  browserHosts: Iterable<string>;
  browserTimeoutMs: number;
  nativeFetch?: FetchFn;
}

export interface SnapshotFetchHandle {
  fetchFn: FetchFn;
  dispose(): Promise<void>;
}

function normalizeHost(value: string): string {
  return value.trim().toLowerCase();
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

async function createPlaywrightFetch(browserTimeoutMs: number): Promise<FetchFn & { dispose(): Promise<void> }> {
  let browser: Browser | null = null;

  async function getBrowser(): Promise<Browser> {
    if (browser) {
      return browser;
    }

    const { chromium } = await import("playwright");
    browser = await chromium.launch({
      headless: true,
      args: ["--disable-dev-shm-usage"],
    });
    return browser;
  }

  const fetchFn = (async (input, init) => {
    const url = input instanceof URL ? input.toString() : typeof input === "string" ? input : input.url;
    const browserInstance = await getBrowser();
    const page = await browserInstance.newPage();
    const signal = init?.signal;

    if (signal?.aborted) {
      await page.close().catch(() => undefined);
      throw createAbortError();
    }

    let abortHandler: (() => void) | undefined;

    try {
      const navigationPromise = (async () => {
        const response = await page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: browserTimeoutMs,
        });

        if (!response) {
          throw new Error(`Browser navigation to ${url} returned no response.`);
        }

        const bodyText = await page.content();
        const headers = new Headers(await response.allHeaders());

        return {
          ok: response.ok(),
          status: response.status(),
          url: response.url(),
          headers: {
            get(name: string) {
              return headers.get(name);
            },
          },
          text: async () => bodyText,
        } as unknown as Response;
      })();

      if (!signal) {
        return await navigationPromise;
      }

      return await new Promise<Response>((resolve, reject) => {
        abortHandler = () => {
          void page.close().catch(() => undefined);
          reject(createAbortError());
        };

        signal.addEventListener("abort", abortHandler, { once: true });

        void navigationPromise.then(resolve, reject);
      });
    } finally {
      if (signal && abortHandler) {
        signal.removeEventListener("abort", abortHandler);
      }

      await page.close().catch(() => undefined);
    }
  }) as FetchFn & { dispose(): Promise<void> };

  fetchFn.dispose = async () => {
    if (!browser) {
      return;
    }

    await browser.close();
    browser = null;
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

  const browserFetch = await createPlaywrightFetch(options.browserTimeoutMs);

  return {
    fetchFn: createHostScopedFetch(nativeFetch, browserFetch, browserHosts),
    dispose: () => browserFetch.dispose(),
  };
}
