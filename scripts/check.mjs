import { readdir, readFile, access, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import path from 'node:path';
const root=path.resolve('dist');
async function walk(dir){const out=[];for(const entry of await readdir(dir,{withFileTypes:true})){const f=path.join(dir,entry.name);if(entry.isDirectory())out.push(...await walk(f));else out.push(f)}return out}
const files=await walk(root);const titles=new Set(),descriptions=new Set();
for(const file of files.filter(f=>f.endsWith('.html'))){const text=await readFile(file,'utf8');assert.equal((text.match(/<h1[ >]/g)||[]).length,1,file+' must have one h1');assert.ok(text.includes('lang="en"'));const title=text.match(/<title>(.*?)<\/title>/)?.[1];assert.ok(title&&!titles.has(title),'unique title');titles.add(title);if(!file.endsWith('404.html')){const description=text.match(/name="description" content="([^"]+)"/)?.[1];assert.ok(description&&!descriptions.has(description),'unique description');descriptions.add(description);assert.ok(text.includes('rel="canonical"'));}const ids=[...text.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,'duplicate HTML id');for(const m of text.matchAll(/(?:href|src)="([^"]+)"/g)){const url=m[1];if(url.startsWith('https:'))continue;const [pathname,hash]=url.split('#');const target=pathname?path.join(root,pathname==='/'?'index.html':pathname):file;await access(target);if(hash){const targetText=await readFile(target,'utf8');assert.ok(targetText.includes(`id="${hash}"`),'broken fragment '+url);}}for(const m of text.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs))JSON.parse(m[1]);}
const main=await readFile(path.join(root,'index.html'),'utf8');const jsonld=main.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1];
const hash=createHash('sha256').update(jsonld).digest('base64');
const headersPath=path.join(root,'_headers');let headers=await readFile(headersPath,'utf8');headers=headers.replace(/sha256-[^']+/g,'sha256-'+hash);await writeFile(headersPath,headers);
const total=files.reduce(async(sum,f)=>(await sum)+Buffer.byteLength(await readFile(f)),Promise.resolve(0));
console.log(`Checked ${titles.size} HTML pages: unique titles, descriptions, H1s, canonical tags, local links, fragments, IDs and JSON-LD. CSP hash synchronized. Static size: ${Math.round((await total)/1024)} KB.`);
