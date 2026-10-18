import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const source=await readFile(new URL('../../src/lib/siteHelp.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {helpArticlesFor,filterHelpArticles}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
for(const role of ['visitor','owner','professional','admin']){
 const articles=helpArticlesFor(role,true),links=articles.flatMap(a=>a.links.map(l=>l.to));
 assert.equal(new Set(articles.map(a=>a.id)).size,articles.length);
 assert.deepEqual(filterHelpArticles(articles,'  '),articles);
 assert.equal(filterHelpArticles(articles,'zzxyqq').length,0);
 assert.equal(filterHelpArticles(articles,'  IMPARA ').length,filterHelpArticles(articles,'impara').length);
 assert.ok(links.every(l=>l.startsWith('/')&&!l.startsWith('//')));
 if(role==='visitor')assert.ok(links.every(l=>!/^\/(owner|pro|account)\//.test(l)));
 if(role==='owner')assert.ok(links.every(l=>!l.startsWith('/pro/')));
 if(role==='professional')assert.ok(links.every(l=>!l.startsWith('/owner/')));
 if(role==='admin')assert.ok(links.every(l=>!/^\/(owner|pro)\//.test(l)));
 const disabled=helpArticlesFor(role,false).flatMap(a=>a.links.map(l=>l.to));
 assert.ok(!disabled.includes('/pro/archive')&&!disabled.includes('/owner/relationships'));
}
const pro=helpArticlesFor('professional',true);
assert.deepEqual(filterHelpArticles(pro,'continuità'),filterHelpArticles(pro,'CONTINUITA'));
assert.ok(filterHelpArticles(pro,'appunti privati').some(a=>a.id==='pro-clients'));
assert.ok(filterHelpArticles(helpArticlesFor('owner',true),'relazione').some(a=>a.id==='owner-archive'));
console.log('OK: argomenti per ruolo, flag archivio, ricerca italiana e link pertinenti.');
