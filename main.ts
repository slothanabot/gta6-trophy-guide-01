// Vice City Trophy Ledger — the hand-in program for this entry (Node 22, stdlib only).
// The guide itself is plain static files under app/: index.html, style.css, app.js and
// data/trophies.json, with no build step and nothing fetched over the network.
// This program copies app/ and screenshots/ next to this file into the output
// directory and writes dossier.json there, using the vendored make.fun library
// (vendor/makefun-frontend.ts, left unchanged) so the judge's summary matches
// exactly what the scorer computes from the same files.
//
// Local check:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// In the grader, MAKEFUN_OUTPUT_DIR is unset and /output is used instead.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// Directory holding this program file — the repository root.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
// The grader hands us a writable /output; locally MAKEFUN_OUTPUT_DIR stands in.
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// Caps from the competition gate: at most 4 screenshots of 256 KiB each,
// app/ at most 993 files and 48 MiB, and the judge's text capped at 160 KiB.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
