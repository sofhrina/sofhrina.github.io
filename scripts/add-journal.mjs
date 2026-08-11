import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildJournal } from './build-journal.mjs';

const args = process.argv.slice(2);
const sourcePath = args[0] ? path.resolve(args[0]) : '';

function option(name) {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? '' : args[index + 1] || '';
}

if (!sourcePath || !fs.existsSync(sourcePath)) {
  throw new Error('Usage: npm run journal:add -- "/path/to/article.md" --date YYYY-MM-DD --summary "One or two sentences"');
}

const date = option('date');
const summary = option('summary');
const title = option('title') || path.basename(sourcePath, path.extname(sourcePath));
if (!/^\d{4}(-\d{2}){0,2}$/.test(date)) throw new Error('--date must be YYYY, YYYY-MM, or YYYY-MM-DD');
if (!summary) throw new Error('--summary is required');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const entriesDir = path.join(root, 'journal', 'entries');
fs.mkdirSync(entriesDir, { recursive: true });

const slug = title
  .normalize('NFKC')
  .toLowerCase()
  .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
  .replace(/^-|-$/g, '');
const destination = path.join(entriesDir, `${date}-${slug || 'entry'}.md`);
if (fs.existsSync(destination)) throw new Error(`${path.basename(destination)} already exists`);

let body = fs.readFileSync(sourcePath, 'utf8').replaceAll('\r\n', '\n').trim();
body = body.replace(/^---\n[\s\S]*?\n---\n+/, '');
const output = [
  '---',
  `title: ${JSON.stringify(title)}`,
  `date: ${date}`,
  `summary: ${JSON.stringify(summary)}`,
  '---',
  '',
  body,
  ''
].join('\n');

fs.writeFileSync(destination, output);
buildJournal();
console.log(`Added ${path.relative(root, destination)}.`);
