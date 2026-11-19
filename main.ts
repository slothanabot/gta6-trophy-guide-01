// Vice City Trophy Ledger — the hand-in program for make.fun gta6-trophy-guide-01.
//
// Node 22, standard library only. The guide itself is the static app/ folder
// beside this file: plain HTML, CSS and an ES module, with its trophy data in
// app/data/trophies.json. A browser opens app/index.html offline — nothing is
// fetched over the network, and nothing is built.
//
// This program hands the guide in. It copies app/ and screenshots/ from this
// repository into the output directory and writes output/dossier.json with the
// kit's vendored library (vendor/makefun-frontend.ts), which the scorer
// requires to be byte for byte its own copy — leave that vendor file alone.
//
// Run it outside the grader with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the app locally with `node serve.ts`, then open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's caps (reference/gate.json): only text_max_bytes shapes the
// dossier's bytes; the rest refuse an entry the scorer would refuse — more
// than 4 screenshots or one over 256 KiB, more than 993 files and
// directories in app/ or 48 MiB of app files (app/ counts beside /output's
// own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
