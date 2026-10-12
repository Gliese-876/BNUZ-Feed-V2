import { type FetchTarget } from "@bnuz-feed/contracts";

export type TargetSpec = {
  requestId: string;
  path: string;
  channel: string;
  itemSelector: string;
};

export const baseUrl = "https://career.bnuzh.edu.cn";

export const targetSpecs: TargetSpec[] = [
  { requestId: "news", path: "index.php/web/Index/news-list", channel: "新闻资讯", itemSelector: ".content-list a[href*='detail']" },
  { requestId: "notice", path: "index.php/web/Index/notice-list", channel: "通知公告", itemSelector: ".content-list a[href*='detail']" },
  { requestId: "jiuyehuodong", path: "index.php/web/Index/employment-list", channel: "就业活动", itemSelector: ".content-list a[href*='detail']" },
  { requestId: "jiuyezhidao", path: "index.php/web/Index/article-list?type=jiuyezhidao", channel: "就业指导", itemSelector: ".content-list a[href*='detail']" },
  { requestId: "jiuyezhengce", path: "index.php/web/Index/policy-list", channel: "就业政策", itemSelector: ".content-list a[href*='detail']" },
  { requestId: "qiuzhixinlu", path: "index.php/web/Index/article-list?type=qiuzhixinlu", channel: "求职心路", itemSelector: ".content-list a[href*='detail']" },
  { requestId: "jianlizhizuo", path: "index.php/web/Index/article-list?type=jianlizhizuo", channel: "简历制作", itemSelector: ".content-list a[href*='detail']" },
  { requestId: "gykc", path: "index.php/web/Index/special-list?type=gykc", channel: "公益课程", itemSelector: ".content-list a[href*='detail']" },
  { requestId: "preach", path: "index.php/web/Index/preach-list", channel: "宣讲会", itemSelector: ".list-media-content a[href*='detail']" },
  { requestId: "jobfair", path: "index.php/web/Index/jobfair-list", channel: "双选会", itemSelector: ".list-media-content a[href*='detail']" },
  { requestId: "jobs-brief", path: "index.php/web/Index/jobs-brief-list", channel: "招聘简讯", itemSelector: ".jobsbrief-lists a[href*='detail']" },
  { requestId: "jobs-brief-gongwuyuan", path: "index.php/web/Index/jobs-brief-list?type=gongwuyuan", channel: "公职就业", itemSelector: ".jobsbrief-lists a[href*='detail']" },
  { requestId: "jobs-brief-jichujiaoyu", path: "index.php/web/Index/jobs-brief-list?type=jichujiaoyu", channel: "基础教育", itemSelector: ".jobsbrief-lists a[href*='detail']" },
  { requestId: "job", path: "index.php/web/Index/job-list", channel: "职位信息", itemSelector: ".jobs-list a[href*='job-detail']" },
];

export const xszyfzyjyzdzxwzFetchTargets: FetchTarget[] = targetSpecs.map((target) => ({
  id: target.requestId,
  url: `${baseUrl}/${target.path}`,
  channel: target.channel,
}));
