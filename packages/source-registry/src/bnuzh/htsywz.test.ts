// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { htsywzFetchTargets, htsywzParser } from "./htsywz";

function createPage(
  overrides: Partial<RawPage> & Pick<RawPage, "requestId" | "requestUrl" | "finalUrl" | "bodyText">,
): RawPage {
  return {
    sourceId: "7b06ff51eebb4ac9973b2bd4821d25cb",
    fetchedAt: "2026-03-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("htsywz", () => {
  it("declares the confirmed paginated message sources and excludes static pages", () => {
    expect(htsywzFetchTargets).toEqual([
      { id: "sdyw/index", url: "https://ht.bnuzh.edu.cn/sdyw/index.htm", channel: "师大要闻" },
      { id: "sdyw/index1", url: "https://ht.bnuzh.edu.cn/sdyw/index1.htm", channel: "师大要闻" },
      { id: "sdyw/index2", url: "https://ht.bnuzh.edu.cn/sdyw/index2.htm", channel: "师大要闻" },
      { id: "sdyw/index3", url: "https://ht.bnuzh.edu.cn/sdyw/index3.htm", channel: "师大要闻" },
      { id: "sdyw/index4", url: "https://ht.bnuzh.edu.cn/sdyw/index4.htm", channel: "师大要闻" },
      { id: "sdyw/index5", url: "https://ht.bnuzh.edu.cn/sdyw/index5.htm", channel: "师大要闻" },
      { id: "sdyw/index6", url: "https://ht.bnuzh.edu.cn/sdyw/index6.htm", channel: "师大要闻" },
      { id: "sdyw/index7", url: "https://ht.bnuzh.edu.cn/sdyw/index7.htm", channel: "师大要闻" },
      { id: "sdyw/index8", url: "https://ht.bnuzh.edu.cn/sdyw/index8.htm", channel: "师大要闻" },
      { id: "sdyw/index9", url: "https://ht.bnuzh.edu.cn/sdyw/index9.htm", channel: "师大要闻" },
      { id: "sdyw/index10", url: "https://ht.bnuzh.edu.cn/sdyw/index10.htm", channel: "师大要闻" },
      { id: "sdyw/index11", url: "https://ht.bnuzh.edu.cn/sdyw/index11.htm", channel: "师大要闻" },
      { id: "tzgg/index", url: "https://ht.bnuzh.edu.cn/tzgg/index.htm", channel: "通知公告" },
      { id: "tzgg/index1", url: "https://ht.bnuzh.edu.cn/tzgg/index1.htm", channel: "通知公告" },
      { id: "tzgg/index2", url: "https://ht.bnuzh.edu.cn/tzgg/index2.htm", channel: "通知公告" },
      { id: "czyl/index", url: "https://ht.bnuzh.edu.cn/czyl/index.htm", channel: "成长引领" },
      { id: "czyl/index1", url: "https://ht.bnuzh.edu.cn/czyl/index1.htm", channel: "成长引领" },
      { id: "czyl/index2", url: "https://ht.bnuzh.edu.cn/czyl/index2.htm", channel: "成长引领" },
      { id: "czyl/index3", url: "https://ht.bnuzh.edu.cn/czyl/index3.htm", channel: "成长引领" },
      { id: "czyl/index4", url: "https://ht.bnuzh.edu.cn/czyl/index4.htm", channel: "成长引领" },
      { id: "czyl/index5", url: "https://ht.bnuzh.edu.cn/czyl/index5.htm", channel: "成长引领" },
      { id: "czyl/index6", url: "https://ht.bnuzh.edu.cn/czyl/index6.htm", channel: "成长引领" },
      { id: "czyl/index7", url: "https://ht.bnuzh.edu.cn/czyl/index7.htm", channel: "成长引领" },
      { id: "czyl/index8", url: "https://ht.bnuzh.edu.cn/czyl/index8.htm", channel: "成长引领" },
      { id: "czyl/index9", url: "https://ht.bnuzh.edu.cn/czyl/index9.htm", channel: "成长引领" },
      { id: "czyl/index10", url: "https://ht.bnuzh.edu.cn/czyl/index10.htm", channel: "成长引领" },
      { id: "czyl/index11", url: "https://ht.bnuzh.edu.cn/czyl/index11.htm", channel: "成长引领" },
      { id: "czyl/index12", url: "https://ht.bnuzh.edu.cn/czyl/index12.htm", channel: "成长引领" },
      { id: "czyl/index13", url: "https://ht.bnuzh.edu.cn/czyl/index13.htm", channel: "成长引领" },
      { id: "czyl/index14", url: "https://ht.bnuzh.edu.cn/czyl/index14.htm", channel: "成长引领" },
      { id: "xyfz/index", url: "https://ht.bnuzh.edu.cn/xyfz/index.htm", channel: "学业发展" },
      { id: "xyfz/index1", url: "https://ht.bnuzh.edu.cn/xyfz/index1.htm", channel: "学业发展" },
      { id: "xyfz/index2", url: "https://ht.bnuzh.edu.cn/xyfz/index2.htm", channel: "学业发展" },
      { id: "xyfz/index3", url: "https://ht.bnuzh.edu.cn/xyfz/index3.htm", channel: "学业发展" },
      { id: "xyfz/index4", url: "https://ht.bnuzh.edu.cn/xyfz/index4.htm", channel: "学业发展" },
      { id: "xyfz/index5", url: "https://ht.bnuzh.edu.cn/xyfz/index5.htm", channel: "学业发展" },
      { id: "xyfz/index6", url: "https://ht.bnuzh.edu.cn/xyfz/index6.htm", channel: "学业发展" },
      { id: "xyfz/index7", url: "https://ht.bnuzh.edu.cn/xyfz/index7.htm", channel: "学业发展" },
      { id: "xyfz/index8", url: "https://ht.bnuzh.edu.cn/xyfz/index8.htm", channel: "学业发展" },
      { id: "xyfz/index9", url: "https://ht.bnuzh.edu.cn/xyfz/index9.htm", channel: "学业发展" },
      { id: "xyfz/index10", url: "https://ht.bnuzh.edu.cn/xyfz/index10.htm", channel: "学业发展" },
      { id: "xyfz/index11", url: "https://ht.bnuzh.edu.cn/xyfz/index11.htm", channel: "学业发展" },
      { id: "xyfz/index12", url: "https://ht.bnuzh.edu.cn/xyfz/index12.htm", channel: "学业发展" },
      { id: "syfw/index", url: "https://ht.bnuzh.edu.cn/syfw/index.htm", channel: "生涯服务" },
      { id: "syfw/index1", url: "https://ht.bnuzh.edu.cn/syfw/index1.htm", channel: "生涯服务" },
      { id: "syfw/index2", url: "https://ht.bnuzh.edu.cn/syfw/index2.htm", channel: "生涯服务" },
      { id: "syfw/index3", url: "https://ht.bnuzh.edu.cn/syfw/index3.htm", channel: "生涯服务" },
      { id: "syfw/index4", url: "https://ht.bnuzh.edu.cn/syfw/index4.htm", channel: "生涯服务" },
      { id: "syfw/index5", url: "https://ht.bnuzh.edu.cn/syfw/index5.htm", channel: "生涯服务" },
      { id: "syfw/index6", url: "https://ht.bnuzh.edu.cn/syfw/index6.htm", channel: "生涯服务" },
      { id: "syfw/index7", url: "https://ht.bnuzh.edu.cn/syfw/index7.htm", channel: "生涯服务" },
      { id: "syfw/index8", url: "https://ht.bnuzh.edu.cn/syfw/index8.htm", channel: "生涯服务" },
      { id: "syfw/index9", url: "https://ht.bnuzh.edu.cn/syfw/index9.htm", channel: "生涯服务" },
      { id: "syfw/index10", url: "https://ht.bnuzh.edu.cn/syfw/index10.htm", channel: "生涯服务" },
      { id: "syfw/index11", url: "https://ht.bnuzh.edu.cn/syfw/index11.htm", channel: "生涯服务" },
      { id: "syfw/index12", url: "https://ht.bnuzh.edu.cn/syfw/index12.htm", channel: "生涯服务" },
      { id: "syfw/index13", url: "https://ht.bnuzh.edu.cn/syfw/index13.htm", channel: "生涯服务" },
      { id: "syfw/index14", url: "https://ht.bnuzh.edu.cn/syfw/index14.htm", channel: "生涯服务" },
      { id: "syfw/index15", url: "https://ht.bnuzh.edu.cn/syfw/index15.htm", channel: "生涯服务" },
      { id: "syfw/index16", url: "https://ht.bnuzh.edu.cn/syfw/index16.htm", channel: "生涯服务" },
      { id: "syfw/index17", url: "https://ht.bnuzh.edu.cn/syfw/index17.htm", channel: "生涯服务" },
      { id: "syfw/index18", url: "https://ht.bnuzh.edu.cn/syfw/index18.htm", channel: "生涯服务" },
      { id: "htfc/index", url: "https://ht.bnuzh.edu.cn/htfc/index.htm", channel: "会同风采" },
      { id: "htfc/index1", url: "https://ht.bnuzh.edu.cn/htfc/index1.htm", channel: "会同风采" },
      { id: "htfc/index2", url: "https://ht.bnuzh.edu.cn/htfc/index2.htm", channel: "会同风采" },
      { id: "htfc/index3", url: "https://ht.bnuzh.edu.cn/htfc/index3.htm", channel: "会同风采" },
      { id: "htfc/index4", url: "https://ht.bnuzh.edu.cn/htfc/index4.htm", channel: "会同风采" },
      { id: "cjyw/index", url: "https://ht.bnuzh.edu.cn/bszn/cjyw/index.htm", channel: "常见业务" },
      { id: "zywj/index", url: "https://ht.bnuzh.edu.cn/bszn/zywj/index.htm", channel: "重要文件" },
      { id: "cyxz/index", url: "https://ht.bnuzh.edu.cn/bszn/cyxz/index.htm", channel: "常用下载" },
    ]);
  });

  it("parses list entries with leading and trailing date tokens", async () => {
    const page = createPage({
      requestId: "sdyw/index",
      requestUrl: "https://ht.bnuzh.edu.cn/sdyw/index.htm",
      finalUrl: "https://ht.bnuzh.edu.cn/sdyw/index.htm",
      bodyText: `
        <main>
          <ul>
            <li><a href="https://news.bnu.edu.cn/zx/ttgz/ffd13b4fea2e408d937e25267bd00ab7.htm">2026/02/26 北师大召开党委理论学习中心组专题学习会议</a></li>
            <li><a href="https://mp.weixin.qq.com/s/lxY8E0ouQpH-yIX9yAXU9g">2025/11/16 第七届中国教育创新成果公益博览会在广东珠海开幕</a></li>
            <li><a href="../index.htm">首页</a></li>
          </ul>
        </main>
      `,
    });

    await expect(htsywzParser.parse(page)).resolves.toEqual([
      {
        sourceId: "7b06ff51eebb4ac9973b2bd4821d25cb",
        rawId: "https://news.bnu.edu.cn/zx/ttgz/ffd13b4fea2e408d937e25267bd00ab7.htm",
        rawTitle: "北师大召开党委理论学习中心组专题学习会议",
        rawUrl: "https://news.bnu.edu.cn/zx/ttgz/ffd13b4fea2e408d937e25267bd00ab7.htm",
        rawPublishedAt: "2026-02-26",
        rawChannel: "师大要闻",
        rawSummary: undefined,
        extras: {
          requestId: "sdyw/index",
        },
      },
      {
        sourceId: "7b06ff51eebb4ac9973b2bd4821d25cb",
        rawId: "https://mp.weixin.qq.com/s/lxY8E0ouQpH-yIX9yAXU9g",
        rawTitle: "第七届中国教育创新成果公益博览会在广东珠海开幕",
        rawUrl: "https://mp.weixin.qq.com/s/lxY8E0ouQpH-yIX9yAXU9g",
        rawPublishedAt: "2025-11-16",
        rawChannel: "师大要闻",
        rawSummary: undefined,
        extras: {
          requestId: "sdyw/index",
        },
      },
    ]);
  });

  it("parses guide pages that expose dated business entries after the second Playwright review", async () => {
    const page = createPage({
      requestId: "cjyw/index",
      requestUrl: "https://ht.bnuzh.edu.cn/bszn/cjyw/index.htm",
      finalUrl: "https://ht.bnuzh.edu.cn/bszn/cjyw/index.htm",
      bodyText: `
        <main>
          <ul>
            <li><a href="https://mp.weixin.qq.com/s/dxKfJmI9Nzblq-uUNkSJTA">大学生基本医疗保险报销问题相关说明 2022/05/08</a></li>
            <li><a href="d1fd65d5adfb4c8ba3de3d1f54bd7b7f.htm">党员发展流程图 2022/08/21</a></li>
            <li><a href="index1.htm">下一页</a></li>
          </ul>
        </main>
      `,
    });

    await expect(htsywzParser.parse(page)).resolves.toEqual([
      {
        sourceId: "7b06ff51eebb4ac9973b2bd4821d25cb",
        rawId: "https://mp.weixin.qq.com/s/dxKfJmI9Nzblq-uUNkSJTA",
        rawTitle: "大学生基本医疗保险报销问题相关说明",
        rawUrl: "https://mp.weixin.qq.com/s/dxKfJmI9Nzblq-uUNkSJTA",
        rawPublishedAt: "2022-05-08",
        rawChannel: "常见业务",
        rawSummary: undefined,
        extras: {
          requestId: "cjyw/index",
        },
      },
      {
        sourceId: "7b06ff51eebb4ac9973b2bd4821d25cb",
        rawId: "d1fd65d5adfb4c8ba3de3d1f54bd7b7f.htm",
        rawTitle: "党员发展流程图",
        rawUrl: "https://ht.bnuzh.edu.cn/bszn/cjyw/d1fd65d5adfb4c8ba3de3d1f54bd7b7f.htm",
        rawPublishedAt: "2022-08-21",
        rawChannel: "常见业务",
        rawSummary: undefined,
        extras: {
          requestId: "cjyw/index",
        },
      },
    ]);
  });

  it("parses relative links and filters navigation items from a category list", async () => {
    const page = createPage({
      requestId: "htfc/index",
      requestUrl: "https://ht.bnuzh.edu.cn/htfc/index.htm",
      finalUrl: "https://ht.bnuzh.edu.cn/htfc/index.htm",
      bodyText: `
        <main>
          <ul>
            <li><a href="https://mp.weixin.qq.com/s/4NESGoOoVeoamvue24sJ4g">【会同月历】三月丨春水初生，春林初盛 2026/03/09</a></li>
            <li><a href="./a1.htm">【会同月历】惊蛰丨阳和启蛰，品物皆春 2026/03/05</a></li>
            <li><a href="index1.htm">下一页</a></li>
          </ul>
        </main>
      `,
    });

    await expect(htsywzParser.parse(page)).resolves.toEqual([
      {
        sourceId: "7b06ff51eebb4ac9973b2bd4821d25cb",
        rawId: "https://mp.weixin.qq.com/s/4NESGoOoVeoamvue24sJ4g",
        rawTitle: "【会同月历】三月丨春水初生，春林初盛",
        rawUrl: "https://mp.weixin.qq.com/s/4NESGoOoVeoamvue24sJ4g",
        rawPublishedAt: "2026-03-09",
        rawChannel: "会同风采",
        rawSummary: undefined,
        extras: {
          requestId: "htfc/index",
        },
      },
      {
        sourceId: "7b06ff51eebb4ac9973b2bd4821d25cb",
        rawId: "./a1.htm",
        rawTitle: "【会同月历】惊蛰丨阳和启蛰，品物皆春",
        rawUrl: "https://ht.bnuzh.edu.cn/htfc/a1.htm",
        rawPublishedAt: "2026-03-05",
        rawChannel: "会同风采",
        rawSummary: undefined,
        extras: {
          requestId: "htfc/index",
        },
      },
    ]);
  });
});
