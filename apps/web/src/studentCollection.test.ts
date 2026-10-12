import { describe, expect, it } from "vitest";

import { buildChannelKey, sourceCatalog, type SourceCatalogNode } from "./sourceCatalog";
import { getStudentChannelKeys, studentCollectionRules } from "./studentCollection";

const academicSourceId = "75e9fe7e62fb4d13a04c54339b880077";

function source(id: string, name: string, labels: string[]): SourceCatalogNode {
  return {
    id, name, fetchTargetCount: labels.length, searchText: name,
    channels: labels.map((label) => ({ label })),
  };
}

describe("student collection", () => {
  it("keeps selections by official identity when a source is renamed", () => {
    const catalog = [source(academicSourceId, "更新后的教务名称", ["通知公告", "教师培训"])];

    expect(getStudentChannelKeys(catalog)).toEqual([
      buildChannelKey(academicSourceId, "通知公告"),
    ]);
  });

  it("does not opt in new sources or new channels with similar names", () => {
    const catalog = [
      source("new-source", "教务部", ["通知公告", "选课"]),
      source(academicSourceId, "教务部", ["新通知公告", "教师培训", "综合新闻"]),
    ];

    expect(getStudentChannelKeys(catalog)).toEqual([]);
  });

  it("handles removed sources and channels without selecting a replacement", () => {
    expect(getStudentChannelKeys([])).toEqual([]);
    expect(getStudentChannelKeys([source(academicSourceId, "教务部", [])])).toEqual([]);
  });

  it("returns each key once without changing the catalog", () => {
    const catalog = [source(academicSourceId, "教务部", ["通知公告", "通知公告", "选课"])];
    const original = structuredClone(catalog);

    expect(getStudentChannelKeys(catalog)).toEqual([
      buildChannelKey(academicSourceId, "通知公告"),
      buildChannelKey(academicSourceId, "选课"),
    ]);
    expect(catalog).toEqual(original);
  });

  it("uses channels that still exist in the official source catalog", () => {
    const catalogById = new Map(sourceCatalog.map((entry) => [entry.id, entry]));

    for (const [sourceId, channels] of Object.entries(studentCollectionRules)) {
      const entry = catalogById.get(sourceId);
      expect(entry, `collection source ${sourceId}`).toBeDefined();
      for (const label of channels) {
        expect(entry?.channels.some((channel) => channel.label === label),
          `collection channel ${entry?.name}: ${label}`).toBe(true);
      }
    }
  });

  it("includes the main student needs and excludes general administrative news", () => {
    const keys = new Set(getStudentChannelKeys(sourceCatalog));

    for (const [sourceId, label] of [
      [academicSourceId, "通知公告"],
      ["e0c5a11a3fec4476b4c24202ff6820ab", "工作通知"],
      ["9e442f682ee94c92a56260b87daadd3d", "双选会"],
      ["55cf70db9df5483eb0a88ff3cf3eab54", "资源动态"],
      ["55cf70db9df5483eb0a88ff3cf3eab54", "培训讲座"],
      ["f018e769b2bd4733a968e902befe7e17", "通知公示"],
      ["f018e769b2bd4733a968e902befe7e17", "学术活动"],
      ["86753130ceb542929a38b9d9319e9372", "学生医保"],
      ["f8b68f1c9a724254a4feb6285bb8cef3", "信息公告"],
      ["15f56dbc97ec445e95f40ceed144be2a", "心理健康"],
    ] as const) {
      expect(keys.has(buildChannelKey(sourceId, label))).toBe(true);
    }

    expect(keys.has(buildChannelKey(academicSourceId, "教师培训"))).toBe(false);
    expect(keys.has(buildChannelKey("15f56dbc97ec445e95f40ceed144be2a", "弘文要闻"))).toBe(false);
    expect(keys.has(buildChannelKey("f018e769b2bd4733a968e902befe7e17", "综合新闻"))).toBe(false);
    expect(keys.has(buildChannelKey("9193b9297fc840aaaac832f8a8a2c6c3", "科研动态"))).toBe(false);
    expect(keys.has(buildChannelKey("9e442f682ee94c92a56260b87daadd3d", "职位信息"))).toBe(false);
    expect(keys.has(buildChannelKey("9e442f682ee94c92a56260b87daadd3d", "招聘简讯"))).toBe(false);
  });
});
