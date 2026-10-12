import { startTransition, useEffect, useMemo, useState } from "react";

import type { SourceCatalogNode } from "./sourceCatalog";
import { buildChannelKey } from "./sourceCatalog";
import { getStudentChannelKeys } from "./studentCollection";

type Collection = "student" | "all" | "custom";

interface SelectionState {
  version: 2;
  collection: Collection;
  selectedChannelKeys: string[];
}

const storageKey = "bnuz-feed:selection:v2";
const legacyStorageKey = "bnuz-feed:selection:v1";

// Exact v1 all-selection snapshots, before official-directory changes. Hash the
// sorted sets in both directions so a similarly sized custom selection stays custom.
const knownLegacyDefaults = new Set([
  "44:459:20945:dfcc5047:44d3cc97", // dd4015b; fixture: selection-v1-dd4015b.json
]);

function getLegacySelectionFingerprint(sourceIds: Set<string>, channelKeys: Set<string>): string {
  const value = JSON.stringify([[...sourceIds].sort(), [...channelKeys].sort()]);
  let forward = 2166136261;
  let backward = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    forward = Math.imul(forward ^ value.charCodeAt(index), 16777619);
    backward = Math.imul(backward ^ value.charCodeAt(value.length - 1 - index), 16777619);
  }
  return [
    sourceIds.size, channelKeys.size, value.length,
    (forward >>> 0).toString(16), (backward >>> 0).toString(16),
  ].join(":");
}

function getAllChannelKeys(catalog: SourceCatalogNode[]): string[] {
  return catalog.flatMap((source) =>
    source.channels.map((channel) => buildChannelKey(source.id, channel.label)),
  );
}

function createCollectionSelection(
  collection: "student" | "all",
  catalog: SourceCatalogNode[],
): SelectionState {
  return {
    version: 2,
    collection,
    selectedChannelKeys:
      collection === "student" ? getStudentChannelKeys(catalog) : getAllChannelKeys(catalog),
  };
}

function normalizeSelection(selection: SelectionState, catalog: SourceCatalogNode[]): SelectionState {
  const validChannelKeys = new Set(getAllChannelKeys(catalog));
  const selectedChannelKeys = selection.collection === "custom"
    ? [...new Set(selection.selectedChannelKeys.filter((key) => validChannelKeys.has(key)))]
    : createCollectionSelection(selection.collection, catalog).selectedChannelKeys;

  if (
    selectedChannelKeys.length === selection.selectedChannelKeys.length &&
    selectedChannelKeys.every((key, index) => key === selection.selectedChannelKeys[index])
  ) {
    return selection;
  }

  return { ...selection, selectedChannelKeys };
}

function loadSelection(catalog: SourceCatalogNode[]): SelectionState {
  const defaultSelection = () => createCollectionSelection("student", catalog);

  try {
    if (typeof localStorage === "undefined") {
      return defaultSelection();
    }

    const rawValue = localStorage.getItem(storageKey);
    if (rawValue) {
      const parsed = JSON.parse(rawValue) as Partial<SelectionState> | null;
      if (parsed?.version === 2) {
        if (parsed.collection === "student" || parsed.collection === "all") {
          return createCollectionSelection(parsed.collection, catalog);
        }
        if (parsed.collection === "custom" && Array.isArray(parsed.selectedChannelKeys)) {
          return normalizeSelection({
            version: 2,
            collection: "custom",
            selectedChannelKeys: parsed.selectedChannelKeys.map(String),
          }, catalog);
        }
      }
      return defaultSelection();
    }

    const rawLegacyValue = localStorage.getItem(legacyStorageKey);
    if (!rawLegacyValue) {
      return defaultSelection();
    }

    const legacy = JSON.parse(rawLegacyValue) as {
      selectedSourceIds?: unknown;
      selectedChannelKeys?: unknown;
    } | null;
    if (!Array.isArray(legacy?.selectedSourceIds) || !Array.isArray(legacy?.selectedChannelKeys)) {
      return defaultSelection();
    }

    const selectedSourceIds = new Set(legacy.selectedSourceIds.map(String));
    const selectedChannelKeys = new Set(legacy.selectedChannelKeys.map(String));
    const allChannelKeys = getAllChannelKeys(catalog);
    const matchesCurrentDefault = catalog.length > 0 &&
      selectedSourceIds.size === catalog.length &&
      selectedChannelKeys.size === allChannelKeys.length &&
      catalog.every((source) => selectedSourceIds.has(source.id)) &&
      allChannelKeys.every((key) => selectedChannelKeys.has(key));
    const wasAllSelected = matchesCurrentDefault || knownLegacyDefaults.has(
      getLegacySelectionFingerprint(selectedSourceIds, selectedChannelKeys),
    );

    return wasAllSelected ? defaultSelection() : normalizeSelection({
      version: 2,
      collection: "custom",
      selectedChannelKeys: [...selectedChannelKeys],
    }, catalog);
  } catch {
    return defaultSelection();
  }
}

export function useSourceSelection(catalog: SourceCatalogNode[]) {
  const [selection, setSelection] = useState<SelectionState>(() => loadSelection(catalog));

  useEffect(() => {
    startTransition(() => {
      setSelection((current) => normalizeSelection(current, catalog));
    });
  }, [catalog]);

  useEffect(() => {
    const persist = () => {
      try {
        if (typeof localStorage === "undefined") {
          return;
        }
        // Presets follow the catalog; only custom selections need a stored channel list.
        const stored = selection.collection === "custom"
          ? selection
          : { version: 2, collection: selection.collection };
        localStorage.setItem(storageKey, JSON.stringify(stored));
      } catch {
        // Reading remains usable when private browsing or a full quota blocks persistence.
      }
    };

    if (typeof requestIdleCallback === "function") {
      const idleId = requestIdleCallback(persist, { timeout: 500 });
      return () => cancelIdleCallback(idleId);
    }

    const timeoutId = window.setTimeout(persist, 0);
    return () => window.clearTimeout(timeoutId);
  }, [selection]);

  const allChannelKeys = useMemo(() => getAllChannelKeys(catalog), [catalog]);
  const selectedChannelSet = useMemo(
    () => new Set(selection.selectedChannelKeys),
    [selection.selectedChannelKeys],
  );
  const selectedSourceIds = useMemo(
    () => catalog.filter((source) => source.channels.some((channel) =>
      selectedChannelSet.has(buildChannelKey(source.id, channel.label)),
    )).map((source) => source.id),
    [catalog, selectedChannelSet],
  );
  const selectedSourceSet = useMemo(() => new Set(selectedSourceIds), [selectedSourceIds]);
  const allSelected = allChannelKeys.every((key) => selectedChannelSet.has(key));

  function selectCollection(collection: "student" | "all") {
    startTransition(() => {
      setSelection(createCollectionSelection(collection, catalog));
    });
  }

  function resetDefault() {
    selectCollection("student");
  }

  function toggleAll(nextChecked: boolean) {
    if (nextChecked) {
      selectCollection("all");
      return;
    }
    startTransition(() => {
      setSelection({ version: 2, collection: "custom", selectedChannelKeys: [] });
    });
  }

  function toggleChannelKeys(channelKeys: string[], nextChecked: boolean) {
    startTransition(() => {
      setSelection((current) => {
        const nextSelectedChannelKeys = new Set(current.selectedChannelKeys);
        for (const channelKey of channelKeys) {
          if (nextChecked) {
            nextSelectedChannelKeys.add(channelKey);
          } else {
            nextSelectedChannelKeys.delete(channelKey);
          }
        }
        return normalizeSelection({
          version: 2,
          collection: "custom",
          selectedChannelKeys: [...nextSelectedChannelKeys],
        }, catalog);
      });
    });
  }

  function toggleSource(source: SourceCatalogNode, nextChecked: boolean) {
    toggleChannelKeys(source.channels.map((channel) =>
      buildChannelKey(source.id, channel.label),
    ), nextChecked);
  }

  function toggleChannel(source: SourceCatalogNode, channelLabel: string, nextChecked: boolean) {
    toggleChannelKeys([buildChannelKey(source.id, channelLabel)], nextChecked);
  }

  function getSourceSelectionState(source: SourceCatalogNode): "all" | "partial" | "none" {
    const selectedCount = source.channels.filter((channel) =>
      selectedChannelSet.has(buildChannelKey(source.id, channel.label)),
    ).length;
    if (selectedCount === 0) {
      return "none";
    }
    return selectedCount === source.channels.length ? "all" : "partial";
  }

  return {
    collection: selection.collection,
    selectCollection,
    resetDefault,
    allSelected,
    selectedChannelKeys: selection.selectedChannelKeys,
    selectedChannelSet,
    selectedSourceIds,
    selectedSourceSet,
    toggleAll,
    toggleChannel,
    toggleSource,
    getSourceSelectionState,
  };
}
