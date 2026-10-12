import { type FetchTarget } from "@bnuz-feed/contracts";

export type TargetSpec = {
  requestId: string;
  url: string;
  channel: string;
};

export const baseUrl = "https://easc.bnuzh.edu.cn/";

export const targetSpecs: TargetSpec[] = [
  { requestId: "news", url: baseUrl, channel: "新闻通知" },
  { requestId: "schedule", url: baseUrl, channel: "会议安排" },
];

export const zgjykjxhhyFetchTargets: FetchTarget[] = targetSpecs.map((target) => ({
  id: target.requestId,
  url: target.url,
  channel: target.channel,
}));
