import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const args = process.argv.slice(2);
const portIndex = args.indexOf('--port');
const port = Number(portIndex >= 0 ? args[portIndex + 1] : 4173);
const sampleMessages = [
  {
    id: 'sample-1',
    nickname: 'a quiet visitor',
    body: 'Found your corner of the internet and stayed for a while. Keep building.',
    created_at: '2026-08-10T18:00:00.000Z'
  },
  {
    id: 'sample-2',
    nickname: 'someone from London',
    body: 'The error taxonomy line is going to stay with me.',
    created_at: '2026-08-09T12:30:00.000Z'
  }
];

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.json': 'application/json; charset=utf-8',
  '.pdf': 'application/pdf'
};

const json = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
};

http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/api/messages' && req.method === 'GET') {
    return json(res, 200, { messages: sampleMessages });
  }
  if (url.pathname === '/api/messages' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        if (!parsed.nickname || !parsed.message) return json(res, 400, { error: 'Please complete the required fields.' });
        json(res, 201, { ok: true, message: 'Your note is waiting backstage.' });
      } catch {
        json(res, 400, { error: 'That note could not be read.' });
      }
    });
    return;
  }

  const relative = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  const file = path.resolve(root, `.${relative}`);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    return res.end('Not found');
  }
  res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(port, '127.0.0.1', () => {
  console.log(`Personal site preview: http://localhost:${port}`);
});
