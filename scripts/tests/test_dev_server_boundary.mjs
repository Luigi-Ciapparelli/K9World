// Local, disposable fixtures only. Never reads project secrets or an online service.
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'vite';

const root = await mkdtemp(join(tmpdir(), 'pc-vite-boundary-'));
const marker = 'SYNTHETIC_PRIVATE_FIXTURE_NOT_A_SECRET';
let server;
try {
  await mkdir(join(root, 'src'));
  await writeFile(join(root, 'src/main.js'), 'export const fixture = "public";');
  await writeFile(join(root, '.env.test-only'), `PC_FIXTURE=${marker}\n`);
  await writeFile(join(root, 'private.crt'), marker);
  server = await createServer({
    configFile: false,
    envFile: false,
    root,
    publicDir: false,
    logLevel: 'silent',
    server: { host: '127.0.0.1', port: 0, fs: { strict: true, allow: [root] } },
  });
  await server.listen();
  const address = server.httpServer.address();
  assert.ok(address && typeof address === 'object');
  const base = `http://127.0.0.1:${address.port}`;
  const read = (path, options = {}) => fetch(base + path, {
    ...options, signal: AbortSignal.timeout(5000),
  });
  const publicResponse = await read('/src/main.js');
  assert.equal(publicResponse.status, 200, 'The fixture server must actually serve public code');
  assert.match(await publicResponse.text(), /fixture/);

  let checked = 0;
  for (const file of ['.env.test-only', 'private.crt']) {
    for (const query of ['', '?raw', '?import&raw', '?import&url&inline']) {
      const response = await read(`/${file}${query}`);
      assert.equal(response.status, 403, `Private fixture must be denied: ${file}${query}`);
      assert.equal((await response.text()).includes(marker), false, 'No private contents in response');
      checked++;
    }
  }
  const origin = 'https://untrusted.example.invalid';
  const crossOrigin = await read('/src/main.js', { headers: { Origin: origin } });
  assert.equal(crossOrigin.headers.get('access-control-allow-origin'), null,
    'An unrelated website must not be allowed to read the development server');
  console.log(`OK: ${checked} private fixture requests denied; public code works; unrelated origin not allowed.`);
} finally {
  if (server) await server.close();
  await rm(root, { recursive: true, force: true });
}
