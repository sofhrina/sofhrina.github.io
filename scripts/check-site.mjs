import fs from 'node:fs';

const requiredFiles = [
  'index.html',
  'guestbook.html',
  'guestbook.css',
  'guestbook.js',
  'cloudflare/schema.sql',
  'cloudflare/guestbook-api/src/index.js',
  'cloudflare/guestbook-admin/src/index.js',
  'cloudflare/guestbook-admin/public/index.html'
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}`);
}

for (const file of ['index.html', 'guestbook.html', 'cloudflare/guestbook-admin/public/index.html']) {
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes('<!DOCTYPE html>')) throw new Error(`${file} is not an HTML document`);
}

for (const file of ['guestbook.js', 'cloudflare/guestbook-api/src/index.js', 'cloudflare/guestbook-admin/src/index.js']) {
  const source = fs.readFileSync(file, 'utf8');
  new Function(source.replace(/^import .*;$/m, '').replace(/^export default/m, 'return'));
}

const guestbookApi = fs.readFileSync('cloudflare/guestbook-api/src/index.js', 'utf8');
for (const origin of [
  'http://sofhrina.com',
  'http://www.sofhrina.com',
  'https://sofhrina.com',
  'https://www.sofhrina.com'
]) {
  if (!guestbookApi.includes(`'${origin}'`)) {
    throw new Error(`Guestbook API is missing the allowed origin ${origin}`);
  }
}

console.log('Site structure and JavaScript syntax checks passed.');
