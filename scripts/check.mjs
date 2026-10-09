import { readdir, readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import path from 'node:path';
import { origin, publicPath } from './site.mjs';
const root=path.resolve('dist');
async function walk(dir) { const out=[]; for(const e of await readdir(dir,{withFileTypes:true})){const f=path.join(dir,e.name);out.push(...(e.isDirectory()?await walk(f):[f]));}return out; }
async function resolveTarget(url) {
 let file=path.join(root,url);const info=await stat(file).catch(()=>null);
 if(info?.isDirectory())file=path.join(file,'index.html');else if(!info&&!path.extname(file))file+='.html';
 await stat(file);return file;
}
const files=await walk(root), titles=new Set(), descriptions=new Set(), canonicals=new Set();
const headers=await readFile(path.join(root,'_headers'),'utf8');
for(const file of files.filter(f=>f.endsWith('.html'))) {
 const html=await readFile(file,'utf8');
 assert.equal((html.match(/<h1[ >]/g)||[]).length,1,file+' must have one H1');
 const title=html.match(/<title>(.*?)<\/title>/)?.[1];assert.ok(title&&!titles.has(title),'duplicate/missing title');titles.add(title);
 assert.ok(!html.includes('chatgpt.site'),file+' has stale host');
 if(!file.endsWith('404.html')) {
  const description=html.match(/name="description" content="([^"]+)"/)?.[1];assert.ok(description&&!descriptions.has(description),'duplicate/missing description');descriptions.add(description);
  const canonical=html.match(/rel="canonical" href="([^"]+)"/)?.[1];
  assert.equal(canonical,origin+publicPath(path.relative(root,file).replaceAll('\\','/')),file+' canonical must be final URL');
  assert.ok(!canonicals.has(canonical));canonicals.add(canonical);
  assert.ok(!/name="robots" content="[^"]*noindex/.test(html));
 }
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size,'duplicate ID');
 for(const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
  const url=m[1];if(/^https?:/.test(url))continue;const [pathname,hash]=url.split('#');
  assert.ok(!pathname.endsWith('.html'),'internal link points to redirect: '+url);
  const target=pathname?await resolveTarget(pathname):file;
  if(hash)assert.ok((await readFile(target,'utf8')).includes(`id="${hash}"`),'missing fragment '+url);
 }
 for(const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
  JSON.parse(m[1]);assert.ok(headers.includes(`'sha256-${createHash('sha256').update(m[1]).digest('base64')}'`),'CSP missing JSON-LD hash: '+file);
 }
}
const locations=[...(await readFile(path.join(root,'sitemap.xml'),'utf8')).matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
assert.equal(locations.length,new Set(locations).size,'duplicate sitemap URL');assert.deepEqual(new Set(locations),canonicals,'sitemap must match canonical pages');
assert.ok((await readFile(path.join(root,'robots.txt'),'utf8')).includes(`Sitemap: ${origin}/sitemap.xml`));
assert.ok(!(await readFile(path.join(root,'assets/styles.css'),'utf8')).includes('@import'));
console.log(`Checked ${titles.size} pages: final canonical URLs, sitemap coverage, metadata, local links/fragments and every JSON-LD CSP hash.`);
