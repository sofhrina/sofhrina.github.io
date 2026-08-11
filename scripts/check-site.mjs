import fs from 'node:fs';
import path from 'node:path';

const requiredFiles = [
  'index.html',
  'guestbook.html',
  'guestbook.css',
  'guestbook.js',
  'journal/README.md',
  'scripts/add-journal.mjs',
  'scripts/build-journal.mjs',
  'cloudflare/schema.sql',
  'cloudflare/guestbook-api/src/index.js',
  'cloudflare/guestbook-admin/src/index.js',
  'cloudflare/guestbook-admin/public/index.html'
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}`);
}

const journalEntries = fs.readdirSync('journal/entries')
  .filter(file => file.endsWith('.md'));
if (!journalEntries.length) throw new Error('Journal needs at least one Markdown entry');

const indexHtml = fs.readFileSync('index.html', 'utf8');
for (const marker of [
  'JOURNAL_PREVIEW_START',
  'JOURNAL_PREVIEW_END',
  'JOURNAL_GALLERY_START',
  'JOURNAL_GALLERY_END'
]) {
  if (!indexHtml.includes(`<!-- ${marker} -->`)) throw new Error(`index.html is missing ${marker}`);
}
if (!indexHtml.includes(`data-entry-count="${journalEntries.length}"`)) {
  throw new Error('Journal gallery is out of date; run npm run journal:build');
}
for (const file of journalEntries) {
  const source = fs.readFileSync(path.join('journal/entries', file), 'utf8');
  const title = source.match(/^title:\s*(?:"([^"]+)"|'([^']+)'|(.+))$/m);
  if (!title) throw new Error(`${file} is missing a title`);
  const value = title[1] || title[2] || title[3].trim();
  if (!indexHtml.includes(value)) throw new Error(`${file} has not been built into index.html`);
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
