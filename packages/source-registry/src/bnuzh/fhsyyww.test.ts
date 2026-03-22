// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { fhsyywwFetchTargets, fhsyywwParser } from "./fhsyyww";

function createPage(
  overrides: Partial<RawPage> & Pick<RawPage, "requestId" | "requestUrl" | "finalUrl" | "bodyText">,
): RawPage {
  return {
    sourceId: "57c21fb282a442bc936ce7188d98ed82",
    fetchedAt: "2026-03-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("fhsyywwParser", () => {
  it("declares the expected public list targets", () => {
    expect(fhsyywwFetchTargets).toEqual([
      {
        id: "notice",
        url: "https://phs.bnuzh.edu.cn/English/News/Notice/index.htm",
        channel: "Notice",
      },
      {
        id: "schoolnews",
        url: "https://phs.bnuzh.edu.cn/English/News/SchoolNews/index.htm",
        channel: "School News",
      },
      {
        id: "noticesactivities",
        url: "https://phs.bnuzh.edu.cn/English/NoticesandActivities/index.htm",
        channel: "Notices and Activities",
      },
      {
        id: "languagevillage",
        url: "https://phs.bnuzh.edu.cn/English/InternationalEducation/PhoenixLanguageVillage/index.htm",
        channel: "Phoenix Language Village",
      },
      {
        id: "summerschool",
        url: "https://phs.bnuzh.edu.cn/English/InternationalEducation/SummerSchool/index.htm",
        channel: "Summer School",
      },
      {
        id: "phoenixforum",
        url: "https://phs.bnuzh.edu.cn/English/PhoenixAcademicConferences/PhoenixForumofBeijingNormalUniversity/index.htm",
        channel: "Phoenix Forum of Beijing Normal University",
      },
      {
        id: "lectureseries",
        url: "https://phs.bnuzh.edu.cn/English/PhoenixAcademicConferences/PhoenixLectureSeries/index.htm",
        channel: "Phoenix Lecture Series",
      },
      {
        id: "admissions",
        url: "https://phs.bnuzh.edu.cn/English/ProspectiveStudents/index.htm",
        channel: "Admissions",
      },
      {
        id: "classseries",
        url: "https://phs.bnuzh.edu.cn/English/Accommodation/GeneralEducation/index.htm",
        channel: "Phoenix Class Series",
      },
      {
        id: "studentactivities",
        url: "https://phs.bnuzh.edu.cn/English/Accommodation/StudentActivities/index.htm",
        channel: "Student Activities",
      },
      {
        id: "centerdynamics",
        url: "https://phs.bnuzh.edu.cn/English/Centers/GreaterBayAreaCulturalandEducationalCommunicationCenter/DynamicsoftheCenter/index.htm",
        channel: "Dynamics of the Center",
      },
      {
        id: "centeractivities",
        url: "https://phs.bnuzh.edu.cn/English/Centers/GreaterBayAreaCulturalandEducationalCommunicationCenter/GuangdongHongKongMacaoCulturalandEducationalExchangeActivities/index.htm",
        channel: "Guangdong-Hong Kong-Macao Cultural and Educational Exchange Activities",
      },
      {
        id: "projecttraining",
        url: "https://phs.bnuzh.edu.cn/English/Centers/GreaterBayAreaCulturalandEducationalCommunicationCenter/Projecttraining/index.htm",
        channel: "Project and Training",
      },
    ]);
  });

  it("parses simple list pages and ignores unrelated navigation anchors", async () => {
    const page = createPage({
      requestId: "notice",
      requestUrl: "https://phs.bnuzh.edu.cn/English/News/Notice/index.htm",
      finalUrl: "https://phs.bnuzh.edu.cn/English/News/Notice/index.htm",
      bodyText: `
        <body>
          <header>
            <a href="../../index.htm">Home</a>
            <a href="javascript:void(0);">News</a>
          </header>
          <main>
            <ul>
              <li>
                <a href="e6f31042bedd46fb94871b7fe576815c.htm">“The Pearl of Africa-Uganda” Culture Salon Held</a>
                <span>2021.04.27</span>
              </li>
              <li>
                <a href="7b281c2d7d214d5b86e85b9e502323dd.htm">Experiencing China·Dialogues with the Ancients| The Shangsi Festival Celebrated</a>
                <span>2021.04.02</span>
              </li>
            </ul>
          </main>
        </body>
      `,
    });

    const records = await fhsyywwParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "57c21fb282a442bc936ce7188d98ed82",
        rawId: "e6f31042bedd46fb94871b7fe576815c.htm",
        rawTitle: "“The Pearl of Africa-Uganda” Culture Salon Held",
        rawUrl: "https://phs.bnuzh.edu.cn/English/News/Notice/e6f31042bedd46fb94871b7fe576815c.htm",
        rawPublishedAt: "2021-04-27",
        rawChannel: "Notice",
        rawSummary: undefined,
        extras: {
          requestId: "notice",
        },
      },
      {
        sourceId: "57c21fb282a442bc936ce7188d98ed82",
        rawId: "7b281c2d7d214d5b86e85b9e502323dd.htm",
        rawTitle: "Experiencing China·Dialogues with the Ancients| The Shangsi Festival Celebrated",
        rawUrl: "https://phs.bnuzh.edu.cn/English/News/Notice/7b281c2d7d214d5b86e85b9e502323dd.htm",
        rawPublishedAt: "2021-04-02",
        rawChannel: "Notice",
        rawSummary: undefined,
        extras: {
          requestId: "notice",
        },
      },
    ]);
  });

  it("parses card-style lists with summaries and relative links", async () => {
    const page = createPage({
      requestId: "schoolnews",
      requestUrl: "https://phs.bnuzh.edu.cn/English/News/SchoolNews/index.htm",
      finalUrl: "https://phs.bnuzh.edu.cn/English/News/SchoolNews/index.htm",
      bodyText: `
        <body>
          <main>
            <div class="notice">
              <dl>
                <dd>
                  <a href="c9fd8e426a0e4dbe9070dded2f369236.htm">
                    <div class="n_left">
                      <span><img src="../../images/2024-03/example.jpg" alt=""></span>
                    </div>
                    <div class="n_right">
                      <h3 class="gp-f16">The Ninth Annual Conference of Macao Chinese Character Society was successfully held at BNU Zhuhai</h3>
                      <p class="gp-f14">From November 24th to 25th, an academic symposium on Chinese characters and the inheritance and development of Chinese civilization, was held at Beijing Normal University at Zhuhai (BNU Zhuhai).</p>
                      <span class="gp-f14">2023-11-30</span>
                    </div>
                  </a>
                </dd>
                <dd>
                  <a href="../../InternationalEducation/SummerSchool/32e1e2231fa74463905fa1d9f90a13b5.htm">
                    <div class="n_right">
                      <h3 class="gp-f16">Summer International Chinese Language Education and Training Program ｜ Opening Ceremony of the Class of Students from Rangsit University</h3>
                      <p class="gp-f14">On the morning of July 10th, the opening ceremony of the Summer International Chinese Language Education and Training Program was held in Phoenix Space, BNU Zhuhai.</p>
                      <span class="gp-f14">2023-07-13</span>
                    </div>
                  </a>
                </dd>
              </dl>
            </div>
          </main>
        </body>
      `,
    });

    const records = await fhsyywwParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "57c21fb282a442bc936ce7188d98ed82",
        rawId: "c9fd8e426a0e4dbe9070dded2f369236.htm",
        rawTitle: "The Ninth Annual Conference of Macao Chinese Character Society was successfully held at BNU Zhuhai",
        rawUrl: "https://phs.bnuzh.edu.cn/English/News/SchoolNews/c9fd8e426a0e4dbe9070dded2f369236.htm",
        rawPublishedAt: "2023-11-30",
        rawChannel: "School News",
        rawSummary:
          "From November 24th to 25th, an academic symposium on Chinese characters and the inheritance and development of Chinese civilization, was held at Beijing Normal University at Zhuhai (BNU Zhuhai).",
        extras: {
          requestId: "schoolnews",
        },
      },
      {
        sourceId: "57c21fb282a442bc936ce7188d98ed82",
        rawId: "../../InternationalEducation/SummerSchool/32e1e2231fa74463905fa1d9f90a13b5.htm",
        rawTitle: "Summer International Chinese Language Education and Training Program ｜ Opening Ceremony of the Class of Students from Rangsit University",
        rawUrl:
          "https://phs.bnuzh.edu.cn/English/InternationalEducation/SummerSchool/32e1e2231fa74463905fa1d9f90a13b5.htm",
        rawPublishedAt: "2023-07-13",
        rawChannel: "School News",
        rawSummary:
          "On the morning of July 10th, the opening ceremony of the Summer International Chinese Language Education and Training Program was held in Phoenix Space, BNU Zhuhai.",
        extras: {
          requestId: "schoolnews",
        },
      },
    ]);
  });

  it("parses the lecture-series layout with summaries and relative paths", async () => {
    const page = createPage({
      requestId: "lectureseries",
      requestUrl: "https://phs.bnuzh.edu.cn/English/PhoenixAcademicConferences/PhoenixLectureSeries/index.htm",
      finalUrl: "https://phs.bnuzh.edu.cn/English/PhoenixAcademicConferences/PhoenixLectureSeries/index.htm",
      bodyText: `
        <body>
          <main>
            <ul>
              <li>
                <a href="c0ea6b31abe04d169e99a298d9db8d23.htm">
                  <h3 class="gp-f16">Lecture Preview | The 9th Session of the Phoenix Lecture Series</h3>
                  <p class="gp-f14"></p>
                  <span class="gp-f14">2024-11-23</span>
                </a>
              </li>
              <li>
                <a href="../PhoenixForumofBeijingNormalUniversity/f1986e00251c4e69b0e134cea6259c78.htm">
                  <h3 class="gp-f16">Review of Phoenix Lecture VI and Phoenix Forum 2022</h3>
                  <p class="gp-f14">From June 15th to 16th, 2023, Phoenix School held the BNU Phoenix Forum (2022) successfully.</p>
                  <span class="gp-f14">2023-07-04</span>
                </a>
              </li>
            </ul>
          </main>
        </body>
      `,
    });

    const records = await fhsyywwParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "57c21fb282a442bc936ce7188d98ed82",
        rawId: "c0ea6b31abe04d169e99a298d9db8d23.htm",
        rawTitle: "Lecture Preview | The 9th Session of the Phoenix Lecture Series",
        rawUrl:
          "https://phs.bnuzh.edu.cn/English/PhoenixAcademicConferences/PhoenixLectureSeries/c0ea6b31abe04d169e99a298d9db8d23.htm",
        rawPublishedAt: "2024-11-23",
        rawChannel: "Phoenix Lecture Series",
        rawSummary: undefined,
        extras: {
          requestId: "lectureseries",
        },
      },
      {
        sourceId: "57c21fb282a442bc936ce7188d98ed82",
        rawId: "../PhoenixForumofBeijingNormalUniversity/f1986e00251c4e69b0e134cea6259c78.htm",
        rawTitle: "Review of Phoenix Lecture VI and Phoenix Forum 2022",
        rawUrl:
          "https://phs.bnuzh.edu.cn/English/PhoenixAcademicConferences/PhoenixForumofBeijingNormalUniversity/f1986e00251c4e69b0e134cea6259c78.htm",
        rawPublishedAt: "2023-07-04",
        rawChannel: "Phoenix Lecture Series",
        rawSummary:
          "From June 15th to 16th, 2023, Phoenix School held the BNU Phoenix Forum (2022) successfully.",
        extras: {
          requestId: "lectureseries",
        },
      },
    ]);
  });

  it("parses center list pages that use simple li items with dates and summaries", async () => {
    const page = createPage({
      requestId: "projecttraining",
      requestUrl:
        "https://phs.bnuzh.edu.cn/English/Centers/GreaterBayAreaCulturalandEducationalCommunicationCenter/Projecttraining/index.htm",
      finalUrl:
        "https://phs.bnuzh.edu.cn/English/Centers/GreaterBayAreaCulturalandEducationalCommunicationCenter/Projecttraining/index.htm",
      bodyText: `
        <body>
          <main>
            <ul>
              <li>
                <a href="71033013383741b8ab481d822b4a6b3e.htm">
                  <h3>Phoenix School Held a Training Session on Teacher Ethics for Local Schools</h3>
                  <p>Phoenix School organized a themed training session for school administrators and teachers.</p>
                  <span>2022.06.05</span>
                </a>
              </li>
              <li>
                <a href="0bbab2dce9a44756af84fbf92b1625f3.htm">
                  <h3>BNU Held the Opening Ceremony of the First Training Camp</h3>
                  <span>2021.04.17</span>
                </a>
              </li>
            </ul>
          </main>
        </body>
      `,
    });

    const records = await fhsyywwParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "57c21fb282a442bc936ce7188d98ed82",
        rawId: "71033013383741b8ab481d822b4a6b3e.htm",
        rawTitle: "Phoenix School Held a Training Session on Teacher Ethics for Local Schools",
        rawUrl:
          "https://phs.bnuzh.edu.cn/English/Centers/GreaterBayAreaCulturalandEducationalCommunicationCenter/Projecttraining/71033013383741b8ab481d822b4a6b3e.htm",
        rawPublishedAt: "2022-06-05",
        rawChannel: "Project and Training",
        rawSummary: "Phoenix School organized a themed training session for school administrators and teachers.",
        extras: {
          requestId: "projecttraining",
        },
      },
      {
        sourceId: "57c21fb282a442bc936ce7188d98ed82",
        rawId: "0bbab2dce9a44756af84fbf92b1625f3.htm",
        rawTitle: "BNU Held the Opening Ceremony of the First Training Camp",
        rawUrl:
          "https://phs.bnuzh.edu.cn/English/Centers/GreaterBayAreaCulturalandEducationalCommunicationCenter/Projecttraining/0bbab2dce9a44756af84fbf92b1625f3.htm",
        rawPublishedAt: "2021-04-17",
        rawChannel: "Project and Training",
        rawSummary: undefined,
        extras: {
          requestId: "projecttraining",
        },
      },
    ]);
  });
});
