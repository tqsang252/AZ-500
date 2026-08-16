import fs from "node:fs";
import path from "node:path";

const sourcePath = "/home/ubuntu/az500-exam-practice/.extraction/az-500-layout.txt";
const outputDirectory = "/home/ubuntu/az500-exam-practice/.extraction";
const raw = fs.readFileSync(sourcePath, "utf8").replace(/\r/g, "");
const pages = raw.split("\f");

function normalizeLines(value) {
  return value
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .replace(/-\n(?=[a-z])/g, "")
    .replace(/\n(?=[a-z])/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function optionFromBlock(block) {
  const lines = block.split("\n");
  const options = [];
  let active = null;
  for (const rawLine of lines) {
    const line = rawLine.replace(/[ \t]+/g, " ").trim();
    const match = line.match(/^([A-Z])\.\s+(.+)/);
    if (match) {
      active = { code: match[1], text: `${match[1]}. ${match[2]}` };
      options.push(active);
      continue;
    }
    if (!active || !line || /^(Answer|Explanation|Reference|References)\s*:/i.test(line)) continue;
    if (/^(Question:\s*\d+|Exam Heist|HOTSPOT|DRAG DROP|Select and Place|Hot Area)/i.test(line)) continue;
    active.text += ` ${line}`;
  }
  return options;
}

function findSection(block, startPattern, endPattern) {
  const start = block.search(startPattern);
  if (start < 0) return "";
  const afterStart = block.slice(start).replace(startPattern, "");
  const end = afterStart.search(endPattern);
  return normalizeLines(end < 0 ? afterStart : afterStart.slice(0, end));
}

function getPageForOffset(offset) {
  let runningOffset = 0;
  for (let index = 0; index < pages.length; index += 1) {
    runningOffset += pages[index].length + 1;
    if (offset < runningOffset) return Math.max(1, index + 1);
  }
  return pages.length;
}

function conciseSentences(text, max = 3) {
  const sentences = normalizeLines(text)
    .replace(/\n/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 25);
  return sentences.slice(0, max);
}

function isVisualQuestion(block) {
  return /\b(HOTSPOT|HOT AREA|DRAG DROP|SELECT AND PLACE|answer area|hot area|click the appropriate|graphic|diagram|exhibit|shown in the following)\b/i.test(block);
}

const starts = [...raw.matchAll(/Question:\s*(\d+)\s+Exam Heist/g)];
const questions = [];

for (let index = 0; index < starts.length; index += 1) {
  const match = starts[index];
  const id = Number(match[1]);
  const start = match.index + match[0].length;
  const end = index < starts.length - 1 ? starts[index + 1].index : raw.length;
  const block = raw.slice(start, end);
  const answerMatch = block.match(/(?:^|\n)\s*Answer:\s*([^\n]*)/i);
  const answerRaw = answerMatch ? answerMatch[1].trim() : "";
  const answer = [...answerRaw.matchAll(/[A-Z]/g)].map((item) => item[0]);
  const answerAt = answerMatch ? answerMatch.index : block.length;
  const beforeAnswer = block.slice(0, answerAt);
  const options = optionFromBlock(beforeAnswer);
  const firstOption = beforeAnswer.search(/(?:^|\n)\s*A\.\s+/);
  const promptText = normalizeLines(firstOption >= 0 ? beforeAnswer.slice(0, firstOption) : beforeAnswer)
    .replace(/^(HOTSPOT\s*-|DRAG DROP\s*-)/i, "$1\n")
    .replace(/^(?:Hot Area|Select and Place):?\s*$/gim, "")
    .trim();
  const explanation = findSection(block, /(?:^|\n)\s*Explanation:\s*/i, /(?:^|\n)\s*(?:Reference|References)\s*:/i);
  const referenceSection = findSection(block, /(?:^|\n)\s*(?:Reference|References)\s*:\s*/i, /(?:^|\n)\s*Question:\s*\d+/i);
  const references = [...referenceSection.matchAll(/https?:\/\/[^\s]+/g)].map((item) => item[0].replace(/-\n/g, ""));
  const sourcePage = getPageForOffset(match.index);
  const nextPage = index < starts.length - 1 ? getPageForOffset(starts[index + 1].index) : pages.length;
  const visual = isVisualQuestion(block);
  const sentences = conciseSentences(explanation);
  const questionType = /DRAG DROP/i.test(promptText) ? "drag_drop" : /HOTSPOT|HOT AREA/i.test(promptText) ? "hotspot" : answer.length > 1 ? "multiple_choice" : "single_choice";

  questions.push({
    id,
    type: questionType,
    question: promptText,
    options: options.map((option) => option.text),
    answer,
    explanation,
    reference: references[0] || "",
    references,
    source: { pdf_page_start: sourcePage, pdf_page_end: Math.max(sourcePage, nextPage - 1) },
    media: visual ? [{ kind: "pdf_page", pages: Array.from({ length: Math.max(1, Math.min(3, nextPage - sourcePage)) }, (_, pageIndex) => sourcePage + pageIndex) }] : [],
    ai_explanation: {
      title: answer.length ? `Why ${answer.join(" and ")} is correct` : "How to approach this item",
      summary: sentences[0] || "Review the requirement and match it to the Azure control described in the answer.",
      key_points: sentences.slice(1),
      exam_tip: answer.length > 1 ? "This is a multi-select item. Verify every selected action against the stated requirement." : "Focus on the exact requirement and eliminate options that add unrelated scope or privilege.",
    },
  });
}

const visualPages = [...new Set(questions.flatMap((question) => question.media.flatMap((media) => media.pages)))].sort((a, b) => a - b);
const report = {
  expected_questions: 512,
  parsed_questions: questions.length,
  first_id: questions[0]?.id ?? null,
  last_id: questions.at(-1)?.id ?? null,
  questions_without_options: questions.filter((question) => question.options.length === 0).map((question) => question.id),
  questions_without_answers: questions.filter((question) => question.answer.length === 0).map((question) => question.id),
  visual_questions: questions.filter((question) => question.media.length).map((question) => ({ id: question.id, type: question.type, pages: question.media[0].pages })),
  visual_pages: visualPages,
};

fs.writeFileSync(path.join(outputDirectory, "questions_draft.json"), `${JSON.stringify(questions, null, 2)}\n`);
fs.writeFileSync(path.join(outputDirectory, "parse_report.json"), `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(path.join(outputDirectory, "visual_pages.txt"), `${visualPages.join(" ")}\n`);
console.log(JSON.stringify(report, null, 2));
