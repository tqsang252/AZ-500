import fs from 'node:fs';
const questions = JSON.parse(fs.readFileSync('client/public/question_1.json', 'utf8'));
const q = questions.find((item) => String(item.id) === '190');
if (!q) throw new Error('Question 190 missing');
if (q.type !== 'hotspot' || q.answer_areas?.length !== 2) throw new Error('HOTSPOT answer areas are incomplete');
if (!q.media?.[0]?.src.includes('page-187_237be972.jpg')) throw new Error('Exhibit URL is not patched');
if (!q.answer.every((answer) => answer.includes('='))) throw new Error('Structured HOTSPOT answers are missing');
console.log(JSON.stringify({ id: q.id, type: q.type, exhibit: q.media[0].src, answerAreas: q.answer_areas.map((area) => ({ id: area.id, optionCount: area.options.length, answer: area.answer })) }, null, 2));
