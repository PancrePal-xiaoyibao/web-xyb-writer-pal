import fs from "fs";
import path from "path";
import { DEFAULT_FOOTER } from "./footer";

export type TemplateFamily = "template1" | "template2" | "template3";
export type ColorStyle = "morandi_purple" | "morandi_green" | "raw_original";

export interface ColorMeta {
  main: string;
  accent: string;
  bg: string;
}

// Color metadata ported from the original Python skill (COLOR_META)
const COLOR_META: Record<string, Record<string, ColorMeta>> = {
  template1: {
    morandi_purple: { main: "#5c4a7a", accent: "#7a5080", bg: "#f3f0f8" },
    morandi_green: { main: "#4a6a5a", accent: "#6a8a7a", bg: "#f0f5f2" },
  },
  template2: {
    morandi_purple: { main: "#5c4a7a", accent: "#7a5080", bg: "#f3f0f8" },
    morandi_green: { main: "#4a6a5a", accent: "#6a8a7a", bg: "#f0f5f2" },
  },
  template3: {
    raw_original: { main: "#5c4a7a", accent: "#7a5080", bg: "#f3f0f8" },
  },
};

const TEMPLATE_FILES: Record<string, string> = {
  "template1:morandi_purple": "template1_morandi_purple.html",
  "template1:morandi_green": "template1_morandi_green.html",
  "template2:morandi_purple": "template2_morandi_purple.html",
  "template2:morandi_green": "template2_morandi_green.html",
  "template3:raw_original": "template3_raw_original.html",
};

const TEMPLATES_DIR = path.join(process.cwd(), "src", "lib", "converter", "templates");

/**
 * Normalize the (family, style) pair. template3 forces raw_original.
 */
export function normalizeChoice(
  family: TemplateFamily,
  style: ColorStyle
): { family: TemplateFamily; style: ColorStyle } {
  if (family === "template3") {
    return { family, style: "raw_original" };
  }
  // template1/template2 only support purple/green; default to purple
  if (style !== "morandi_purple" && style !== "morandi_green") {
    return { family, style: "morandi_purple" };
  }
  return { family, style };
}

export function getColorMeta(family: TemplateFamily, style: ColorStyle): ColorMeta {
  return COLOR_META[family]?.[style] ?? COLOR_META.template1.morandi_purple;
}

/**
 * Load the raw template HTML for the given family/style.
 */
export function loadTemplate(family: TemplateFamily, style: ColorStyle): string {
  const key = `${family}:${style}`;
  const filename = TEMPLATE_FILES[key];
  if (!filename) {
    throw new Error(`unsupported template choice: ${family}/${style}`);
  }
  return fs.readFileSync(path.join(TEMPLATES_DIR, filename), "utf-8");
}

/**
 * Apply color variables and footer to a template string.
 */
export function applyColorsAndFooter(html: string, meta: ColorMeta): string {
  return html
    .replace(/__MAIN__/g, meta.main)
    .replace(/__ACCENT__/g, meta.accent)
    .replace(/__BG__/g, meta.bg)
    .replace(/__XYB_FOOTER__/g, DEFAULT_FOOTER.replace(/__MAIN__/g, meta.main));
}
