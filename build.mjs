// Inlines src/ into one self-contained page.
// docs/index.html is the full document GitHub Pages serves.
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";

const css = readFileSync("src/styles.css", "utf8");
const body = readFileSync("src/index.html", "utf8");
const js = readdirSync("src/js").filter((f) => f.endsWith(".js")).sort()
  .map((f) => readFileSync(`src/js/${f}`, "utf8")).join("\n");

const title = "Parthiban Ilango";
const url = "https://parthi-bun.github.io/";
const description = "Software engineer and computer science student graduating in May 2027. Distributed systems, secure retrieval and production mobile apps, with a working model of every project.";
const fonts = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@400;500&display=swap">`;
const favicon = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#08080a"/><path d="M6 26 16 6l10 20z" fill="none" stroke="#ededef" stroke-width="2"/><path d="M16 6v20H6z" fill="#ffb224"/></svg>')}`;
const page = `<style>\n${css}</style>\n${body}\n<script>\n(() => {\n"use strict";\n${js}\n})();\n</script>\n`;

mkdirSync("docs", { recursive: true });
writeFileSync("docs/.nojekyll", "");
writeFileSync("docs/index.html", `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${description}">
<meta name="theme-color" content="#08080a">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<link rel="icon" href="${favicon}">
${fonts}
</head>
<body>
${page}</body>
</html>
`);
console.log(`Built ${(js.length / 1024).toFixed(0)} KB of JS and ${(css.length / 1024).toFixed(0)} KB of CSS`);
