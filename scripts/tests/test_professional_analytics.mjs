// Pure date/response contracts; no network or personal data.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const source=fs.readFileSync(new URL('../../src/lib/professionalAnalytics.ts',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {activityPreset,activityRangeError,italianToday,readActivitySummary}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
assert.equal(italianToday(new Date('2026-06-30T22:30:00Z')),'2026-07-01');
assert.deepEqual(activityPreset('month',new Date('2026-06-30T22:30:00Z')),{from:'2026-07-01',to:'2026-07-01'});
assert.deepEqual(activityPreset('90days',new Date('2026-04-01T12:00:00Z')),{from:'2026-01-02',to:'2026-04-01'});
assert.deepEqual(activityPreset('year',new Date('2024-12-31T12:00:00Z')),{from:'2024-01-01',to:'2024-12-31'});
assert.equal(activityRangeError({from:'2024-01-01',to:'2024-12-31'}),'');
for(const range of [{from:'',to:'2026-01-01'},{from:'2026-02-30',to:'2026-03-01'},{from:'2026-12-01',to:'2026-01-01'},{from:'2024-01-01',to:'2025-01-01'}])
 assert.notEqual(activityRangeError(range),'');
const range={from:'2026-06-01',to:'2026-06-30'};
const empty={...range,time_zone:'Europe/Rome',as_of:'2026-07-01T12:00:00Z',total:0,completed:0,pending:0,accepted:0,declined:0,cancelled:0,other:0,customers:0,returning_customers:0,returning_percent:null,completed_value:0,missing_prices:0,service_groups:0,top_services:[]};
assert.deepEqual(readActivitySummary(empty,range),empty);
for(const value of [null,[],{}, {...empty,from:'2026-05-01'}, {...empty,total:1}, {...empty,completed_value:NaN}, {...empty,returning_percent:0}, {...empty,top_services:[{}]}])
 assert.throws(()=>readActivitySummary(value,range));
console.log('OK: periodi italiani, anno bisestile, limite 366 giorni e risposte incomplete respinte.');
