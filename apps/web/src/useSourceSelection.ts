import { startTransition, useEffect, useMemo, useState } from "react";

import type { SourceCatalogNode } from "./sourceCatalog";
import { buildChannelKey } from "./sourceCatalog";

interface StoredSelectionState {
  version: 1;
  selectedSourceIds: string[];
  selectedChannelKeys: string[];
}

const storageKey = "bnuz-feed:selection:v1";

function createDefaultSelection(catalog: SourceCatalogNode[]): StoredSelectionState {
  return {
    version: 1,
    selectedSourceIds: catalog.map((source) => source.id),
    selectedChannelKeys: catalog.flatMap((source) =>
      source.channels.map((channel) => buildChannelKey(source.id, channel.label)),
    ),
  };
}

function normalizeSelection(
  selection: StoredSelectionState,
  catalog: SourceCatalogNode[],
): StoredSelectionState {
  const validSourceIds = new Set(catalog.map((source) => source.id));
  const validChannelKeys = new Set(
    catalog.flatMap((source) =>
      source.channels.map((channel) => buildChannelKey(source.id, channel.label)),
    ),
  );

  const selectedChannelKeys = new Set(
    selection.selectedChannelKeys.filter((channelKey) => validChannelKeys.has(channelKey)),
  );
  const selectedSourceIds = new Set(
    selection.selectedSourceIds.filter((sourceId) => validSourceIds.has(sourceId)),
  );

  for (const source of catalog) {
    const hasSelectedChannel = source.channels.some((channel) =>
      selectedChannelKeys.has(buildChannelKey(source.id, channel.label)),
    );

    if (hasSelectedChannel) {
      selectedSourceIds.add(source.id);
    } else {
      selectedSourceIds.delete(source.id);
    }
  }

  return {
    version: 1,
    selectedSourceIds: [...selectedSourceIds],
    selectedChannelKeys: [...selectedChannelKeys],
  };
}

function loadSelection(catalog: SourceCatalogNode[]): StoredSelectionState {
  if (typeof localStorage === "undefined") {
    return createDefaultSelection(catalog);
  }

  try {
    const rawValue = localStorage.getItem(storageKey);
    if (!rawValue) {
      return createDefaultSelection(catalog);
    }

    const parsed = JSON.parse(rawValue) as Partial<StoredSelectionState>;
    if (!Array.isArray(parsed.selectedSourceIds) || !Array.isArray(parsed.selectedChannelKeys)) {
      return createDefaultSelection(catalog);
    }

    return normalizeSelection(
      {
        version: 1,
        selectedSourceIds: parsed.selectedSourceIds.map(String),
        selectedChannelKeys: parsed.selectedChannelKeys.map(String),
      },
      catalog,
    );
  } catch {
    return createDefaultSelection(catalog);
  }
}

export function useSourceSelection(catalog: SourceCatalogNode[]) {
  const [selection, setSelection] = useState<StoredSelectionState>(() => loadSelection(catalog));

  useEffect(() => {
    startTransition(() => {
      setSelection((current) => normalizeSelection(current, catalog));
    });
  }, [catalog]);

  useEffect(() => {
    if (typeof localStorage === "undefined") {
      return;
    }

    const persist = () => {
      localStorage.setItem(storageKey, JSON.stringify(selection));
    };

    if (typeof requestIdleCallback === "function") {
      const idleId = requestIdleCallback(persist, { timeout: 500 });
      return () => {
        cancelIdleCallback(idleId);
      };
    }

    const timeoutId = window.setTimeout(persist, 0);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [selection]);

  const allChannelKeys = useMemo(
    () =>
      catalog.flatMap((source) =>
        source.channels.map((channel) => buildChannelKey(source.id, channel.label)),
      ),
    [catalog],
  );
  const selectedSourceSet = useMemo(
    () => new Set(selection.selectedSourceIds),
    [selection.selectedSourceIds],
  );
  const selectedChannelSet = useMemo(
    () => new Set(selection.selectedChannelKeys),
    [selection.selectedChannelKeys],
  );
  const allSelected =
    selection.selectedSourceIds.length === catalog.length &&
    selection.selectedChannelKeys.length === allChannelKeys.length;

  function toggleAll(nextChecked: boolean) {
    startTransition(() => {
      setSelection(
        nextChecked
          ? createDefaultSelection(catalog)
          : {
              version: 1,
              selectedSourceIds: [],
              selectedChannelKeys: [],
            },
      );
    });
  }

  function toggleSource(source: SourceCatalogNode, nextChecked: boolean) {
    const sourceChannelKeys = source.channels.map((channel) =>
      buildChannelKey(source.id, channel.label),
    );

    startTransition(() => {
      setSelection((current) => {
        const nextSelectedSourceIds = new Set(current.selectedSourceIds);
        const nextSelectedChannelKeys = new Set(current.selectedChannelKeys);

        if (nextChecked) {
          nextSelectedSourceIds.add(source.id);
          for (const channelKey of sourceChannelKeys) {
            nextSelectedChannelKeys.add(channelKey);
          }
        } else {
          nextSelectedSourceIds.delete(source.id);
          for (const channelKey of sourceChannelKeys) {
            nextSelectedChannelKeys.delete(channelKey);
          }
        }

        return normalizeSelection(
          {
            version: 1,
            selectedSourceIds: [...nextSelectedSourceIds],
            selectedChannelKeys: [...nextSelectedChannelKeys],
          },
          catalog,
        );
      });
    });
  }

  function toggleChannel(source: SourceCatalogNode, channelLabel: string, nextChecked: boolean) {
    const channelKey = buildChannelKey(source.id, channelLabel);

    startTransition(() => {
      setSelection((current) => {
        const nextSelectedSourceIds = new Set(current.selectedSourceIds);
        const nextSelectedChannelKeys = new Set(current.selectedChannelKeys);

        if (nextChecked) {
          nextSelectedChannelKeys.add(channelKey);
        } else {
          nextSelectedChannelKeys.delete(channelKey);
        }

        const hasSelectedChannel = source.channels.some((channel) =>
          nextSelectedChannelKeys.has(buildChannelKey(source.id, channel.label)),
        );

        if (hasSelectedChannel) {
          nextSelectedSourceIds.add(source.id);
        } else {
          nextSelectedSourceIds.delete(source.id);
        }

        return normalizeSelection(
          {
            version: 1,
            selectedSourceIds: [...nextSelectedSourceIds],
            selectedChannelKeys: [...nextSelectedChannelKeys],
          },
          catalog,
        );
      });
    });
  }

  function getSourceSelectionState(source: SourceCatalogNode): "all" | "partial" | "none" {
    let selectedChannels = 0;

    for (const channel of source.channels) {
      if (selectedChannelSet.has(buildChannelKey(source.id, channel.label))) {
        selectedChannels += 1;
      }
    }

    if (selectedChannels === 0) {
      return "none";
    }

    if (selectedChannels === source.channels.length) {
      return "all";
    }

    return "partial";
  }

  return {
    allSelected,
    selectedChannelKeys: selection.selectedChannelKeys,
    selectedChannelSet,
    selectedSourceIds: selection.selectedSourceIds,
    selectedSourceSet,
    toggleAll,
    toggleChannel,
    toggleSource,
    getSourceSelectionState,
  };
}
