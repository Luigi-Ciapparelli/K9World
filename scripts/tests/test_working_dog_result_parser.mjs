import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const source = await fs.readFile(path.join(repo, 'supabase/functions/_shared/workingDogResultParser.ts'), 'utf8');
const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'pc-working-dog-parser-'));
try {
  const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText;
  const file = path.join(dir, 'parser.mjs');
  await fs.writeFile(file, compiled);
  const { parseWorkingDogResultRows, findMatchingWorkingDogResult } = await import(pathToFileURL(file).href);
  const html = `<!doctype html><title>2025 FCI Obedience World Championship 2025 - Finale</title><h2>Class 3</h2>
    <table><tr><th>4</th><td><a href="/dogs-details/7848989/Mind-the-Dog-Cattivissimo-Me">Mind the Dog Cattivissimo Me</a></td>
    <td><a href="/user/Valentina-Balli-164835">Valentina Balli</a></td><td>Total</td><td>264,38</td><td>EX</td></tr></table>`;
  const rows = parseWorkingDogResultRows(html, '2025 FCI Obedience World Championship 2025 - Finale');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].placement, 4);
  assert.equal(rows[0].score, 264.38);
  assert.equal(rows[0].qualification, 'EX');
  assert.equal(rows[0].dogName, 'Mind the Dog Cattivissimo Me');
  assert.equal(rows[0].handlerName, 'Valentina Balli');
  assert.equal(rows[0].classCode, '3');
  const decimalDot = parseWorkingDogResultRows(html.replace('264,38', '264.38'), 'finale');
  assert.equal(decimalDot[0].score, 264.38);
  const found = findMatchingWorkingDogResult(rows, 'Valentina Balli', 'Mind the Dog Cattivissimo Me', '2025 FCI Obedience World Championship 2025 - Finale');
  assert.equal(found?.score, 264.38);
  assert.equal(findMatchingWorkingDogResult(rows, 'Valentina Balli', 'Other dog', null), null);
  const duplicate = parseWorkingDogResultRows(html + html, '2025 FCI Obedience World Championship 2025 - Finale');
  assert.equal(findMatchingWorkingDogResult(duplicate, 'Valentina Balli', 'Mind the Dog Cattivissimo Me', null), null);
  console.log('OK: 9 controlli su riga, conduttore, cane, punteggio, qualifica, gara e ambiguità.');
  console.log('Fixture sintetica basata sul risultato fornito; provider reale non contattato.');
} finally { await fs.rm(dir, { recursive: true, force: true }); }
