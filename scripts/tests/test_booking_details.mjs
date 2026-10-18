import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const source=fs.readFileSync(new URL('../../src/lib/bookingDetails.ts',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {readBookingDetails,bookingDateTime,bookingPrice,bookingTodayBounds}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const row={booking_id:'a',end_at:'2026-10-18T09:00:00Z',service_name:'Lezione',service_source:'recorded',dog_names:['Cane'],dogs_unavailable:false};
assert.deepEqual(readBookingDetails([row],['a']),{a:row});assert.deepEqual(readBookingDetails([],['a']),{});
for(const value of [null,{},[null],[row,row],[{...row,booking_id:'foreign'}],[{...row,dog_names:'Cane'}],[{...row,dog_names:['']}],[{...row,end_at:123}],[{...row,end_at:'invalid'}],[{...row,service_source:'guessed'}],[{...row,service_name:''}],[{...row,dogs_unavailable:undefined}]])assert.throws(()=>readBookingDetails(value,['a']));
assert.ok(bookingDateTime('2026-10-18T09:00:00Z').includes('11:00'));assert.equal(bookingDateTime(null),'Orario non disponibile');
for(const bad of [null,'NaN',-3,''])assert.equal(bookingPrice(bad),'Prezzo da confermare');assert.ok(bookingPrice(0).includes('0,00'));
for(const [instant,from,until] of [
 ['2026-03-29T12:00:00Z','2026-03-28T23:00:00.000Z','2026-03-29T22:00:00.000Z'],
 ['2026-10-25T12:00:00Z','2026-10-24T22:00:00.000Z','2026-10-25T23:00:00.000Z'],
 ['2026-06-30T23:00:00Z','2026-06-30T22:00:00.000Z','2026-07-01T22:00:00.000Z'],
 ['2026-12-31T23:30:00Z','2026-12-31T23:00:00.000Z','2027-01-01T23:00:00.000Z']
])assert.deepEqual(bookingTodayBounds(new Date(instant)),{from,until});
console.log('OK: risposte incomplete, importi, fuso italiano e cambio ora.');
