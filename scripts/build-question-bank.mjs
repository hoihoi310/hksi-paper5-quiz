import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const databaseDir = path.join(root, 'database');
const htmlPath = path.join(root, 'hksi_paper5_quiz_supabase.html');

function readQuestions(filePath) {
  const source = fs.readFileSync(filePath, 'utf8').replace(/,\s*([}\]])/g, '$1');
  const parsed = JSON.parse(source);
  return Array.isArray(parsed) ? parsed : parsed.questions || parsed.data || [];
}

function normalize(question, sourceName) {
  const match = String(question.id || '').match(/^T(\d+)-/);
  if (!match || !question.question || !question.answer) {
    throw new Error(`Invalid question in ${sourceName}: ${question.id || '(missing id)'}`);
  }

  const options = Array.isArray(question.options)
    ? question.options.map(option => ({ value: String(option.value), label: String(option.label) }))
    : Object.entries(question.options || {}).map(([value, label]) => ({ value, label: String(label) }));
  const values = options.map(option => option.value).sort().join('');
  if (values !== 'ABCD' || !options.some(option => option.value === question.answer)) {
    throw new Error(`Invalid options/answer in ${sourceName}: ${question.id}`);
  }

  return {
    id: String(question.id),
    topic: question.topic || `Topic ${match[1]}`,
    subtopic: question.subtopic || 'General',
    difficulty: question.difficulty || '未分類',
    question: String(question.question),
    options,
    answer: String(question.answer),
    explanation: String(question.explanation || ''),
    reference: String(question.reference || '')
  };
}

const files = fs.readdirSync(databaseDir)
  .filter(name => name.toLowerCase().endsWith('.json'))
  .sort((a, b) => a.localeCompare(b, 'en'));
const bank = files.flatMap(name => readQuestions(path.join(databaseDir, name)).map(question => normalize(question, name)));
const ids = new Set();
for (const question of bank) {
  if (ids.has(question.id)) throw new Error(`Duplicate question id: ${question.id}`);
  ids.add(question.id);
}
bank.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

let html = fs.readFileSync(htmlPath, 'utf8');
const marker = /const BANK=.*?;\r?\nlet quiz/s;
if (!marker.test(html)) throw new Error('Could not find BANK declaration in HTML');
html = html.replace(marker, `const BANK=${JSON.stringify(bank)};\nlet quiz`);
html = html.replace(/<div class="sub">.*?題庫｜/u, `<div class="sub">${bank.length} 題題庫｜`);
html = html.replace(/題庫共 <span id="total"><\/span> 題。題目內容以目前 50 題 JSON 題庫為準。/u,
  '題庫共 <span id="total"></span> 題。題目內容由 database JSON 題庫統一匯入。');
fs.writeFileSync(htmlPath, html);

console.log(`Built ${bank.length} questions from ${files.length} JSON files.`);
