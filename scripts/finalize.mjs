import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { origin, publicPath, normalizeUrls } from './site.mjs';
async function walk(dir) { const out=[]; for(const e of await readdir(dir,{withFileTypes:true})){const f=`${dir}/${e.name}`;out.push(...(e.isDirectory()?await walk(f):[f]));}return out; }
const hashes=new Set(), urls=[];
for (const file of (await walk('dist')).filter(f=>f.endsWith('.html'))) {
  const html=normalizeUrls(await readFile(file,'utf8'));
  await writeFile(file,html);
  if (!file.endsWith('/404.html')) urls.push(origin+publicPath(file.slice(5)));
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) hashes.add(`'sha256-${createHash('sha256').update(match[1]).digest('base64')}'`);
}
await writeFile('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.sort().map(url=>`  <url><loc>${url}</loc></url>`).join('\n')}\n</urlset>\n`);
await writeFile('dist/robots.txt',`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
const headers=await readFile('dist/_headers','utf8');
await writeFile('dist/_headers',headers.replace(/script-src[^;]+;/,`script-src 'self' ${[...hashes].join(' ')};`));
