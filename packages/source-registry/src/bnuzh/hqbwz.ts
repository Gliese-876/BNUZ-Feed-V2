import type { FetchTarget } from "@bnuz-feed/contracts";

import { createConfiguredHtmlListParser } from "../parsers/configuredHtmlListParser";

const baseUrl = "https://hqb.bnuzh.edu.cn";

function resolvePublishedAt(item: Element): string | undefined {
  const year = item.querySelector(".year")?.textContent?.trim();
  const monthDay = item.querySelector(".month-day")?.textContent?.trim().replace(/·/g, "-");

  if (!year || !monthDay) {
    return undefined;
  }

  return `${year}-${monthDay}`;
}

const articleListItemSelector = "a.article";
const pictureArticleListItemSelector = "a.article";
const fileListItemSelector = "a.file";

export const hqbwzFetchTargets: FetchTarget[] = [
  { id: "xwdt", url: `${baseUrl}/xwgg/xwdt/index.htm`, channel: "新闻动态" },
  { id: "tzgg", url: `${baseUrl}/xwgg/tzgg/index.htm`, channel: "通知公告" },
  { id: "xynxgzcgz", url: `${baseUrl}/zcgz/xynxgzcgz/index.htm`, channel: "行业内相关政策规章" },
  { id: "xxxgzcgz", url: `${baseUrl}/zcgz/xxxgzcgz/index.htm`, channel: "学校相关政策规章" },
  { id: "zbgz", url: `${baseUrl}/dqjs/zbgz/index.htm`, channel: "支部工作" },
  { id: "zhsw", url: `${baseUrl}/bszn/zhsw/index.htm`, channel: "综合事务" },
  { id: "xsyb", url: `${baseUrl}/bszn/xsyb/index.htm`, channel: "学生医保" },
  { id: "ggws", url: `${baseUrl}/bszn/ggws/index.htm`, channel: "公共卫生" },
  { id: "cyfw", url: `${baseUrl}/bszn/cyfw/index.htm`, channel: "餐饮服务" },
  { id: "zgwy", url: `${baseUrl}/bszn/zgwy/index.htm`, channel: "自管物业" },
  { id: "yllh", url: `${baseUrl}/bszn/yllh/index.htm`, channel: "园林绿化" },
  { id: "dpcl", url: `${baseUrl}/bszn/dpcl/index.htm`, channel: "电瓶车辆" },
  { id: "ldjy", url: `${baseUrl}/ldjy/index.blk.htm`, channel: "劳动教育" },
  { id: "xzzq", url: `${baseUrl}/xzzq/index.htm`, channel: "下载专区" },
];

export const hqbwzParser = createConfiguredHtmlListParser({
  parserKey: "bnuzh/hqbwz",
  targets: [
    {
      requestId: "xwdt",
      itemSelector: pictureArticleListItemSelector,
      channel: "新闻动态",
      title: ".title",
      url: { attr: "href" },
      publishedAt: resolvePublishedAt,
      rawId: { attr: "href" },
      summary: ".summary",
    },
    {
      requestId: "tzgg",
      itemSelector: articleListItemSelector,
      channel: "通知公告",
      title: ".title",
      url: { attr: "href" },
      publishedAt: resolvePublishedAt,
      rawId: { attr: "href" },
      summary: ".summary",
    },
    {
      requestId: "xynxgzcgz",
      itemSelector: fileListItemSelector,
      channel: "行业内相关政策规章",
      title: ".name span",
      url: { attr: "href" },
      rawId: { attr: "href" },
    },
    {
      requestId: "xxxgzcgz",
      itemSelector: fileListItemSelector,
      channel: "学校相关政策规章",
      title: ".name span",
      url: { attr: "href" },
      rawId: { attr: "href" },
    },
    {
      requestId: "zbgz",
      itemSelector: articleListItemSelector,
      channel: "支部工作",
      title: ".title",
      url: { attr: "href" },
      publishedAt: resolvePublishedAt,
      rawId: { attr: "href" },
      summary: ".summary",
    },
    {
      requestId: "zhsw",
      itemSelector: articleListItemSelector,
      channel: "综合事务",
      title: ".title",
      url: { attr: "href" },
      publishedAt: resolvePublishedAt,
      rawId: { attr: "href" },
      summary: ".summary",
    },
    {
      requestId: "xsyb",
      itemSelector: articleListItemSelector,
      channel: "学生医保",
      title: ".title",
      url: { attr: "href" },
      publishedAt: resolvePublishedAt,
      rawId: { attr: "href" },
      summary: ".summary",
    },
    {
      requestId: "ggws",
      itemSelector: articleListItemSelector,
      channel: "公共卫生",
      title: ".title",
      url: { attr: "href" },
      publishedAt: resolvePublishedAt,
      rawId: { attr: "href" },
      summary: ".summary",
    },
    {
      requestId: "cyfw",
      itemSelector: articleListItemSelector,
      channel: "餐饮服务",
      title: ".title",
      url: { attr: "href" },
      publishedAt: resolvePublishedAt,
      rawId: { attr: "href" },
      summary: ".summary",
    },
    {
      requestId: "zgwy",
      itemSelector: articleListItemSelector,
      channel: "自管物业",
      title: ".title",
      url: { attr: "href" },
      publishedAt: resolvePublishedAt,
      rawId: { attr: "href" },
      summary: ".summary",
    },
    {
      requestId: "yllh",
      itemSelector: articleListItemSelector,
      channel: "园林绿化",
      title: ".title",
      url: { attr: "href" },
      publishedAt: resolvePublishedAt,
      rawId: { attr: "href" },
      summary: ".summary",
    },
    {
      requestId: "dpcl",
      itemSelector: articleListItemSelector,
      channel: "电瓶车辆",
      title: ".title",
      url: { attr: "href" },
      publishedAt: resolvePublishedAt,
      rawId: { attr: "href" },
      summary: ".summary",
    },
    {
      requestId: "ldjy",
      itemSelector: articleListItemSelector,
      channel: "劳动教育",
      title: ".title",
      url: { attr: "href" },
      publishedAt: resolvePublishedAt,
      rawId: { attr: "href" },
      summary: ".summary",
    },
    {
      requestId: "xzzq",
      itemSelector: fileListItemSelector,
      channel: "下载专区",
      title: ".name span",
      url: { attr: "href" },
      rawId: { attr: "href" },
    },
  ],
});
