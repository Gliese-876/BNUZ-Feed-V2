export type SourceMode = "browser" | "snapshot";

export interface AppRuntimeConfig {
  sourceMode: SourceMode;
  autoRefresh: boolean;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }

  return value === "1" || value.toLowerCase() === "true";
}

export function resolveRuntimeConfig(): AppRuntimeConfig {
  const sourceMode =
    import.meta.env.VITE_FEED_SOURCE_MODE === "snapshot" ? "snapshot" : "browser";

  return {
    sourceMode,
    autoRefresh: parseBoolean(import.meta.env.VITE_AUTO_REFRESH, false),
  };
}
