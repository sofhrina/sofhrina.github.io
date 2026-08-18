import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const entriesDir = path.join(root, 'journal', 'entries');
const journalPath = path.join(root, 'journal.html');

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function parseScalar(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return JSON.parse(trimmed);
  }
  return trimmed;
}

function parseEntry(file) {
  const source = fs.readFileSync(path.join(entriesDir, file), 'utf8').replaceAll('\r\n', '\n');
  const match = source.match(/^---\n([\s\S]*?)\n---\n+([\s\S]*)$/);
  if (!match) throw new Error(`${file} needs YAML front matter`);

  const meta = {};
  for (const line of match[1].split('\n')) {
    const separator = line.indexOf(':');
    if (separator === -1) continue;
    meta[line.slice(0, separator).trim()] = parseScalar(line.slice(separator + 1));
  }
  for (const key of ['title', 'date', 'summary']) {
    if (!meta[key]) throw new Error(`${file} is missing ${key}`);
  }

  return { ...meta, file, body: match[2].trim() };
}

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

function markdownToHtml(markdown) {
  return markdown.split(/\n{2,}/).map(block => {
    const lines = block.split('\n');
    const heading = lines[0].match(/^(#{1,3})\s+(.+)$/);
    if (heading && lines.length === 1) {
      const level = Math.min(6, heading[1].length + 3);
      return `<h${level}>${inlineMarkdown(heading[2])}</h${level}>`;
    }
    if (lines.every(line => /^[-*]\s+/.test(line))) {
      return `<ul>${lines.map(line => `<li>${inlineMarkdown(line.replace(/^[-*]\s+/, ''))}</li>`).join('')}</ul>`;
    }
    if (lines.every(line => /^>\s?/.test(line))) {
      return `<blockquote>${lines.map(line => inlineMarkdown(line.replace(/^>\s?/, ''))).join('<br>')}</blockquote>`;
    }
    return `<p>${inlineMarkdown(lines.join(' '))}</p>`;
  }).join('\n');
}

function displayDate(value) {
  if (/^\d{4}$/.test(value)) return `${value}年`;
  if (/^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split('-').map(Number);
    return `${year}年${month}月`;
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
  }).format(date);
}

function renderGallery(entries) {
  const cards = entries.map((entry, index) => `
      <details class="journal-card" id="journal-entry-${index + 1}">
        <summary>
          <span class="journal-date">${escapeHtml(displayDate(entry.date))}</span>
          <h3>${escapeHtml(entry.title)}</h3>
          <span class="journal-deck">${escapeHtml(entry.summary)}</span>
          <span class="journal-read" aria-hidden="true"></span>
        </summary>
        <div class="journal-body">
${markdownToHtml(entry.body).split('\n').map(line => `          ${line}`).join('\n')}
        </div>
      </details>`).join('\n');

  return `<!-- JOURNAL_GALLERY_START -->
    <div class="journal-gallery" data-entry-count="${entries.length}">${cards}
    </div>
    <!-- JOURNAL_GALLERY_END -->`;
}

function replaceGenerated(source, name, content) {
  const expression = new RegExp(`<!-- ${name}_START -->[\\s\\S]*?<!-- ${name}_END -->`);
  if (!expression.test(source)) throw new Error(`journal.html is missing ${name} markers`);
  return source.replace(expression, content);
}

export function buildJournal() {
  if (!fs.existsSync(entriesDir)) throw new Error('Missing journal/entries');
  const entries = fs.readdirSync(entriesDir)
    .filter(file => file.endsWith('.md'))
    .map(parseEntry)
    .filter(entry => entry.draft !== 'true')
    .sort((a, b) => b.date.localeCompare(a.date));
  if (!entries.length) throw new Error('Journal needs at least one entry');

  let journal = fs.readFileSync(journalPath, 'utf8');
  journal = replaceGenerated(journal, 'JOURNAL_GALLERY', renderGallery(entries));
  fs.writeFileSync(journalPath, journal);
  console.log(`Built ${entries.length} journal entries into journal.html.`);
}

if (path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) buildJournal();
