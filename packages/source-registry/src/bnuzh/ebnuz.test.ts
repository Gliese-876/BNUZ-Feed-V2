// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { ebnuzFetchTargets, ebnuzParser } from "./ebnuz";

function createPage(
  overrides: Partial<RawPage> & Pick<RawPage, "requestId" | "requestUrl" | "finalUrl" | "bodyText">,
): RawPage {
  return {
    sourceId: "1bd3af39c2cf4c2bbe07a1c2bc12e76b",
    fetchedAt: "2026-03-22T00:00:00.000Z",
    ...overrides,
  };
}

describe("ebnuz", () => {
  it("declares the confirmed public message sources", () => {
    expect(ebnuzFetchTargets).toEqual([
      { id: "news", url: "https://english.bnuzh.edu.cn/News/index.htm", channel: "News" },
      { id: "news/index1", url: "https://english.bnuzh.edu.cn/News/index1.htm", channel: "News" },
      { id: "news/index2", url: "https://english.bnuzh.edu.cn/News/index2.htm", channel: "News" },
      { id: "news/index3", url: "https://english.bnuzh.edu.cn/News/index3.htm", channel: "News" },
      { id: "news/index4", url: "https://english.bnuzh.edu.cn/News/index4.htm", channel: "News" },
      { id: "events", url: "https://english.bnuzh.edu.cn/News/Events/index.htm", channel: "Events" },
      { id: "events/index1", url: "https://english.bnuzh.edu.cn/News/Events/index1.htm", channel: "Events" },
      {
        id: "bnuinhenews",
        url: "https://english.bnuzh.edu.cn/News/BNUinheNews/index.htm",
        channel: "BNU in the News",
      },
      {
        id: "bnuinhenews/index1",
        url: "https://english.bnuzh.edu.cn/News/BNUinheNews/index1.htm",
        channel: "BNU in the News",
      },
      {
        id: "newsletters",
        url: "https://english.bnuzh.edu.cn/News/Newsletters/index.htm",
        channel: "Newsletters",
      },
      { id: "admissions", url: "https://english.bnuzh.edu.cn/Admissions/index.htm", channel: "Admissions" },
      { id: "campus", url: "https://english.bnuzh.edu.cn/Campus/index.htm", channel: "Student Life" },
      { id: "campuslife", url: "https://english.bnuzh.edu.cn/CampusLife/index.htm", channel: "Campus Life" },
      { id: "pictures", url: "https://english.bnuzh.edu.cn/CampusLife/Pictures/index.htm", channel: "Pictures" },
      {
        id: "pictures/index1",
        url: "https://english.bnuzh.edu.cn/CampusLife/Pictures/index1.htm",
        channel: "Pictures",
      },
      { id: "articles", url: "https://english.bnuzh.edu.cn/CampusLife/Articles/index.htm", channel: "Articles" },
      { id: "videos", url: "https://english.bnuzh.edu.cn/CampusLife/Videos/index.htm", channel: "Videos" },
      { id: "joinus", url: "https://english.bnuzh.edu.cn/JoinUs/index.htm", channel: "Join Us" },
      { id: "students", url: "https://english.bnuzh.edu.cn/Students/index.htm", channel: "Students" },
    ]);
  });

  it("parses the news list while ignoring navigation duplicates", async () => {
    const page = createPage({
      requestId: "news",
      requestUrl: "https://english.bnuzh.edu.cn/News/index.htm",
      finalUrl: "https://english.bnuzh.edu.cn/News/index.htm",
      bodyText: `
        <body>
          <ul class="nav">
            <li><a href="../About/index.htm">About</a></li>
            <li><a href="../News/index.htm">News &amp; Events</a></li>
          </ul>
          <ul class="featured">
            <li>
              <a href="74b609dcb39c411891b3650690f7e1aa.htm">
                <div class="title fs18">The 2nd BNU Zhuhai International Cultural Festival Featured Event</div>
                <div class="time fs16">DEC 05 , 2025</div>
              </a>
            </li>
            <li>
              <a href="2a5cbd804624425d9d883788c2799e82.htm">
                <div class="title fs18">Lang Ping Honored with IOC Coaches Lifetime Achievement Award</div>
                <div class="time fs16">DEC 02 , 2025</div>
              </a>
            </li>
            <li>
              <a href="aa72dc6b749d453c89661aa4313f3b5b.htm">
                <div class="title fs18">The 2nd BNU Zhuhai International Cultural Festival Grandly Opens</div>
                <div class="time fs16">NOV 30 , 2025</div>
              </a>
            </li>
          </ul>
          <ul class="text-list">
            <li>
              <a href="74b609dcb39c411891b3650690f7e1aa.htm">
                <div class="title fs18">The 2nd BNU Zhuhai International Cultural Festival Featured Event</div>
                <div class="time fs16">DEC 05 , 2025</div>
              </a>
            </li>
            <li>
              <a href="2a5cbd804624425d9d883788c2799e82.htm">
                <div class="title fs18">Lang Ping Honored with IOC Coaches Lifetime Achievement Award</div>
                <div class="time fs16">DEC 02 , 2025</div>
              </a>
            </li>
          </ul>
        </body>
      `,
    });

    const records = await ebnuzParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "1bd3af39c2cf4c2bbe07a1c2bc12e76b",
        rawId: "74b609dcb39c411891b3650690f7e1aa.htm",
        rawTitle: "The 2nd BNU Zhuhai International Cultural Festival Featured Event",
        rawUrl: "https://english.bnuzh.edu.cn/News/74b609dcb39c411891b3650690f7e1aa.htm",
        rawPublishedAt: "2025-12-05",
        rawChannel: "News",
        rawSummary: undefined,
        extras: {
          requestId: "news",
        },
      },
      {
        sourceId: "1bd3af39c2cf4c2bbe07a1c2bc12e76b",
        rawId: "2a5cbd804624425d9d883788c2799e82.htm",
        rawTitle: "Lang Ping Honored with IOC Coaches Lifetime Achievement Award",
        rawUrl: "https://english.bnuzh.edu.cn/News/2a5cbd804624425d9d883788c2799e82.htm",
        rawPublishedAt: "2025-12-02",
        rawChannel: "News",
        rawSummary: undefined,
        extras: {
          requestId: "news",
        },
      },
      {
        sourceId: "1bd3af39c2cf4c2bbe07a1c2bc12e76b",
        rawId: "aa72dc6b749d453c89661aa4313f3b5b.htm",
        rawTitle: "The 2nd BNU Zhuhai International Cultural Festival Grandly Opens",
        rawUrl: "https://english.bnuzh.edu.cn/News/aa72dc6b749d453c89661aa4313f3b5b.htm",
        rawPublishedAt: "2025-11-30",
        rawChannel: "News",
        rawSummary: undefined,
        extras: {
          requestId: "news",
        },
      },
    ]);
  });

  it("keeps external links for BNU in the News and normalizes month tokens", async () => {
    const page = createPage({
      requestId: "bnuinhenews",
      requestUrl: "https://english.bnuzh.edu.cn/News/BNUinheNews/index.htm",
      finalUrl: "https://english.bnuzh.edu.cn/News/BNUinheNews/index.htm",
      bodyText: `
        <body>
          <ul>
            <li>
              <a href="https://www.globaltimes.cn/page/202511/1349117.shtml">
                <div class="title fs18">【Global Times】Chinese localities to sharpen focus on high-tech over next 5 years</div>
                <div class="time fs16">NOV 28 , 2025</div>
              </a>
            </li>
            <li>
              <a href="https://www.chinadaily.com.cn/a/202511/20/WS691ec7d9a310d6866eb2a886.html">
                <div class="title fs18">【CHINA DAILY】New partnership to bring Dunhuang heritage into classrooms</div>
                <div class="time fs16">Nov. 21 , 2025</div>
              </a>
            </li>
          </ul>
        </body>
      `,
    });

    const records = await ebnuzParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "1bd3af39c2cf4c2bbe07a1c2bc12e76b",
        rawId: "https://www.globaltimes.cn/page/202511/1349117.shtml",
        rawTitle: "【Global Times】Chinese localities to sharpen focus on high-tech over next 5 years",
        rawUrl: "https://www.globaltimes.cn/page/202511/1349117.shtml",
        rawPublishedAt: "2025-11-28",
        rawChannel: "BNU in the News",
        rawSummary: undefined,
        extras: {
          requestId: "bnuinhenews",
        },
      },
      {
        sourceId: "1bd3af39c2cf4c2bbe07a1c2bc12e76b",
        rawId: "https://www.chinadaily.com.cn/a/202511/20/WS691ec7d9a310d6866eb2a886.html",
        rawTitle: "【CHINA DAILY】New partnership to bring Dunhuang heritage into classrooms",
        rawUrl: "https://www.chinadaily.com.cn/a/202511/20/WS691ec7d9a310d6866eb2a886.html",
        rawPublishedAt: "2025-11-21",
        rawChannel: "BNU in the News",
        rawSummary: undefined,
        extras: {
          requestId: "bnuinhenews",
        },
      },
    ]);
  });

  it("parses PDF newsletter entries", async () => {
    const page = createPage({
      requestId: "newsletters",
      requestUrl: "https://english.bnuzh.edu.cn/News/Newsletters/index.htm",
      finalUrl: "https://english.bnuzh.edu.cn/News/Newsletters/index.htm",
      bodyText: `
        <body>
          <ul>
            <li>
              <a href="../../docs/2026-02/f0808164701f4d429b7258acc3a27e1f.pdf">
                <div class="img"><img src="../../images/2026-02/6e80c49a240e41a7b942e23af3841c22.png"></div>
                <div class="title fs18">BNU Zhuhai Newsletter Issue 14 Officially Published</div>
                <div class="time fs16">Feb. 13 , 2026</div>
              </a>
            </li>
            <li>
              <a href="../../docs/2025-09/11db0423c5c34917b542afdf4e67de6f.pdf">
                <div class="img"><img src="../../images/2025-09/2fe37795302245bbb27f2dfe712e2830.png"></div>
                <div class="title fs18">BNU Zhuhai Newsletter Issue 13 Officially Published</div>
                <div class="time fs16">Sep. 08 , 2025</div>
              </a>
            </li>
          </ul>
        </body>
      `,
    });

    const records = await ebnuzParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "1bd3af39c2cf4c2bbe07a1c2bc12e76b",
        rawId: "../../docs/2026-02/f0808164701f4d429b7258acc3a27e1f.pdf",
        rawTitle: "BNU Zhuhai Newsletter Issue 14 Officially Published",
        rawUrl: "https://english.bnuzh.edu.cn/docs/2026-02/f0808164701f4d429b7258acc3a27e1f.pdf",
        rawPublishedAt: "2026-02-13",
        rawChannel: "Newsletters",
        rawSummary: undefined,
        extras: {
          requestId: "newsletters",
        },
      },
      {
        sourceId: "1bd3af39c2cf4c2bbe07a1c2bc12e76b",
        rawId: "../../docs/2025-09/11db0423c5c34917b542afdf4e67de6f.pdf",
        rawTitle: "BNU Zhuhai Newsletter Issue 13 Officially Published",
        rawUrl: "https://english.bnuzh.edu.cn/docs/2025-09/11db0423c5c34917b542afdf4e67de6f.pdf",
        rawPublishedAt: "2025-09-08",
        rawChannel: "Newsletters",
        rawSummary: undefined,
        extras: {
          requestId: "newsletters",
        },
      },
    ]);
  });

  it("parses the student card layout", async () => {
    const page = createPage({
      requestId: "students",
      requestUrl: "https://english.bnuzh.edu.cn/Students/index.htm",
      finalUrl: "https://english.bnuzh.edu.cn/Students/index.htm",
      bodyText: `
        <body>
          <ul class="nav">
            <li><a href="../About/index.htm">About</a></li>
          </ul>
          <ul>
            <li>
              <a href="65cdec06100d48dcb3016ad7da02aef1.htm">
                <div class="top_box">
                  <div class="img"><img src="../images/2024-12/8f225f78ff264803b5c8a627465eef9b.png"></div>
                </div>
                <div class="bottom_box">
                  <div class="title fs18">Celebrating the Success of 2024’s Outstanding International Graduates at Beijing Normal University -- Romana Akhter</div>
                  <div class="time fs16">DEC 30 , 2024</div>
                </div>
              </a>
            </li>
            <li>
              <a href="e53c8a41869f412ab274a3ca8fc376d5.htm">
                <div class="top_box">
                  <div class="img"><img src="../images/2025-03/e16a835a8f4a496da6580c871f4bde24.png"></div>
                </div>
                <div class="bottom_box">
                  <div class="title fs18">Celebrating the Success of 2024’s Outstanding International Graduates at Beijing Normal University --Lenox Emmanuel: A Journey of Leadership, Sports, and Public Service at BNU</div>
                  <div class="time fs16">MAR 10 , 2025</div>
                </div>
              </a>
            </li>
          </ul>
        </body>
      `,
    });

    const records = await ebnuzParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "1bd3af39c2cf4c2bbe07a1c2bc12e76b",
        rawId: "65cdec06100d48dcb3016ad7da02aef1.htm",
        rawTitle: "Celebrating the Success of 2024’s Outstanding International Graduates at Beijing Normal University -- Romana Akhter",
        rawUrl: "https://english.bnuzh.edu.cn/Students/65cdec06100d48dcb3016ad7da02aef1.htm",
        rawPublishedAt: "2024-12-30",
        rawChannel: "Students",
        rawSummary: undefined,
        extras: {
          requestId: "students",
        },
      },
      {
        sourceId: "1bd3af39c2cf4c2bbe07a1c2bc12e76b",
        rawId: "e53c8a41869f412ab274a3ca8fc376d5.htm",
        rawTitle: "Celebrating the Success of 2024’s Outstanding International Graduates at Beijing Normal University --Lenox Emmanuel: A Journey of Leadership, Sports, and Public Service at BNU",
        rawUrl: "https://english.bnuzh.edu.cn/Students/e53c8a41869f412ab274a3ca8fc376d5.htm",
        rawPublishedAt: "2025-03-10",
        rawChannel: "Students",
        rawSummary: undefined,
        extras: {
          requestId: "students",
        },
      },
    ]);
  });

  it("parses admissions, campus, campus life, and join us entries", async () => {
    const admissionsPage = createPage({
      requestId: "admissions",
      requestUrl: "https://english.bnuzh.edu.cn/Admissions/index.htm",
      finalUrl: "https://english.bnuzh.edu.cn/Admissions/index.htm",
      bodyText: `
        <body>
          <ul>
            <li>
              <a href="../docs/2021-07/926057d8c5a94ca9ae6fb9e12c857133.pdf">
                <div class="title fs18">2020 INTERNATIONAL STUDENT HANDBOOK</div>
                <div class="time fs16">Jul. 19 , 2021</div>
              </a>
            </li>
            <li>
              <a href="../docs/2021-07/cf5e32d9fa8f429da769a0c3d8d34a26.pdf">
                <div class="title fs18">MBA / MPA Guide 2021</div>
                <div class="time fs16">Jul. 19 , 2021</div>
              </a>
            </li>
          </ul>
        </body>
      `,
    });

    const campusPage = createPage({
      requestId: "campus",
      requestUrl: "https://english.bnuzh.edu.cn/Campus/index.htm",
      finalUrl: "https://english.bnuzh.edu.cn/Campus/index.htm",
      bodyText: `
        <body>
          <ul>
            <li>
              <a href="../docs/2025-07/1c25b2bbd026445895fb6bc85b6798f0.pdf">
                <div class="title fs18">2025 International Student Handbook</div>
                <div class="time fs16">Jul. 14 , 2025</div>
              </a>
            </li>
            <li>
              <a href="../docs/2022-07/2264fd44c6224efabd6e8ab06df204e1.pdf">
                <div class="title fs18">School Calendar for 2022-2023, BNU Zhuhai</div>
                <div class="time fs16">Jul. 07 , 2022</div>
              </a>
            </li>
          </ul>
        </body>
      `,
    });

    const campusLifePage = createPage({
      requestId: "campuslife",
      requestUrl: "https://english.bnuzh.edu.cn/CampusLife/index.htm",
      finalUrl: "https://english.bnuzh.edu.cn/CampusLife/index.htm",
      bodyText: `
        <body>
          <aside>
            <ul>
              <li><a href="Pictures/index.htm">Pictures</a></li>
              <li><a href="Articles/index.htm">Articles</a></li>
              <li><a href="Videos/index.htm">Videos</a></li>
            </ul>
          </aside>
          <ul>
            <li>
              <a href="Videos/a92fabd454f34c2e8f8febdd4ae9352e.htm">
                <div class="title fs18">Welcome to BNU Zhuhai</div>
                <div class="time fs16">JUL 19 , 2021</div>
              </a>
            </li>
            <li>
              <a href="Articles/cb73b889b92b4851b68598bffff9dcdc.htm">
                <div class="title fs18">All you need is these four books to read through BNU Zhuhai</div>
                <div class="time fs16">MAR 24 , 2021</div>
              </a>
            </li>
          </ul>
        </body>
      `,
    });

    const joinUsPage = createPage({
      requestId: "joinus",
      requestUrl: "https://english.bnuzh.edu.cn/JoinUs/index.htm",
      finalUrl: "https://english.bnuzh.edu.cn/JoinUs/index.htm",
      bodyText: `
        <body>
          <ul>
            <li>
              <a href="cc6b6581ea1540d6818a43d4173cb5fd.htm">
                <div class="title fs18">The Faculty of Arts and Sciences of Beijing Normal University sincerely invites you to join us</div>
                <div class="time fs16">Jul. 12 , 2024</div>
              </a>
            </li>
            <li>
              <a href="../docs/2023-09/93c73c39172e49e4b9018923ed452bad.pdf">
                <div class="title fs18">Guidebook for International Scholars to BNU Zhuhai</div>
                <div class="time fs16">Sep. 28 , 2023</div>
              </a>
            </li>
          </ul>
        </body>
      `,
    });

    await expect(ebnuzParser.parse(admissionsPage)).resolves.toEqual([
      {
        sourceId: "1bd3af39c2cf4c2bbe07a1c2bc12e76b",
        rawId: "../docs/2021-07/926057d8c5a94ca9ae6fb9e12c857133.pdf",
        rawTitle: "2020 INTERNATIONAL STUDENT HANDBOOK",
        rawUrl: "https://english.bnuzh.edu.cn/docs/2021-07/926057d8c5a94ca9ae6fb9e12c857133.pdf",
        rawPublishedAt: "2021-07-19",
        rawChannel: "Admissions",
        rawSummary: undefined,
        extras: { requestId: "admissions" },
      },
      {
        sourceId: "1bd3af39c2cf4c2bbe07a1c2bc12e76b",
        rawId: "../docs/2021-07/cf5e32d9fa8f429da769a0c3d8d34a26.pdf",
        rawTitle: "MBA / MPA Guide 2021",
        rawUrl: "https://english.bnuzh.edu.cn/docs/2021-07/cf5e32d9fa8f429da769a0c3d8d34a26.pdf",
        rawPublishedAt: "2021-07-19",
        rawChannel: "Admissions",
        rawSummary: undefined,
        extras: { requestId: "admissions" },
      },
    ]);

    await expect(ebnuzParser.parse(campusPage)).resolves.toEqual([
      {
        sourceId: "1bd3af39c2cf4c2bbe07a1c2bc12e76b",
        rawId: "../docs/2025-07/1c25b2bbd026445895fb6bc85b6798f0.pdf",
        rawTitle: "2025 International Student Handbook",
        rawUrl: "https://english.bnuzh.edu.cn/docs/2025-07/1c25b2bbd026445895fb6bc85b6798f0.pdf",
        rawPublishedAt: "2025-07-14",
        rawChannel: "Student Life",
        rawSummary: undefined,
        extras: { requestId: "campus" },
      },
      {
        sourceId: "1bd3af39c2cf4c2bbe07a1c2bc12e76b",
        rawId: "../docs/2022-07/2264fd44c6224efabd6e8ab06df204e1.pdf",
        rawTitle: "School Calendar for 2022-2023, BNU Zhuhai",
        rawUrl: "https://english.bnuzh.edu.cn/docs/2022-07/2264fd44c6224efabd6e8ab06df204e1.pdf",
        rawPublishedAt: "2022-07-07",
        rawChannel: "Student Life",
        rawSummary: undefined,
        extras: { requestId: "campus" },
      },
    ]);

    await expect(ebnuzParser.parse(campusLifePage)).resolves.toEqual([
      {
        sourceId: "1bd3af39c2cf4c2bbe07a1c2bc12e76b",
        rawId: "Videos/a92fabd454f34c2e8f8febdd4ae9352e.htm",
        rawTitle: "Welcome to BNU Zhuhai",
        rawUrl: "https://english.bnuzh.edu.cn/CampusLife/Videos/a92fabd454f34c2e8f8febdd4ae9352e.htm",
        rawPublishedAt: "2021-07-19",
        rawChannel: "Campus Life",
        rawSummary: undefined,
        extras: { requestId: "campuslife" },
      },
      {
        sourceId: "1bd3af39c2cf4c2bbe07a1c2bc12e76b",
        rawId: "Articles/cb73b889b92b4851b68598bffff9dcdc.htm",
        rawTitle: "All you need is these four books to read through BNU Zhuhai",
        rawUrl: "https://english.bnuzh.edu.cn/CampusLife/Articles/cb73b889b92b4851b68598bffff9dcdc.htm",
        rawPublishedAt: "2021-03-24",
        rawChannel: "Campus Life",
        rawSummary: undefined,
        extras: { requestId: "campuslife" },
      },
    ]);

    await expect(ebnuzParser.parse(joinUsPage)).resolves.toEqual([
      {
        sourceId: "1bd3af39c2cf4c2bbe07a1c2bc12e76b",
        rawId: "cc6b6581ea1540d6818a43d4173cb5fd.htm",
        rawTitle: "The Faculty of Arts and Sciences of Beijing Normal University sincerely invites you to join us",
        rawUrl: "https://english.bnuzh.edu.cn/JoinUs/cc6b6581ea1540d6818a43d4173cb5fd.htm",
        rawPublishedAt: "2024-07-12",
        rawChannel: "Join Us",
        rawSummary: undefined,
        extras: { requestId: "joinus" },
      },
      {
        sourceId: "1bd3af39c2cf4c2bbe07a1c2bc12e76b",
        rawId: "../docs/2023-09/93c73c39172e49e4b9018923ed452bad.pdf",
        rawTitle: "Guidebook for International Scholars to BNU Zhuhai",
        rawUrl: "https://english.bnuzh.edu.cn/docs/2023-09/93c73c39172e49e4b9018923ed452bad.pdf",
        rawPublishedAt: "2023-09-28",
        rawChannel: "Join Us",
        rawSummary: undefined,
        extras: { requestId: "joinus" },
      },
    ]);
  });
});
