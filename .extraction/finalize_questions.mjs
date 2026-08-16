import fs from "node:fs";

const projectRoot = "/home/ubuntu/az500-exam-practice";
const draft = JSON.parse(fs.readFileSync(`${projectRoot}/.extraction/questions_draft.json`, "utf8"));
const uploadLog = `${fs.readFileSync(`${projectRoot}/.extraction/image_urls.txt`, "utf8")}\n${fs.readFileSync(`${projectRoot}/.extraction/additional_image_urls.txt`, "utf8")}`;
const urls = new Map();

for (const match of uploadLog.matchAll(/\[SUCCESS\].*?page-(\d+)\.jpg\s+->\s+(\/manus-storage\/[^\s]+)/g)) {
  urls.set(Number(match[1]), match[2]);
}

function makeAiExplanation(question, visualOnly) {
  const summary = question.ai_explanation.summary;
  const points = question.ai_explanation.key_points.length
    ? question.ai_explanation.key_points
    : ["Use the stated requirement to distinguish the Azure control from similar-looking options."];
  const answerHint = visualOnly
    ? "The source item is a visual response. Review the marked answer area in the exhibit together with the explanation."
    : question.answer.length
    ? `The source answer key identifies ${question.answer.join(" and ")} as the required selection${question.answer.length > 1 ? "s" : ""}.`
    : "This visual-response item is best reviewed against the exhibit and the official rationale.";
  return {
    heading: visualOnly ? "How to evaluate this visual response" : question.ai_explanation.title,
    overview: summary,
    reasoning_steps: [answerHint, ...points].slice(0, 4),
    exam_tip: question.ai_explanation.exam_tip,
    caution: question.media.length ? "Use the exhibit together with the explanation; labels or answer areas in the source image can contain required context." : "Answer only what the requirement asks for; avoid selecting related controls that do not satisfy the stated condition.",
  };
}

const finalQuestions = draft.map((question) => {
  const sourcePages = question.media.length
    ? question.media.flatMap((item) => item.pages)
    : question.options.length === 0 ? [question.source.pdf_page_start] : [];
  const media = sourcePages
    .map((page) => ({
      type: "image",
      src: urls.get(page) || "",
      alt: `Source exhibit for question ${question.id}, PDF page ${page}`,
      caption: `Source exhibit — PDF page ${page}`,
    }))
    .filter((item) => item.src);
  const visualOnly = question.options.length === 0 && media.length > 0;
  const normalizedType = question.type === "hotspot" || question.type === "drag_drop" || visualOnly ? "visual_response" : question.type;
  return {
    id: question.id,
    type: normalizedType,
    interaction: question.type,
    question: question.question,
    options: question.options,
    answer: visualOnly ? [] : question.answer,
    explanation: question.explanation,
    reference: question.reference,
    references: question.references,
    media,
    source: question.source,
    AI_explanation: makeAiExplanation(question, visualOnly),
  };
});

const report = {
  total_questions: finalQuestions.length,
  questions_with_images: finalQuestions.filter((question) => question.media.length).length,
  image_assets_mapped: finalQuestions.reduce((count, question) => count + question.media.length, 0),
  questions_without_options: finalQuestions.filter((question) => !question.options.length).length,
  questions_without_answer_key: finalQuestions.filter((question) => !question.answer.length).length,
  unmapped_visual_pages: [...new Set(draft.flatMap((question) => question.media.flatMap((item) => item.pages)))].filter((page) => !urls.has(page)),
};

const destination = `${projectRoot}/client/public/question_1.json`;
fs.writeFileSync(destination, `${JSON.stringify(finalQuestions, null, 2)}\n`);
fs.writeFileSync(`${projectRoot}/.extraction/finalize_report.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
