import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import puppeteer from "/Users/user/.claude/skills/gstack/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = __dirname;
const RENDER_HTML = "/tmp/gstack-diagram-render-da9c363071afbe79.html";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const diagrams = [
  "system-architecture",
  "erd",
  "use-case",
  "class-diagram",
];

function dataUrlToBuffer(dataUrl) {
  const m = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl);
  if (!m) throw new Error("Expected data URL from rasterize");
  return Buffer.from(m[2], "base64");
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu"],
});

try {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(RENDER_HTML).href, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForFunction(
    () => document.querySelector("#done") || window.__renderMermaid,
    { timeout: 60000 }
  );

  for (const slug of diagrams) {
    const mmdPath = path.join(OUT, `${slug}.mmd`);
    const source = fs.readFileSync(mmdPath, "utf8");
    console.log(`Rendering ${slug}...`);

    const svg = await page.evaluate(async (text, id) => {
      return await window.__renderMermaid(id, text);
    }, source, slug);

    if (typeof svg !== "string" || !svg.includes("<svg")) {
      throw new Error(`${slug}: mermaid render failed: ${String(svg).slice(0, 200)}`);
    }
    fs.writeFileSync(path.join(OUT, `${slug}.svg`), svg);

    const pngDataUrl = await page.evaluate(async (svgText) => {
      return await window.__rasterize(svgText, 1950);
    }, svg);
    fs.writeFileSync(path.join(OUT, `${slug}.png`), dataUrlToBuffer(pngDataUrl));

    // Excalidraw only for flowcharts
    const isFlow = /^\s*flowchart\b|^\s*graph\b/m.test(source);
    if (isFlow) {
      try {
        const scene = await page.evaluate(async (text) => {
          return await window.__mermaidToExcalidraw(text);
        }, source);
        fs.writeFileSync(path.join(OUT, `${slug}.excalidraw`), scene);
        console.log(`  OK svg+png+excalidraw`);
      } catch (e) {
        console.log(`  OK svg+png (excalidraw skipped: ${e.message})`);
      }
    } else {
      console.log(`  OK svg+png (no excalidraw for er/class diagrams)`);
    }
  }
} finally {
  await browser.close();
}

console.log("Done.");
