import fs from 'node:fs';
import path from 'node:path';

const requiredFiles = [
  '.nojekyll',
  'index.html',
  'about.html',
  'research.html',
  'projects.html',
  'experience.html',
  'academic.html',
  'journal.html',
  'rest.html',
  'library.html',
  'interior.css',
  'assets/ui/hp-cursor.png',
  'assets/about/nancy-wheeler.jpg',
  'assets/about/jodie-foster.jpg',
  'assets/about/miao-jing.jpg',
  'assets/about/kang-mo-yeon.jpg',
  'robots.txt',
  'sitemap.xml',
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
  .filter(file => file.endsWith('.md'))
  .filter(file => !/^draft:\s*true\s*$/m.test(fs.readFileSync(path.join('journal/entries', file), 'utf8')));
if (!journalEntries.length) throw new Error('Journal needs at least one Markdown entry');

const indexHtml = fs.readFileSync('index.html', 'utf8');
for (const identity of ['Huiru Feng', '冯绘如', 'Sophia Feng', 'Sofhrina']) {
  if (!indexHtml.includes(identity)) throw new Error(`SEO identity is missing ${identity}`);
}
for (const seoMarker of [
  'application/ld+json',
  'https://schema.org',
  'https://sofhrina.com/#huiru-feng'
]) {
  if (!indexHtml.includes(seoMarker)) throw new Error(`index.html is missing SEO marker ${seoMarker}`);
}

for (const page of ['about.html', 'research.html', 'projects.html', 'experience.html', 'academic.html', 'journal.html', 'rest.html', 'library.html']) {
  const html = fs.readFileSync(page, 'utf8');
  if (!html.includes('<link rel="canonical"')) throw new Error(`${page} is missing its canonical URL`);
  if (!html.includes('href="index.html"')) throw new Error(`${page} does not link back to the homepage`);
}

const aboutHtml = fs.readFileSync('about.html', 'utf8');
for (const person of ['Nancy Wheeler', 'Clarice Starling', '苗靖', '姜暮烟']) {
  if (!aboutHtml.includes(person)) throw new Error(`about.html is missing ${person}`);
}

const robots = fs.readFileSync('robots.txt', 'utf8');
if (!robots.includes('Sitemap: https://sofhrina.com/sitemap.xml')) {
  throw new Error('robots.txt does not advertise the canonical sitemap');
}

const sitemap = fs.readFileSync('sitemap.xml', 'utf8');
for (const url of ['https://sofhrina.com/', 'https://sofhrina.com/about.html', 'https://sofhrina.com/research.html', 'https://sofhrina.com/projects.html', 'https://sofhrina.com/experience.html', 'https://sofhrina.com/academic.html', 'https://sofhrina.com/journal.html', 'https://sofhrina.com/rest.html', 'https://sofhrina.com/library.html', 'https://sofhrina.com/guestbook.html']) {
  if (!sitemap.includes(`<loc>${url}</loc>`)) throw new Error(`sitemap.xml is missing ${url}`);
}
const journalHtml = fs.readFileSync('journal.html', 'utf8');
for (const marker of ['JOURNAL_GALLERY_START', 'JOURNAL_GALLERY_END']) {
  if (!journalHtml.includes(`<!-- ${marker} -->`)) throw new Error(`journal.html is missing ${marker}`);
}
if (!journalHtml.includes(`data-entry-count="${journalEntries.length}"`)) {
  throw new Error('Journal gallery is out of date; run npm run journal:build');
}
for (const file of journalEntries) {
  const source = fs.readFileSync(path.join('journal/entries', file), 'utf8');
  const title = source.match(/^title:\s*(?:"([^"]+)"|'([^']+)'|(.+))$/m);
  if (!title) throw new Error(`${file} is missing a title`);
  const value = title[1] || title[2] || title[3].trim();
  if (!journalHtml.includes(value)) throw new Error(`${file} has not been built into journal.html`);
}

for (const file of ['index.html', 'about.html', 'research.html', 'projects.html', 'experience.html', 'academic.html', 'journal.html', 'rest.html', 'library.html', 'guestbook.html', 'cloudflare/guestbook-admin/public/index.html']) {
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
