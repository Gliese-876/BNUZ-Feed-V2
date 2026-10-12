export { hqbwzFetchTargets } from "./targets/hqbwz";

import { createConfiguredHtmlListParser } from "../parsers/configuredHtmlListParser";

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
