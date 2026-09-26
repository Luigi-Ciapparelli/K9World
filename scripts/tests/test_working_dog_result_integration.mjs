import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'pc-working-dog-integration-'));
try {
  const compile = async (name) => {
    const source = await fs.readFile(path.join(repo, name), 'utf8');
    const output = ts.transpileModule(source, {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    }).outputText;
    const target = path.join(dir, path.basename(name).replace(/\.ts$/, '.mjs'));
    await fs.writeFile(target, output);
    return target;
  };
  const parserFile = await compile('supabase/functions/_shared/workingDogResultParser.ts');
  const meritFile = await compile('supabase/functions/_shared/sportMerit.ts');
  const parser = await import(pathToFileURL(parserFile).href);
  const { evaluateMerit } = await import(pathToFileURL(meritFile).href);
  const html = `<title>2025 FCI Obedience World Championship 2025 - Finale</title><h2>Class 3</h2>
    <tr><td>4</td><td><a>Mind the Dog Cattivissimo Me</a></td><td><a>Valentina Balli</a></td><td>Total</td><td>264,38</td><td>EX</td></tr>`;
  const [row] = parser.parseWorkingDogResultRows(html, '2025 FCI Obedience World Championship 2025 - Finale');
  const match = parser.findMatchingWorkingDogResult([row], 'Valentina Balli', 'Mind the Dog Cattivissimo Me', null);
  assert.equal(match?.placement, 4);
  const decision = evaluateMerit({
    provider: 'working_dog', resultId: '21363623:4', eventId: '21363623', eventDate: '2025-09-01',
    sourceUrl: 'https://www.working-dog.com/results/2025-FCI-Obedience-World-Championship-2025---Finale-21363623',
    evidenceHash: 'a'.repeat(64), evidenceStatus: 'verified', evidenceMethod: 'authorized_provider_record',
    handlerId: 'valentina-working-dog-164835', dogId: '7848989', role: 'handler', discipline: 'obedience',
    ruleset: 'fci-obedience-2025', classCode: row.classCode, variant: 'individual', outcome: 'passed',
    score: row.score, maxScore: 320, isPublic: true,
  }, {
    provider: 'working_dog', handlerId: 'valentina-working-dog-164835', status: 'verified', method: 'provider_account_proof',
  }, '2026-09-26');
  assert.equal(decision.status, 'awarded');
  assert.equal(decision.medal, 'gold');
  console.log('OK: risultato reale fornito: Valentina Balli, 4ª, 264,38, EX, Obedience Classe 3 → Oro.');
  console.log('Fixture locale; fonte live e prova account provider non contattate.');
} finally { await fs.rm(dir, { recursive: true, force: true }); }
