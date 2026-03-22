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
    requestId: "gszj",
    url: `${baseUrl}/gszj/index.htm`,
    channel: "共生之间",
  },
  {
    requestId: "yjzj",
    url: `${baseUrl}/yjzj/index.htm`,
    channel: "语境之间",
  },
  {
    requestId: "jyzj",
    url: `${baseUrl}/jyzj/index.htm`,
    channel: "技艺之间",
  },
  {
    requestId: "gzzj",
    url: `${baseUrl}/gzzj/index.htm`,
    channel: "感知之间",
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
