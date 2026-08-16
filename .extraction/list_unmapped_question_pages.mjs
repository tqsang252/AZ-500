import fs from "node:fs";

const root = "/home/ubuntu/az500-exam-practice/.extraction";
const questions = JSON.parse(fs.readFileSync(`${root}/questions_draft.json`, "utf8"));
const pages = [...new Set(
  questions
    .filter((question) => question.options.length === 0 && question.media.length === 0)
    .map((question) => question.source.pdf_page_start),
)].sort((a, b) => a - b);

fs.writeFileSync(`${root}/additional_exhibit_pages.txt`, `${pages.join(" ")}\n`);
console.log(JSON.stringify({ questions_without_options_and_without_marked_media: questions.filter((question) => question.options.length === 0 && question.media.length === 0).length, pages }, null, 2));
