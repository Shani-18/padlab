import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createPreviewServer } from '../scripts/serve.mjs';

test('preview resolves clean URLs, redirects legacy paths and returns a useful 404', async () => {
  const server=createPreviewServer();
  server.listen(0,'127.0.0.1');
  await once(server,'listening');
  try {
    for(const [url,status,location] of [
      ['/guides/dualsense-test',200],['/guides/dualsense-test.html',307,'/guides/dualsense-test'],
      ['/guides',307,'/guides/'],['/index.html',307,'/'],['/about',200],['/missing-audit-page',404]
    ]) {
      const response=await fetch(`http://127.0.0.1:${server.address().port}`+url,{redirect:'manual'});
      assert.equal(response.status,status,url);
      if(location)assert.equal(response.headers.get('location'),location);
      if(status===404)assert.match(await response.text(),/Browse controller guides/);
      if(url==='/guides/dualsense-test')assert.match(await response.text(),/canonical" href="https:\/\/padlab\.m-usmanaslam18101999\.workers\.dev\/guides\/dualsense-test"/);
    }
  } finally { server.closeAllConnections(); await new Promise(resolve=>server.close(resolve)); }
});
