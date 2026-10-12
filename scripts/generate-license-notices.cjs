const fs = require("node:fs");
const path = require("node:path");

const reviewedLicenses = new Set([
  "MIT", "ISC", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "0BSD",
  "MIT-0", "BlueOak-1.0.0", "CC0-1.0", "(MIT OR CC0-1.0)",
]);
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

function collectRuntimePackages(lock) {
  const packages = lock.packages;
  if (!packages?.["apps/web"]) throw new Error("Web workspace is missing from package-lock.json.");
  const pending = ["apps/web"];
  // Workbox is installed through a build tool but its runtime is shipped in the PWA.
  for (const name of Object.keys(packages)) {
    if (/^node_modules\/workbox-/.test(name) && name !== "node_modules/workbox-build" &&
      !name.slice("node_modules/".length).includes("/")) pending.push(name);
  }
  const visited = new Set();
  const external = [];

  function resolveDependency(name, from) {
    let directory = from;
    while (true) {
      const candidate = path.posix.join(directory, "node_modules", name);
      if (packages[candidate]) return candidate;
      if (!directory) break;
      directory = path.posix.dirname(directory);
      if (directory === ".") directory = "";
    }
    throw new Error(`Unresolved runtime dependency ${name} from ${from}.`);
  }

  while (pending.length) {
    const directory = pending.pop();
    if (visited.has(directory)) continue;
    visited.add(directory);
    const entry = packages[directory];
    if (!entry) throw new Error(`Missing lockfile entry: ${directory}`);
    if (entry.link) {
      pending.push(entry.resolved);
      continue;
    }
    const names = new Set(Object.keys(entry.dependencies || {}));
    for (const name of Object.keys(entry.peerDependencies || {})) {
      if (!entry.peerDependenciesMeta?.[name]?.optional) names.add(name);
    }
    for (const name of names) pending.push(resolveDependency(name, directory));
    if (directory.includes("node_modules/")) external.push({ directory, entry });
  }
  // These tools emit client-side helpers/boilerplate, but their Node-only
  // dependency trees are not part of the browser application.
  for (const name of ["vite", "vite-plugin-pwa", "workbox-build"]) {
    const directory = `node_modules/${name}`;
    if (packages[directory] && !visited.has(directory)) external.push({ directory, entry: packages[directory] });
  }
  return external.sort((a, b) => compare(a.directory, b.directory));
}

function createNotices(root) {
  const lock = readJson(path.join(root, "package-lock.json"));
  const packages = collectRuntimePackages(lock);
  const groups = new Map();
  for (const { directory, entry } of packages) {
    const installed = path.join(root, directory);
    const manifest = readJson(path.join(installed, "package.json"));
    if (manifest.version !== entry.version || manifest.license !== entry.license) {
      throw new Error(`Installed ${directory} differs from the lockfile; run npm ci.`);
    }
    if (!reviewedLicenses.has(entry.license)) {
      throw new Error(`Review the runtime license for ${manifest.name}: ${entry.license || "missing"}.`);
    }
    const files = fs.readdirSync(installed).filter((name) =>
      /^(licen[sc]e|copying|notice|third[-_]?party(?:notices?|licen[sc]es?)(?:text)?)(?:[._-].*)?$/i.test(name) &&
      fs.statSync(path.join(installed, name)).isFile(),
    ).sort(compare);
    if (!files.some((name) => /^(licen[sc]e|copying)(?:[._-].*)?$/i.test(name))) {
      throw new Error(`No complete license text found for ${manifest.name}; add and review its notice before publishing.`);
    }
    const texts = files.map((name) => ({ name, text: fs.readFileSync(path.join(installed, name), "utf8").replace(/\r\n/g, "\n").replace(/[ \t]+$/gm, "").trimEnd() }));
    if (texts.some(({ name, text }) => /^(licen[sc]e|copying)(?:[._-].*)?$/i.test(name) && !text.trim())) {
      throw new Error(`Empty license text for ${manifest.name}; review it before publishing.`);
    }
    const key = JSON.stringify({ license: entry.license, texts });
    if (!groups.has(key)) groups.set(key, { license: entry.license, texts, packages: [] });
    groups.get(key).packages.push({ name: manifest.name, version: manifest.version });
  }
  const sections = [...groups.values()].map((group) => {
    group.packages.sort((a, b) => compare(`${a.name}@${a.version}`, `${b.name}@${b.version}`));
    const names = group.packages.map(({ name, version }) => `${name}@${version}`);
    return {
      key: names[0],
      text: [
        "=".repeat(72), ...names, `License identifier: ${group.license}`,
        ...group.packages.map(({ name, version }) => `Package: https://www.npmjs.com/package/${name}/v/${version}`),
        ...group.texts.flatMap(({ name, text }) => ["", `--- ${name} ---`, "", text]),
      ].join("\n"),
    };
  }).sort((a, b) => compare(a.key, b.key));
  return [
    "BNUZ Feed V2 - Third-party software notices", "",
    "Generated from package-lock.json and the installed packages by",
    "scripts/generate-license-notices.cjs. Do not replace third-party licenses",
    "with the MIT license for this project's original software.", "",
    "This file covers external application dependencies, Workbox runtime",
    "packages, and client-side helpers emitted by Vite, vite-plugin-pwa and",
    "workbox-build. It includes runtime modules bundled only for some PWA",
    "options and preserves upstream notices for any bundled dependencies.",
    "Build and test tools themselves are installed separately by npm and are",
    "not vendored here or shipped as complete tools with this website. Their",
    "licenses remain applicable; consult package-lock.json and their packages.", "",
    `${packages.length} third-party runtime packages are covered below.`, "",
    ...sections.map(({ text }) => text), "",
  ].join("\n");
}

function prepareLicenseAssets(root, { check = false } = {}) {
  const notices = createNotices(root);
  const noticePath = path.join(root, "THIRD_PARTY_NOTICES.txt");
  if (check) {
    const existing = fs.existsSync(noticePath) ? fs.readFileSync(noticePath, "utf8").replace(/\r\n/g, "\n") : "";
    if (existing !== notices) throw new Error("THIRD_PARTY_NOTICES.txt is out of date; run npm run licenses:generate and commit it.");
    return notices;
  }
  fs.writeFileSync(noticePath, notices);
  const output = path.join(root, "apps/web/public/legal");
  fs.mkdirSync(output, { recursive: true });
  for (const [source, name] of [["LICENSE", "LICENSE.txt"], ["NOTICE.md", "NOTICE.txt"], ["THIRD_PARTY_NOTICES.txt", "THIRD_PARTY_NOTICES.txt"]]) {
    fs.copyFileSync(path.join(root, source), path.join(output, name));
  }
  return notices;
}

module.exports = { collectRuntimePackages, createNotices, prepareLicenseAssets };
if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    if (args.some((arg) => arg !== "--check")) throw new Error("Usage: node scripts/generate-license-notices.cjs [--check]");
    prepareLicenseAssets(path.resolve(__dirname, ".."), { check: args.includes("--check") });
    console.log(args.includes("--check") ? "Third-party license notices are current." : "Third-party notices and website license files prepared.");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
