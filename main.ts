// main.ts — hand-in entry point for the Vice Cover Studio make.fun entry.
//
// The app is the app/ folder: plain static files (HTML, CSS, JS, sample
// images) that a desktop browser loads offline, with no build step and no
// network requests.
//
// How to hand it in:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// How to serve it locally for development / screenshots:
//   node serve.ts
//   then open http://localhost:8080 in desktop Chrome.
//
// This script copies app/ and screenshots/ from beside itself into the
// output directory (MAKEFUN_OUTPUT_DIR, default /output), then writes
// dossier.json there using the vendored make.fun helper.

import { cpSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-app.ts";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";

mkdirSync(outDir, { recursive: true });
cpSync(join(here, "app"), join(outDir, "app"), { recursive: true });
cpSync(join(here, "screenshots"), join(outDir, "screenshots"), {
  recursive: true,
});

const dossier = await buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});

writeFileSync(join(outDir, "dossier.json"), dossier);
console.log(`Wrote ${join(outDir, "dossier.json")}`);
