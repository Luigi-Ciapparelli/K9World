// Response validation and Italian formatting. No network calls.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const source=fs.readFileSync(new URL('../../src/lib/professionalClients.ts',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {parseClientPage,clientMoney,clientDate}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const row={id:'synthetic',full_name:'Cliente',booking_count:3,total_spend:'25.50',missing_prices:0,dogs:[],tags:[]};
assert.equal(parseClientPage({total:1,page:0,rows:[row]},0).rows[0].total_spend,25.5);
for(const value of [null,{}, {total:1,page:1,rows:[row]}, {total:1,page:0,rows:[{...row,tags:[{}]}]}, {total:1,page:0,rows:[{...row,dogs:[null]}]}, {total:1,page:0,rows:[{...row,total_spend:null}]}, {total:1,page:0,rows:[{...row,total_spend:'NaN'}]}]) assert.throws(()=>parseClientPage(value,0));
assert.equal(clientDate(null),'—');assert.equal(clientDate('broken'),'—');
assert.ok(clientDate('2026-10-25T09:00:00Z').includes('10:00'));
assert.ok(clientMoney(25.5).includes('25,50'));assert.ok(clientMoney(25.5).includes('€'));
console.log('OK: risposte incomplete respinte, euro e orario italiano.');
