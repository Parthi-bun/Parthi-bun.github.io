// Inlines src/ into one self-contained page.
// docs/ is what GitHub Pages serves: index.html, 404.html and the images.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, copyFileSync } from "node:fs";

const css = readFileSync("src/styles.css", "utf8");
const updated = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
const body = readFileSync("src/index.html", "utf8").replace("{{UPDATED}}", updated);
const js = readdirSync("src/js").filter((f) => f.endsWith(".js")).sort()
  .map((f) => readFileSync(`src/js/${f}`, "utf8")).join("\n");

const title = "Parthiban Ilango";
const url = "https://parthi-bun.github.io/";
const description = "Final-year computer science student at VIT Vellore, graduating in May 2027. Distributed systems, secure retrieval and a production mobile app, each with a working model you can try.";
const fonts = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@100..700&family=Pixelify+Sans:wght@400..700&display=swap">`;
const favicon = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#08080a"/><path d="M6 26 16 6l10 20z" fill="none" stroke="#ededef" stroke-width="2"/><path d="M16 6v20H6z" fill="#8fbcf2"/></svg>')}`;
const person = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Person",
  name: title,
  url,
  sameAs: ["https://github.com/Parthi-bun"],
  alumniOf: { "@type": "CollegeOrUniversity", name: "Vellore Institute of Technology" },
  knowsAbout: ["Distributed systems", "Information retrieval", "Backend engineering", "Concurrency"],
});
const head = `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#08080a">
<link rel="icon" href="${favicon}">
${fonts}`;
const page = `<style>\n${css}</style>\n${body}\n<script>\n(() => {\n"use strict";\n${js}\n})();\n</script>\n`;

mkdirSync("docs/img", { recursive: true });
for (const f of readdirSync("src/img")) copyFileSync(`src/img/${f}`, `docs/img/${f}`);
writeFileSync("docs/.nojekyll", "");
writeFileSync("docs/index.html", `<!doctype html>
<html lang="en">
<head>
${head}
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${url}img/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${person}</script>
</head>
<body>
${page}</body>
</html>
`);
writeFileSync("docs/404.html", `<!doctype html>
<html lang="en">
<head>
${head}
<title>Page not found</title>
<style>
body { margin: 0; min-height: 100vh; display: grid; place-content: center; gap: 14px; padding: 24px; background: #08080a; color: #ededef; font: 16px/1.6 "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif; }
h1 { margin: 0; font-size: 34px; font-weight: 600; letter-spacing: -0.02em; }
p { margin: 0; color: #adadb6; max-width: 30em; }
a { color: #ededef; text-underline-offset: 4px; }
</style>
</head>
<body>
<h1>That page doesn't exist.</h1>
<p>This site is a single page, so the link you followed is probably out of date. <a href="/">Go to the home page</a>.</p>
</body>
</html>
`);
console.log(`Built ${(js.length / 1024).toFixed(0)} KB of JS and ${(css.length / 1024).toFixed(0)} KB of CSS`);
