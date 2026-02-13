#!/usr/bin/env node
/**
 * Generate Open Graph preview images for each chapter.
 * Uses satori (HTML → SVG) + resvg-wasm (SVG → PNG).
 *
 * Run: npm run generate-og
 */

import satori from "satori";
import { html as satoriHtml } from "satori-html";
import { Resvg, initWasm } from "@resvg/resvg-wasm";
import { readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// ── Init resvg WASM from local file ────────────────────────────────
const wasmPath = join(
  root,
  "node_modules/@resvg/resvg-wasm/index_bg.wasm"
);
await initWasm(readFile(wasmPath));

// ── Site colors (from :root CSS variables) ──────────────────────────
const BG = "#FAFAF7";
const TEXT = "#1a1a1a";
const TEXT_MUTED = "#6b6b6b";
const ACCENT = "#c23a22";

// ── Fonts ───────────────────────────────────────────────────────────

async function loadLocalFont(file) {
  const buf = await readFile(file);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

async function loadGoogleFont(family, weight) {
  const url =
    `https://fonts.googleapis.com/css2?family=` +
    `${encodeURIComponent(family)}:wght@${weight}`;

  const css = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)",
    },
  }).then((r) => r.text());

  const match = css.match(/url\(([^)]+)\)/);
  if (!match) throw new Error(`Font URL not found for ${family}:${weight}`);

  return fetch(match[1]).then((r) => r.arrayBuffer());
}

async function loadFonts() {
  // Try Google Fonts (Source Serif 4 + Inter), fall back to local DejaVu
  try {
    const [serifBold, serifRegular, sansBold] = await Promise.all([
      loadGoogleFont("Source Serif 4", 700),
      loadGoogleFont("Source Serif 4", 400),
      loadGoogleFont("Inter", 600),
    ]);
    console.log("Using Google Fonts: Source Serif 4, Inter");
    return {
      serif: "Source Serif 4",
      sans: "Inter",
      list: [
        { name: "Source Serif 4", data: serifBold, weight: 700, style: "normal" },
        { name: "Source Serif 4", data: serifRegular, weight: 400, style: "normal" },
        { name: "Inter", data: sansBold, weight: 600, style: "normal" },
      ],
    };
  } catch {
    const dir = "/usr/share/fonts/truetype/dejavu";
    const [serifBold, serifRegular, sansBold] = await Promise.all([
      loadLocalFont(join(dir, "DejaVuSerif-Bold.ttf")),
      loadLocalFont(join(dir, "DejaVuSerif.ttf")),
      loadLocalFont(join(dir, "DejaVuSans-Bold.ttf")),
    ]);
    console.log("Using local fonts: DejaVu Serif, DejaVu Sans");
    return {
      serif: "DejaVu Serif",
      sans: "DejaVu Sans",
      list: [
        { name: "DejaVu Serif", data: serifBold, weight: 700, style: "normal" },
        { name: "DejaVu Serif", data: serifRegular, weight: 400, style: "normal" },
        { name: "DejaVu Sans", data: sansBold, weight: 700, style: "normal" },
      ],
    };
  }
}

// ── Chapter data ────────────────────────────────────────────────────
const chapters = [
  {
    file: "assets/og-chapter1.png",
    num: "Chapter 1 of 3",
    title: "Where Does Money Come From?",
    subtitle: "You work for money. But where does it actually come from?",
  },
  {
    file: "assets/og-chapter2.png",
    num: "Chapter 2 of 3",
    title: "Who Makes The Money?",
    subtitle: "Companies make money. But who actually does the work?",
  },
  {
    file: "assets/og-chapter3.png",
    num: "Chapter 3 of 3",
    title: "Where Does The Money Go?",
    subtitle:
      "If everyone works hard, why does wealth keep concentrating?",
  },
];

// ── Generate ────────────────────────────────────────────────────────
console.log("Loading fonts…");
const { serif: SERIF, sans: SANS, list: fonts } = await loadFonts();

for (const ch of chapters) {
  const markup = satoriHtml`<div
    style="
      display: flex;
      flex-direction: column;
      width: 1200px;
      height: 630px;
      background: ${BG};
    "
  >
    <div
      style="display: flex; width: 100%; height: 4px; background: ${ACCENT};"
    ></div>

    <div style="display: flex; flex: 1; padding: 60px 80px 0;">
      <div
        style="
          display: flex;
          width: 3px;
          background: ${ACCENT};
          margin-right: 32px;
          flex-shrink: 0;
        "
      ></div>

      <div
        style="
          display: flex;
          flex-direction: column;
          justify-content: center;
          flex: 1;
        "
      >
        <div
          style="
            font-family: '${SANS}';
            font-size: 14px;
            font-weight: 600;
            letter-spacing: 0.15em;
            color: ${ACCENT};
            margin-bottom: 20px;
          "
        >
          ${ch.num.toUpperCase()}
        </div>

        <div
          style="
            font-family: '${SERIF}';
            font-size: 56px;
            font-weight: 700;
            color: ${TEXT};
            line-height: 1.15;
            letter-spacing: -0.02em;
            margin-bottom: 20px;
          "
        >
          ${ch.title}
        </div>

        <div
          style="
            font-family: '${SERIF}';
            font-size: 22px;
            font-weight: 400;
            color: ${TEXT_MUTED};
          "
        >
          ${ch.subtitle}
        </div>
      </div>
    </div>

    <div
      style="
        display: flex;
        align-items: center;
        padding: 0 80px 0 115px;
        height: 50px;
      "
    >
      <div
        style="
          font-family: '${SANS}';
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.1em;
          color: #999;
        "
      >
        CAPITAL
      </div>
    </div>

    <div
      style="display: flex; width: 100%; height: 4px; background: ${ACCENT};"
    ></div>
  </div>`;

  const svg = await satori(markup, {
    width: 1200,
    height: 630,
    fonts,
  });

  const png = new Resvg(svg).render().asPng();
  await writeFile(join(root, ch.file), png);
  console.log(`Created ${ch.file}`);
}

console.log("Done.");
