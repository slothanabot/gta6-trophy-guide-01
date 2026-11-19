// Vice City Trophy Ledger — a gta6-trophy-guide-01 entry (Node 22, standard library only).
// The guide itself is the static site in app/: app/index.html plus its stylesheet and script, with the
// 55-trophy data in app/data/trophies.json. It runs entirely offline — system fonts, no fetched assets,
// no build step — and keeps the reader's progress in the browser's localStorage, with export/import.
//
// This file is the hand-in: it copies app/ and screenshots/ from beside this file into the output
// directory and writes dossier.json there, using the vendored make.fun library. The dossier is the
// summary the judge reads (the screenshots, the first load's files and bytes, and the source), so the
// vendored file stays untouched — the scorer requires dossier.json to be byte for byte what its own
// copy of the library writes.
//
// The caps below are the scorer's own (reference/gate.json): only text_max_bytes shapes the bytes;
// the others refuse an entry the scorer would refuse (more than 4 screenshots or one over 256 KiB;
// more than 993 files and directories in app/, or 48 MiB of app files).
//
// Run it locally with MAKEFUN_OUTPUT_DIR standing in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Then serve the result with `node serve.ts` and open http://localhost:8080.

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

const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(out, 'dossier.json'), dossier);
console.log(`Wrote ${join(out, 'dossier.json')} (${dossier.length} bytes).`);
