// Local synthetic fixtures only. No network, credentials, provider or database.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import ts from 'typescript';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sourceFile = path.join(repo, 'supabase/functions/_shared/sportMerit.ts');
const tsc = spawnSync(process.execPath, [path.join(repo, 'node_modules/typescript/bin/tsc'),
  '--noEmit', '--strict', '--target', 'ES2022', '--module', 'ESNext', '--moduleResolution', 'bundler',
  '--skipLibCheck', sourceFile], { cwd: repo, stdio: 'inherit' });
if (tsc.status !== 0) process.exit(tsc.status || 1);
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'pc-sport-merit-'));
try {
  const output = ts.transpileModule(await fs.readFile(sourceFile, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  });
  const compiled = path.join(temporary, 'sportMerit.mjs');
  await fs.writeFile(compiled, output.outputText);
  const { evaluateMerit, summarizeMerit } = await import(pathToFileURL(compiled).href);
  const today = '2026-09-26';
  const binding = { provider: 'synthetic', handlerId: 'person-1', status: 'verified', method: 'manual_identity_review' };
  const base = { provider: 'synthetic', resultId: 'result-1', eventId: 'event-1', eventDate: '2026-09-01',
    sourceUrl: 'https://example.invalid/result/1', evidenceHash: 'a'.repeat(64),
    evidenceStatus: 'verified', evidenceMethod: 'manual_official_review', handlerId: 'person-1', dogId: 'dog-1',
    role: 'handler', discipline: 'igp', ruleset: 'fci-igp-2025', classCode: 'IGP1', variant: 'full',
    outcome: 'passed', isPublic: true };
  let checks = 0;
  const result = (overrides = {}) => ({ ...base, ...overrides });
  const check = (overrides, status, medal = null, identity = binding) => {
    const actual = evaluateMerit(result(overrides), identity, today);
    assert.equal(actual.status, status, JSON.stringify({ overrides, actual }));
    assert.equal(actual.medal, medal); checks++;
  };

  for (const [index, medal] of ['bronze', 'silver', 'gold'].entries()) {
    const level = String(index + 1);
    check({ classCode: 'IGP' + level }, 'awarded', medal);
    check({ discipline: 'obedience', ruleset: 'fci-obedience-2025', classCode: level,
      variant: 'individual', score: 256, maxScore: 320 }, 'awarded', medal);
    check({ discipline: 'agility', ruleset: 'fci-agility-2025', classCode: level,
      variant: 'agility', totalPenalties: 0, outcome: 'completed' }, 'awarded', medal);
    check({ discipline: 'rally-obedience', ruleset: 'enci-rally-obedience-2026', classCode: level,
      variant: 'individual', score: 90, maxScore: 100 }, 'awarded', medal);
    check({ discipline: 'mondioring', ruleset: 'fci-mondioring-17191', classCode: ['I', 'II', 'III'][index],
      variant: 'individual', score: [160, 240, 320][index], maxScore: [200, 300, 400][index] }, 'awarded', medal);
    check({ discipline: 'tracking', classCode: 'IFH' + level, variant: 'individual', score: 70, maxScore: 100 }, 'awarded', medal);
    check({ discipline: 'mantrailing', ruleset: 'fci-iro-rescue-2025', classCode: ['RH-MT V', 'RH-MT A', 'RH-MT B'][index],
      variant: 'sport-test' }, 'awarded', medal);
    check({ discipline: 'hoopers', ruleset: 'fci-hoopers-2026', classCode: 'H' + level,
      variant: 'individual', totalPenalties: 0 }, 'awarded', medal);
    for (const variant of ['freestyle', 'heelwork-to-music']) {
      check({ discipline: 'dog-dancing', ruleset: 'enci-dog-dancing-2024', classCode: level,
        variant, score: 34, maxScore: 40, criterionScores: [9, 9, 8, 8] }, 'awarded', medal);
    }
  }
  for (const outcome of ['failed', 'withdrawn', 'disqualified']) check({ outcome, score: 300, maxScore: 300 }, 'ineligible');
  check({ classCode: 'UPr3' }, 'needs_review');
  check({ outcome: 'completed' }, 'needs_review');
  check({ phaseScores: [100, 100, 69], score: 269, maxScore: 300 }, 'needs_review');
  check({ phaseScores: [70, 70, 70], score: 211, maxScore: 300 }, 'needs_review');
  check({ score: 200, maxScore: 300 }, 'needs_review');
  check({ discipline: 'obedience', ruleset: 'fci-obedience-2025', classCode: '3', variant: 'individual',
    score: 255.99, maxScore: 320 }, 'below_threshold');
  check({ discipline: 'obedience', ruleset: 'fci-obedience-2025', classCode: '3', variant: 'individual',
    score: 300, maxScore: 300 }, 'needs_review');
  check({ discipline: 'agility', ruleset: 'fci-agility-2025', classCode: '3', variant: 'agility',
    totalPenalties: 0.01 }, 'below_threshold');
  check({ discipline: 'agility', ruleset: 'fci-agility-2025', classCode: '3', variant: 'jumping',
    totalPenalties: 0 }, 'needs_review');
  check({ discipline: 'dog-dancing', ruleset: 'enci-dog-dancing-2024', classCode: '3', variant: 'freestyle',
    score: 34, maxScore: 40, criterionScores: [4, 10, 10, 10] }, 'ineligible');
  check({ discipline: 'dog-dancing', ruleset: 'enci-dog-dancing-2024', classCode: '3', variant: 'freestyle',
    score: 34, maxScore: 40 }, 'needs_review');
  check({ discipline: 'tracking', classCode: 'IGP-FH', variant: 'individual', phaseScores: [70, 100] }, 'awarded', 'gold');
  check({ discipline: 'tracking', classCode: 'IGP-FH', variant: 'individual', phaseScores: [69, 100] }, 'needs_review');
  for (const role of ['owner', 'trainer', 'unknown']) check({ role }, 'ineligible');
  check({ handlerId: 'other-handler' }, 'ineligible');
  check({ evidenceStatus: 'pending' }, 'needs_review');
  check({ evidenceStatus: 'revoked' }, 'ineligible');
  check({ evidenceMethod: 'page_text_match' }, 'needs_review');
  check({}, 'needs_review', null, { ...binding, method: 'name_match' });
  check({}, 'ineligible', null, { ...binding, status: 'revoked' });
  check({ isPublic: false }, 'ineligible');
  check({ eventDate: '2026-02-30' }, 'needs_review');
  check({ eventDate: '2026-09-27' }, 'needs_review');
  check({ evidenceHash: 'not-a-hash' }, 'needs_review');
  check({ sourceUrl: 'javascript:alert(1)' }, 'needs_review');
  check({ dogId: '' }, 'needs_review');
  check({ ruleset: 'unknown-national-rules' }, 'needs_review');
  for (const discipline of ['disc-dog', 'flyball']) check({ discipline }, 'needs_review');

  const duplicate = { ...base };
  assert.deepEqual(summarizeMerit([base, duplicate], binding, 'igp', 'full', today),
    { medal: 'bronze', dogsAtBestTier: 1, eventsAtBestTier: 1, mostRecentAtBestTier: '2026-09-01', conflictingRecords: 0 }); checks++;
  assert.equal(summarizeMerit([base, result({ classCode: 'IGP3' })], binding, 'igp', 'full', today).medal, null); checks++;
  assert.equal(summarizeMerit([base, result({ evidenceStatus: 'revoked' })], binding, 'igp', 'full', today).medal, null); checks++;
  const gold = result({ resultId: 'result-2', classCode: 'IGP3', dogId: 'dog-2', eventId: 'event-2' });
  const summary = summarizeMerit([base, gold, { ...gold, resultId: 'result-3' }], binding, 'igp', 'full', today);
  assert.equal(summary.medal, 'gold'); assert.equal(summary.dogsAtBestTier, 1); assert.equal(summary.eventsAtBestTier, 1); checks++;
  assert.equal(summarizeMerit([gold], binding, 'obedience', 'individual', today).medal, null); checks++;
  console.log(`OK: ${checks} controlli su soglie, esiti, identità, duplicati, revoche e separazione discipline.`);
  console.log('Fixture sintetiche. Importazione Working-Dog, Supabase e interfaccia NON collaudati da questo test.');
} finally { await fs.rm(temporary, { recursive: true, force: true }); }
