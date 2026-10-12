// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SourceCatalogNode } from "./sourceCatalog";
import { buildChannelKey, sourceCatalog } from "./sourceCatalog";
import historicalDefault from "./__fixtures__/selection-v1-dd4015b.json";
import { useSourceSelection } from "./useSourceSelection";

vi.mock("./studentCollection", () => ({
  getStudentChannelKeys: (catalog: SourceCatalogNode[]) => catalog.flatMap((source) =>
    source.channels.filter((channel) => channel.label === "学生通知")
      .map((channel) => `${source.id}::${channel.label}`),
  ),
}));

const storageKey = "bnuz-feed:selection:v2";
const legacyStorageKey = "bnuz-feed:selection:v1";
const catalog: [SourceCatalogNode, SourceCatalogNode] = [
  {
    id: "student-services", name: "学生服务", fetchTargetCount: 2, searchText: "学生服务",
    channels: [{ label: "学生通知" }, { label: "部门动态" }],
  },
  {
    id: "research", name: "科研处", fetchTargetCount: 1, searchText: "科研处",
    channels: [{ label: "科研项目" }],
  },
];
const studentKey = buildChannelKey("student-services", "学生通知");
const researchKey = buildChannelKey("research", "科研项目");
const allKeys = catalog.flatMap((source) =>
  source.channels.map((channel) => buildChannelKey(source.id, channel.label)),
);

function flushPersistence() {
  act(() => vi.runAllTimers());
}

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("source collections", () => {
  it("starts with student channels and derives source selection from those channels", () => {
    const { result } = renderHook(() => useSourceSelection(catalog));

    expect(result.current.collection).toBe("student");
    expect(result.current.selectedChannelKeys).toEqual([studentKey]);
    expect(result.current.selectedSourceIds).toEqual(["student-services"]);
    expect(result.current.selectedSourceSet.has("research")).toBe(false);
    expect(result.current.allSelected).toBe(false);
    expect(result.current.getSourceSelectionState(catalog[0])).toBe("partial");
    expect(result.current.getSourceSelectionState(catalog[1])).toBe("none");
  });

  it("switches between student and all, and makes manual changes custom", () => {
    const { result } = renderHook(() => useSourceSelection(catalog));

    act(() => result.current.selectCollection("all"));
    expect(result.current.collection).toBe("all");
    expect(result.current.allSelected).toBe(true);
    expect(result.current.selectedChannelKeys).toEqual(allKeys);

    act(() => result.current.toggleChannel(catalog[0], "部门动态", false));
    expect(result.current.collection).toBe("custom");
    expect(result.current.selectedChannelKeys).toEqual([studentKey, researchKey]);

    act(() => result.current.resetDefault());
    expect(result.current.collection).toBe("student");
    expect(result.current.selectedChannelKeys).toEqual([studentKey]);

    act(() => result.current.toggleSource(catalog[1], true));
    expect(result.current.collection).toBe("custom");
    expect(result.current.selectedSourceIds).toEqual(["student-services", "research"]);
    expect(result.current.getSourceSelectionState(catalog[1])).toBe("all");

    act(() => result.current.toggleSource(catalog[0], false));
    expect(result.current.selectedChannelKeys).toEqual([researchKey]);
    expect(result.current.selectedSourceIds).toEqual(["research"]);

    act(() => result.current.toggleAll(true));
    expect(result.current.collection).toBe("all");
    act(() => result.current.toggleAll(false));
    expect(result.current.collection).toBe("custom");
    expect(result.current.selectedChannelKeys).toEqual([]);
    expect(result.current.selectedSourceIds).toEqual([]);
  });

  it("updates presets when the catalog changes while preserving a custom selection", () => {
    const { result, rerender } = renderHook(({ sources }: { sources: SourceCatalogNode[] }) => useSourceSelection(sources), {
      initialProps: { sources: catalog as SourceCatalogNode[] },
    });
    const addedSource: SourceCatalogNode = {
      id: "new-services", name: "新服务", fetchTargetCount: 1, searchText: "新服务",
      channels: [{ label: "学生通知" }],
    };
    const expandedCatalog = [...catalog, addedSource];
    const addedKey = buildChannelKey(addedSource.id, "学生通知");

    rerender({ sources: expandedCatalog });
    expect(result.current.selectedChannelKeys).toEqual([studentKey, addedKey]);

    act(() => result.current.selectCollection("all"));
    rerender({ sources: catalog });
    expect(result.current.selectedChannelKeys).toEqual(allKeys);

    act(() => result.current.toggleAll(false));
    act(() => result.current.toggleSource(catalog[1], true));
    rerender({ sources: expandedCatalog });
    expect(result.current.collection).toBe("custom");
    expect(result.current.selectedChannelKeys).toEqual([researchKey]);

    rerender({ sources: [catalog[0]] });
    expect(result.current.collection).toBe("custom");
    expect(result.current.selectedChannelKeys).toEqual([]);
  });
});

describe("selection persistence and migration", () => {
  it("migrates the previous all-source default to student and saves the new preset", () => {
    localStorage.setItem(legacyStorageKey, JSON.stringify({
      version: 1,
      selectedSourceIds: catalog.map((source) => source.id),
      selectedChannelKeys: allKeys,
    }));

    const { result } = renderHook(() => useSourceSelection(catalog));
    expect(result.current.collection).toBe("student");
    expect(result.current.selectedChannelKeys).toEqual([studentKey]);
    flushPersistence();
    expect(JSON.parse(localStorage.getItem(storageKey)!)).toEqual({
      version: 2, collection: "student",
    });
  });

  it("recognizes the exact 44-source historical default after the official catalog expands", () => {
    expect(historicalDefault.selectedSourceIds).toHaveLength(44);
    expect(historicalDefault.selectedChannelKeys).toHaveLength(459);
    expect(sourceCatalog.length).toBeGreaterThan(44);
    localStorage.setItem(legacyStorageKey, JSON.stringify({
      ...historicalDefault,
      selectedSourceIds: [...historicalDefault.selectedSourceIds].reverse(),
      selectedChannelKeys: [...historicalDefault.selectedChannelKeys].reverse(),
    }));

    const { result } = renderHook(() => useSourceSelection(sourceCatalog));
    expect(result.current.collection).toBe("student");
    flushPersistence();
    expect(JSON.parse(localStorage.getItem(storageKey)!)).toEqual({
      version: 2, collection: "student",
    });
  });

  it.each(["remove channel", "replace channel", "replace source"])(
    "preserves a historical custom selection with one change: %s",
    (change) => {
      const selectedSourceIds = [...historicalDefault.selectedSourceIds];
      const selectedChannelKeys = [...historicalDefault.selectedChannelKeys];
      if (change === "remove channel") {
        selectedChannelKeys.pop();
      } else if (change === "replace channel") {
        selectedChannelKeys[0] = "custom-source::custom-channel";
      } else {
        selectedSourceIds[0] = "custom-source";
      }
      localStorage.setItem(legacyStorageKey, JSON.stringify({
        version: 1, selectedSourceIds, selectedChannelKeys,
      }));

      const { result } = renderHook(() => useSourceSelection(sourceCatalog));
      const validKeys = new Set(sourceCatalog.flatMap((source) => source.channels.map((channel) =>
        buildChannelKey(source.id, channel.label),
      )));
      expect(result.current.collection).toBe("custom");
      expect(result.current.selectedChannelKeys).toEqual(selectedChannelKeys.filter((key) =>
        validKeys.has(key),
      ));
    },
  );

  it("keeps an unknown legacy superset of the current catalog custom", () => {
    localStorage.setItem(legacyStorageKey, JSON.stringify({
      version: 1,
      selectedSourceIds: [...catalog.map((source) => source.id), "unknown-old-source"],
      selectedChannelKeys: [...allKeys, "unknown-old-source::栏目"],
    }));

    const { result } = renderHook(() => useSourceSelection(catalog));
    expect(result.current.collection).toBe("custom");
    expect(result.current.selectedChannelKeys).toEqual(allKeys);
  });

  it.each([
    { selectedChannelKeys: [researchKey] },
    { selectedChannelKeys: [] },
  ])("preserves a legacy custom selection: $selectedChannelKeys", ({ selectedChannelKeys }) => {
    localStorage.setItem(legacyStorageKey, JSON.stringify({
      version: 1,
      selectedSourceIds: selectedChannelKeys.length ? ["research"] : [],
      selectedChannelKeys,
    }));

    const { result } = renderHook(() => useSourceSelection(catalog));
    expect(result.current.collection).toBe("custom");
    expect(result.current.selectedChannelKeys).toEqual(selectedChannelKeys);
  });

  it("reopens an explicitly selected all preset and rebuilds it from the current catalog", () => {
    const first = renderHook(() => useSourceSelection([catalog[0]]));
    act(() => first.result.current.selectCollection("all"));
    flushPersistence();
    first.unmount();

    const reopened = renderHook(() => useSourceSelection(catalog));
    expect(reopened.result.current.collection).toBe("all");
    expect(reopened.result.current.selectedChannelKeys).toEqual(allKeys);
  });

  it("reopens custom channels without adding preset channels or restoring obsolete channels", () => {
    const first = renderHook(() => useSourceSelection(catalog));
    act(() => first.result.current.toggleAll(false));
    act(() => first.result.current.toggleSource(catalog[1], true));
    flushPersistence();
    first.unmount();

    const reopened = renderHook(() => useSourceSelection(catalog));
    expect(reopened.result.current.collection).toBe("custom");
    expect(reopened.result.current.selectedChannelKeys).toEqual([researchKey]);
    reopened.unmount();

    const removed = renderHook(() => useSourceSelection([catalog[0]]));
    expect(removed.result.current.collection).toBe("custom");
    expect(removed.result.current.selectedChannelKeys).toEqual([]);
  });

  it("uses v2 custom state even if the legacy state selected everything", () => {
    localStorage.setItem(legacyStorageKey, JSON.stringify({
      version: 1, selectedSourceIds: catalog.map((source) => source.id), selectedChannelKeys: allKeys,
    }));
    localStorage.setItem(storageKey, JSON.stringify({
      version: 2, collection: "custom", selectedChannelKeys: [],
    }));

    const { result } = renderHook(() => useSourceSelection(catalog));
    expect(result.current.collection).toBe("custom");
    expect(result.current.selectedChannelKeys).toEqual([]);
  });

  it("remains usable when storage is absent", () => {
    vi.stubGlobal("localStorage", undefined);
    const { result } = renderHook(() => useSourceSelection(catalog));
    expect(result.current.collection).toBe("student");
    act(() => result.current.selectCollection("all"));
    expect(result.current.allSelected).toBe(true);
    expect(flushPersistence).not.toThrow();
  });

  it("remains usable when storage reads and writes throw", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Storage blocked", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage full", "QuotaExceededError");
    });

    const { result } = renderHook(() => useSourceSelection(catalog));
    expect(result.current.collection).toBe("student");
    act(() => result.current.toggleAll(false));
    expect(result.current.collection).toBe("custom");
    expect(result.current.selectedChannelKeys).toEqual([]);
    expect(flushPersistence).not.toThrow();
  });
});
