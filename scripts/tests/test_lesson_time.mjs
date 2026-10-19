import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';
const source = await fs.readFile(new URL('../../src/lib/lessonTime.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {lessonLocalTime,lessonTimeOptions,lessonTimeOptionLabel} = await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
for (const tz of ['Europe/Rome','America/New_York','Asia/Tokyo']) {
 process.env.TZ=tz;
 assert.equal(lessonLocalTime(new Date('2026-07-01T10:30:00Z')), '2026-07-01T12:30:00');
 assert.deepEqual(lessonTimeOptions('2026-07-01T12:30'), ['2026-07-01T10:30:00.000Z']);
 assert.deepEqual(lessonTimeOptions('2026-01-01T12:30:15'), ['2026-01-01T11:30:15.000Z']);
 assert.deepEqual(lessonTimeOptions('2026-03-29T02:30'), []);
 assert.deepEqual(lessonTimeOptions('2026-10-25T02:30'), ['2026-10-25T00:30:00.000Z','2026-10-25T01:30:00.000Z']);
 assert.deepEqual(lessonTimeOptions('2026-10-25T03:00'), ['2026-10-25T02:00:00.000Z']);
 assert.deepEqual(lessonTimeOptions('2026-03-29T03:00'), ['2026-03-29T01:00:00.000Z']);
 assert.deepEqual(lessonTimeOptions('2024-02-29T12:00'), ['2024-02-29T11:00:00.000Z']);
 for (const value of ['', 'bad', '2026-02-30T12:00','2026-01-01T25:00','2026-01-01T12:00Z']) assert.deepEqual(lessonTimeOptions(value),[]);
 assert.equal(lessonLocalTime(new Date('invalid')), '');
 assert.match(lessonTimeOptionLabel('2026-10-25T00:30:00.000Z'),/GMT\+2/);
 assert.match(lessonTimeOptionLabel('2026-10-25T01:30:00.000Z'),/GMT\+1/);
}
console.log('OK: orari italiani in tre fusi dispositivo, ora legale/solare, orari inesistenti/ambigui e date non valide.');
