import type { FetchTarget } from "@bnuz-feed/contracts";

import {
  createConfiguredHtmlListParser,
  type HtmlListParserConfig,
} from "../parsers/configuredHtmlListParser";

const baseUrl = "https://sfd-degreeshow.bnuzh.edu.cn";

const sectionTargets: Array<{
  requestId: string;
  url: string;
  channel: string;
}> = [
  {
    requestId: "wmzy",
    url: `${baseUrl}/wmzy/index.htm`,
    channel: "文脉织影",
  },
  {
    requestId: "gjms",
    url: `${baseUrl}/gjms/index.htm`,
    channel: "硅基蔓生",
  },
  {
    requestId: "ggzz",
    url: `${baseUrl}/ggzz/index.htm`,
    channel: "感官褶皱",
  },
  {
    requestId: "gxtp",
    url: `${baseUrl}/gxtp/index.htm`,
    channel: "关系拓扑",
  },
];

export const bsdwlsjxyssyjsbyzFetchTargets: FetchTarget[] = sectionTargets.map((target) => ({
  id: target.requestId,
  url: target.url,
  channel: target.channel,
}));

const parserConfig: HtmlListParserConfig = {
  parserKey: "bnuzh/bsdwlsjxyssyjsbyz",
  targets: sectionTargets.map((target) => ({
    requestId: target.requestId,
    itemSelector: "li.enter-item a",
    channel: target.channel,
    title: ".name span:first-child",
    url: { attr: "href" },
    summary: ".name .en",
    rawId: { attr: "href" },
  })),
};

export const bsdwlsjxyssyjsbyzParser = createConfiguredHtmlListParser(parserConfig);
