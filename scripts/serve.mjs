import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const root = path.resolve('dist');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain' };
export const createPreviewServer = () => http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let file = path.resolve(root, '.' + pathname);
    if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403); return res.end('Forbidden'); }
    let info = await stat(file).catch(() => null);
    if (info?.isFile() && pathname.endsWith('.html') && pathname !== '/404.html') {
      const destination = pathname.replace(/index\.html$/, '').replace(/\.html$/, '');
      res.writeHead(307, { Location: destination + new URL(req.url, 'http://localhost').search });
      return res.end();
    }
    if (info?.isDirectory()) {
      if (!pathname.endsWith('/')) { res.writeHead(307, { Location: pathname + '/' + new URL(req.url, 'http://localhost').search }); return res.end(); }
      file = path.join(file, 'index.html');
    } else if (!info && !path.extname(file)) file += '.html';
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] ?? 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' }); res.end(body);
  } catch { res.writeHead(404, { 'Content-Type': 'text/html' }); res.end(await readFile(path.join(root, '404.html')).catch(() => 'Not found')); }
});
const port = Number(process.env.PORT || 4173);
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  createPreviewServer().listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}`));
}
