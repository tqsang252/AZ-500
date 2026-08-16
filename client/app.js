/*
 * AZ-500 Exam Practice — Vanilla JavaScript application.
 * Design rule: an Azure Operations Console with all dashboard controls backed
 * by one small localStorage state object. No framework or network service is used.
 */

(() => {
  "use strict";

  const STORAGE_KEY = "az500-exam-practice-v2";
  const QUESTION_SOURCES = ["./question_1.json", "./questions_1.json", "./questions.json"];
  const PASSING_SCORE = 70;
  const RING_CIRCUMFERENCE = 314.16;

  const state = { questions: [], currentIndex: 0, answers: {}, checked: {}, bookmarks: [], notes: {}, theme: "dark" };
  const exhibitView = { scale: 1, x: 0, y: 0, dragging: false, pointerX: 0, pointerY: 0 };

  const $ = (id) => document.getElementById(id);
  const elements = {
    root: document.documentElement,
    sidebar: $("sidebar"), sidebarToggle: $("sidebarToggle"), sidebarClose: $("sidebarClose"), sidebarBackdrop: $("sidebarBackdrop"),
    themeToggle: $("themeToggle"), themeIconButton: $("themeIconButton"), themeIcon: $("themeIcon"),
    questionSearch: $("questionSearch"), searchResults: $("searchResults"), randomButton: $("randomButton"), headerBookmarkButton: $("headerBookmarkButton"),
    questionPosition: $("questionPosition"), questionDomain: $("questionDomain"), questionNumber: $("questionNumber"), questionText: $("questionText"), questionMedia: $("questionMedia"),
    selectionHint: $("selectionHint"), answersForm: $("answersForm"), validationMessage: $("validationMessage"), checkState: $("checkState"),
    bookmarkButton: $("bookmarkButton"), checkButton: $("checkButton"), previousButton: $("previousButton"), nextButton: $("nextButton"),
    explanationCard: $("explanationCard"), completionLabel: $("completionLabel"), completionDetail: $("completionDetail"), completionProgressFill: $("completionProgressFill"),
    sideProgressPercent: $("sideProgressPercent"), ringPercent: $("ringPercent"), progressRingValue: $("progressRingValue"), sideAnsweredCount: $("sideAnsweredCount"), sideTotalCount: $("sideTotalCount"), questionGrid: $("questionGrid"), matrixCount: $("matrixCount"),
    correctCount: $("correctCount"), wrongCount: $("wrongCount"), bookmarkCount: $("bookmarkCount"), bookmarkMenuCount: $("bookmarkMenuCount"), wrongMenuCount: $("wrongMenuCount"),
    notesInput: $("notesInput"), notesSaveState: $("notesSaveState"), aiExplainButton: $("aiExplainButton"), aiAssistantStatus: $("aiAssistantStatus"), aiExplanationModal: $("aiExplanationModal"), aiModalContent: $("aiModalContent"), closeAiModalButton: $("closeAiModalButton"),
    exhibitViewer: $("exhibitViewer"), exhibitViewerStage: $("exhibitViewerStage"), exhibitViewerImage: $("exhibitViewerImage"), exhibitViewerCaption: $("exhibitViewerCaption"), closeExhibitViewer: $("closeExhibitViewer"), exhibitZoomIn: $("exhibitZoomIn"), exhibitZoomOut: $("exhibitZoomOut"), exhibitZoomReset: $("exhibitZoomReset"), exhibitZoomValue: $("exhibitZoomValue"),
    submitButton: $("submitButton"), resultModal: $("resultModal"), resultModalContent: $("resultModalContent"), closeModalButton: $("closeModalButton"),
    sideMenuItems: [...document.querySelectorAll(".side-menu__item")],
  };

  function restoreState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved || typeof saved !== "object") return;
      state.currentIndex = Number.isInteger(saved.currentIndex) ? saved.currentIndex : 0;
      state.answers = saved.answers && typeof saved.answers === "object" ? saved.answers : {};
      state.checked = saved.checked && typeof saved.checked === "object" ? saved.checked : {};
      state.bookmarks = Array.isArray(saved.bookmarks) ? saved.bookmarks.map(String) : [];
      state.notes = saved.notes && typeof saved.notes === "object" ? saved.notes : {};
      state.theme = saved.theme === "light" ? "light" : "dark";
    } catch (error) { console.warn("Không thể đọc tiến trình đã lưu.", error); }
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ currentIndex: state.currentIndex, answers: state.answers, checked: state.checked, bookmarks: state.bookmarks, notes: state.notes, theme: state.theme })); }
    catch (error) { console.warn("Không thể lưu tiến trình.", error); }
  }

  async function loadQuestions() {
    let lastError;
    for (const source of QUESTION_SOURCES) {
      try {
        const response = await fetch(source, { cache: "no-store" });
        if (!response.ok) throw new Error(`${source}: HTTP ${response.status}`);
        const payload = await response.json();
        if (!Array.isArray(payload) || !payload.length) throw new Error("Tệp JSON không có câu hỏi hợp lệ.");
        state.questions = payload.map(normalizeQuestion).filter(Boolean);
        if (!state.questions.length) throw new Error("Không có câu hỏi có thể hiển thị.");
        const requestedQuestion = new URLSearchParams(window.location.search).get("question");
        if (requestedQuestion) {
          const requestedIndex = state.questions.findIndex((question) => question.id === requestedQuestion);
          if (requestedIndex >= 0) state.currentIndex = requestedIndex;
        }
        sanitizeState();
        renderAll();
        return;
      } catch (error) { lastError = error; }
    }
    renderLoadError(lastError);
  }

  function normalizeQuestion(raw, index) {
    if (!raw?.question || !Array.isArray(raw.options) || !Array.isArray(raw.answer)) return null;
    const options = raw.options.map((value, optionIndex) => {
      const text = String(value ?? "").trim();
      const match = text.match(/^\s*([A-Z])(?:[.)\]:-]|\s)/i);
      return { text, code: match ? match[1].toUpperCase() : String.fromCharCode(65 + optionIndex) };
    });
    const answer = raw.answer.map((value) => String(value ?? "").trim().charAt(0).toUpperCase()).filter(Boolean);
    const type = raw.type === "hotspot" ? "hotspot" : raw.type === "multiple_choice" ? "multiple_choice" : raw.type === "visual_response" ? "visual_response" : "single_choice";
    const answerAreas = Array.isArray(raw.answer_areas) ? raw.answer_areas : [];
    const finalAnswer = type === "hotspot" ? (Array.isArray(raw.answer) ? raw.answer : []) : answer;
    return { id: String(raw.id ?? index + 1), type, interaction: String(raw.interaction ?? raw.type ?? "single_choice"), question: String(raw.question).trim(), options, answer: finalAnswer, answerAreas, explanation: String(raw.explanation ?? "No source explanation is available for this item."), reference: String(raw.reference ?? ""), references: Array.isArray(raw.references) ? raw.references : [], media: Array.isArray(raw.media) ? raw.media.filter((item) => item?.src) : [], aiExplanation: raw.AI_explanation && typeof raw.AI_explanation === "object" ? raw.AI_explanation : null, domain: String(raw.domain ?? "AZURE SECURITY"), source: raw.source ?? {} };
  }

  function sanitizeState() {
    const validIds = new Set(state.questions.map((question) => question.id));
    state.answers = Object.fromEntries(Object.entries(state.answers).filter(([id, answer]) => validIds.has(id) && Array.isArray(answer)));
    state.checked = Object.fromEntries(Object.entries(state.checked).filter(([id]) => validIds.has(id)));
    state.bookmarks = state.bookmarks.filter((id) => validIds.has(id));
    state.notes = Object.fromEntries(Object.entries(state.notes).filter(([id]) => validIds.has(id)));
    state.currentIndex = Math.min(Math.max(0, state.currentIndex), state.questions.length - 1);
    saveState();
  }

  function currentQuestion() { return state.questions[state.currentIndex]; }
  function selectedFor(question) { return state.answers[question.id] || []; }
  function isCorrect(question, answers = selectedFor(question)) { if (!question.answer.length) return false; const expected = [...question.answer].sort(); const actual = [...answers].sort(); return expected.length === actual.length && expected.every((value, index) => value === actual[index]); }
  function stripOptionPrefix(text) { return text.replace(/^\s*[A-Z](?:[.)\]:-]|\s)\s*/i, ""); }

  function renderAll() { applyTheme(); renderQuestion(); renderProgressAndStats(); }

  function renderQuestion() {
    const question = currentQuestion();
    if (!question) return;
    const selected = selectedFor(question);
    const checked = Boolean(state.checked[question.id]);
    const correct = checked && isCorrect(question, selected);
    const visualResponse = question.type === "visual_response";
    const bookmarked = state.bookmarks.includes(question.id);

    elements.questionPosition.textContent = `Question ${state.currentIndex + 1} / ${state.questions.length}`;
    elements.questionDomain.textContent = question.domain.toUpperCase();
    elements.questionNumber.textContent = `QUESTION ${String(state.currentIndex + 1).padStart(2, "0")}`;
    elements.questionText.textContent = question.question;
    elements.selectionHint.textContent = question.answerAreas.length ? "Select the appropriate option in each answer area. You can change either selection before checking." : question.type === "multiple_choice" ? "Select all correct answers." : question.type === "visual_response" ? "Review the exhibit before opening the guided explanation." : "Select one best answer.";
    elements.checkState.className = "check-state";
    elements.checkState.textContent = checked ? (visualResponse ? "◉ Source reviewed" : correct ? "✓ Correct" : "× Review required") : "Unverified";
    if (checked && !visualResponse) elements.checkState.classList.add(correct ? "is-correct" : "is-incorrect");

    elements.bookmarkButton.classList.toggle("is-bookmarked", bookmarked);
    elements.bookmarkButton.setAttribute("aria-pressed", String(bookmarked));
    elements.bookmarkButton.innerHTML = `<span class="bookmark-icon" aria-hidden="true">⌑</span>${bookmarked ? "Remove bookmark" : "Bookmark this"}`;
    elements.headerBookmarkButton.classList.toggle("is-active", bookmarked);
    elements.headerBookmarkButton.setAttribute("aria-pressed", String(bookmarked));
    elements.checkButton.textContent = visualResponse && !question.answerAreas.length ? "Review Source" : "Check Answer";
    elements.previousButton.disabled = state.currentIndex === 0;
    elements.nextButton.disabled = state.currentIndex === state.questions.length - 1;
    elements.validationMessage.textContent = "";

    renderQuestionMedia(question);
    const fragment = document.createDocumentFragment();
    if (question.answerAreas.length) {
      renderAnswerAreas(question, selected, checked, fragment);
    } else question.options.forEach((option) => {
      const label = document.createElement("label");
      const input = document.createElement("input");
      const control = document.createElement("span");
      const text = document.createElement("span");
      const code = document.createElement("span");
      label.className = `answer-option ${question.type === "multiple_choice" ? "answer-option--multiple" : ""}`;
      input.type = question.type === "multiple_choice" ? "checkbox" : "radio";
      input.name = `question-${question.id}`;
      input.value = option.code;
      input.checked = selected.includes(option.code);
      input.setAttribute("aria-label", option.text);
      control.className = "answer-option__control";
      text.className = "answer-option__text";
      code.className = "answer-option__code";
      code.textContent = `${option.code}.`;
      text.append(code, document.createTextNode(` ${stripOptionPrefix(option.text)}`));
      if (checked && question.answer.includes(option.code)) label.classList.add("answer-option--correct");
      if (checked && selected.includes(option.code) && !question.answer.includes(option.code)) label.classList.add("answer-option--wrong");
      input.addEventListener("change", () => selectAnswer(question));
      label.append(input, control, text);
      fragment.append(label);
    });
    elements.answersForm.replaceChildren(fragment);
    renderQuestionMatrix();
    renderExplanation(question, checked, correct);
    renderNotes(question);
    renderAiAssistant(question, checked, correct);
  }

  function renderAnswerAreas(question, selected, checked, fragment) {
    const wrapper = document.createElement("div");
    wrapper.className = "answer-areas";
    const heading = document.createElement("p");
    heading.className = "answer-areas__heading";
    heading.textContent = "ANSWER AREA — SELECT AND EDIT YOUR RESPONSE";
    wrapper.append(heading);
    question.answerAreas.forEach((area) => {
      const row = document.createElement("label");
      const title = document.createElement("span");
      const select = document.createElement("select");
      const encoded = selected.find((value) => value.startsWith(`${area.id}=`));
      const currentValue = encoded ? encoded.slice(area.id.length + 1) : "";
      row.className = "answer-area-row";
      title.className = "answer-area-row__label";
      title.textContent = area.label;
      select.className = "answer-area-row__select";
      select.dataset.answerArea = area.id;
      select.disabled = false;
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "Select an option...";
      select.append(placeholder);
      area.options.forEach((value) => { const option = document.createElement("option"); option.value = value; option.textContent = value; option.selected = value === currentValue; select.append(option); });
      if (checked && currentValue) select.classList.add(currentValue === area.answer ? "is-correct" : "is-wrong");
      select.addEventListener("change", () => selectAnswer(question));
      row.append(title, select);
      wrapper.append(row);
    });
    fragment.append(wrapper);
  }

  function renderQuestionMedia(question) {
    elements.questionMedia.replaceChildren();
    if (!question.media.length) return;
    const label = document.createElement("p");
    label.className = "question-media__label";
    label.textContent = question.interaction === "hotspot" || question.interaction === "drag_drop" ? "SOURCE EXHIBIT — REVIEW BEFORE ANSWERING" : "SOURCE EXHIBIT";
    elements.questionMedia.append(label);
    question.media.forEach((media, index) => {
      const figure = document.createElement("figure");
      const image = document.createElement("img");
      const caption = document.createElement("figcaption");
      figure.className = "question-media__figure";
      figure.tabIndex = 0;
      figure.setAttribute("role", "button");
      figure.setAttribute("aria-label", `Open ${media.caption || "source exhibit"} in viewer`);
      figure.addEventListener("click", () => openExhibitViewer(media));
      figure.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openExhibitViewer(media); } });
      image.src = media.src;
      image.alt = media.alt || `Source exhibit ${index + 1}`;
      image.loading = "lazy";
      caption.textContent = media.caption || `Source exhibit ${index + 1}`;
      figure.append(image, caption);
      elements.questionMedia.append(figure);
    });
  }

  function openExhibitViewer(media) {
    elements.exhibitViewerImage.src = media.src;
    elements.exhibitViewerImage.alt = media.alt || "Source exhibit";
    elements.exhibitViewerCaption.textContent = media.caption || "Source exhibit";
    resetExhibitView();
    elements.exhibitViewer.showModal();
  }

  function updateExhibitTransform() {
    elements.exhibitViewerImage.style.transform = `translate3d(${exhibitView.x}px, ${exhibitView.y}px, 0) scale(${exhibitView.scale})`;
    elements.exhibitZoomValue.textContent = `${Math.round(exhibitView.scale * 100)}%`;
  }

  function resetExhibitView() { exhibitView.scale = 1; exhibitView.x = 0; exhibitView.y = 0; updateExhibitTransform(); }
  function zoomExhibit(amount) { exhibitView.scale = Math.min(4, Math.max(0.5, Number((exhibitView.scale + amount).toFixed(2)))); updateExhibitTransform(); }

  function renderQuestionMatrix() {
    const fragment = document.createDocumentFragment();
    state.questions.forEach((question, index) => {
      const button = document.createElement("button");
      const answered = selectedFor(question).length > 0;
      const marked = state.bookmarks.includes(question.id);
      button.type = "button";
      button.className = "question-nav-button";
      button.textContent = String(index + 1);
      button.setAttribute("role", "listitem");
      button.setAttribute("aria-label", `Question ${index + 1}${answered ? ", answered" : ", not answered"}${marked ? ", marked" : ""}${index === state.currentIndex ? ", current" : ""}`);
      if (answered) button.classList.add("is-answered");
      if (marked) button.classList.add("is-bookmarked");
      if (index === state.currentIndex) button.classList.add("is-current");
      button.addEventListener("click", () => goToQuestion(index));
      fragment.append(button);
    });
    elements.questionGrid.replaceChildren(fragment);
    elements.matrixCount.textContent = String(state.questions.length);
  }

  function selectAnswer(question) {
    const optionAnswers = [...elements.answersForm.querySelectorAll("input:checked")].map((input) => input.value);
    const areaAnswers = [...elements.answersForm.querySelectorAll("select[data-answer-area]")].filter((select) => select.value).map((select) => `${select.dataset.answerArea}=${select.value}`);
    state.answers[question.id] = [...optionAnswers, ...areaAnswers];
    delete state.checked[question.id];
    saveState();
    renderAll();
  }

  function renderExplanation(question, checked, correct) {
    if (!checked) {
      elements.explanationCard.innerHTML = `<div class="explanation-empty"><div class="explanation-empty__symbol" aria-hidden="true">?</div><span class="eyebrow">Answer & explanation</span><h2>Ready to verify?</h2><p>Select an answer, then choose <strong>Check Answer</strong> to open the rationale and reference.</p></div>`;
      return;
    }
    if (question.type === "visual_response" && !question.answerAreas.length) {
      const reference = safeUrl(question.reference);
      elements.explanationCard.innerHTML = `<div class="explanation-head"><div><span class="eyebrow">Source response</span><h2 class="explanation-title">Exhibit review</h2></div><span class="result-badge result-badge--correct">● Reviewed</span></div><div class="correct-answer-row"><span aria-hidden="true">i</span>Use the exhibit and the source rationale together.</div><p class="explanation-copy">${escapeHtml(question.explanation)}</p>${reference ? `<a class="reference-link" href="${reference}" target="_blank" rel="noopener noreferrer">↗ Open reference</a>` : ""}`;
      return;
    }
    const reference = safeUrl(question.reference);
    const answerText = question.answerAreas.length ? question.answerAreas.map((area) => `${area.label}: ${area.answer}`).join(" | ") : question.answer.join(", ");
    elements.explanationCard.innerHTML = `<div class="explanation-head"><div><span class="eyebrow">Answer & explanation</span><h2 class="explanation-title">Answer result</h2></div><span class="result-badge ${correct ? "result-badge--correct" : "result-badge--wrong"}">${correct ? "✓ Correct" : "× Incorrect"}</span></div><div class="correct-answer-row"><span aria-hidden="true">✓</span>Correct answer: ${escapeHtml(answerText)}</div><p class="explanation-copy">${escapeHtml(question.explanation)}</p>${reference ? `<a class="reference-link" href="${reference}" target="_blank" rel="noopener noreferrer">↗ Open reference</a>` : ""}`;
  }

  function renderProgressAndStats() {
    const total = state.questions.length;
    const answered = state.questions.filter((question) => selectedFor(question).length).length;
    const correct = state.questions.filter((question) => state.checked[question.id] && isCorrect(question)).length;
    const wrong = state.questions.filter((question) => state.checked[question.id] && selectedFor(question).length && !isCorrect(question)).length;
    const percent = total ? Math.round((answered / total) * 100) : 0;
    elements.completionLabel.textContent = `${answered} / ${total}`;
    elements.completionDetail.textContent = `(${percent}%)`;
    elements.completionProgressFill.style.width = `${percent}%`;
    elements.sideProgressPercent.textContent = `${percent}%`;
    elements.ringPercent.textContent = `${percent}%`;
    elements.progressRingValue.style.strokeDashoffset = String(RING_CIRCUMFERENCE - (RING_CIRCUMFERENCE * percent) / 100);
    elements.sideAnsweredCount.textContent = String(answered);
    elements.sideTotalCount.textContent = String(total);
    elements.correctCount.textContent = String(correct);
    elements.wrongCount.textContent = String(wrong);
    elements.bookmarkCount.textContent = String(state.bookmarks.length);
    elements.bookmarkMenuCount.textContent = String(state.bookmarks.length);
    elements.wrongMenuCount.textContent = String(wrong);
  }

  function renderNotes(question) {
    elements.notesInput.value = state.notes[question.id] || "";
    elements.notesSaveState.textContent = state.notes[question.id] ? "Saved locally" : "Ready for notes";
  }

  function createAssistantBubble(message, question = false) { const bubble = document.createElement("div"); bubble.className = `assistant-bubble${question ? " assistant-bubble--question" : ""}`; bubble.textContent = message; return bubble; }
  function renderAiAssistant(question, checked, correct) { const source = question.aiExplanation ? "Source rationale interpreted" : "Source rationale available"; const visual = question.media.length ? " · exhibit included" : ""; elements.aiAssistantStatus.textContent = checked ? `${correct ? "Answer verified" : "Review mode"} · ${source}${visual}` : `${source}${visual}`; }
  function showAssistantNotice(message) { elements.aiAssistantStatus.textContent = message; }

  function checkCurrentAnswer() {
    const question = currentQuestion();
    // A single-choice question needs one selected option, not one per option.
    // HOTSPOT answer areas are different: every area must be completed.
    const requiredAnswerCount = question.answerAreas.length
      ? question.answerAreas.length
      : question.options.length
        ? 1
        : 0;
    if (selectedFor(question).length < requiredAnswerCount) {
      elements.validationMessage.textContent = question.answerAreas.length
        ? "Select an option in every answer area before checking."
        : "Select at least one answer before verification.";
      return;
    }
    state.checked[question.id] = true;
    saveState();
    renderAll();
  }

  function toggleBookmark() { const id = currentQuestion().id; const position = state.bookmarks.indexOf(id); if (position >= 0) state.bookmarks.splice(position, 1); else state.bookmarks.push(id); saveState(); renderAll(); }
  function goToQuestion(index) { if (index < 0 || index >= state.questions.length) return; state.currentIndex = index; saveState(); renderAll(); closeSidebar(); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function goToRandomQuestion() { if (state.questions.length < 2) return; let index = state.currentIndex; while (index === state.currentIndex) index = Math.floor(Math.random() * state.questions.length); goToQuestion(index); }

  function applyTheme() { elements.root.dataset.theme = state.theme; elements.themeToggle.checked = state.theme === "dark"; elements.themeIcon.textContent = state.theme === "dark" ? "☼" : "☾"; document.querySelector('meta[name="theme-color"]').setAttribute("content", state.theme === "dark" ? "#081321" : "#eef5fc"); }
  function toggleTheme() { state.theme = state.theme === "dark" ? "light" : "dark"; saveState(); applyTheme(); }

  function renderSearchResults(value) {
    const query = value.trim().toLocaleLowerCase();
    if (!query) { elements.searchResults.hidden = true; elements.searchResults.replaceChildren(); return; }
    const matches = state.questions.map((question, index) => ({ question, index })).filter(({ question }) => `${question.question} ${question.domain}`.toLocaleLowerCase().includes(query)).slice(0, 6);
    const fragment = document.createDocumentFragment();
    if (!matches.length) { const empty = document.createElement("p"); empty.className = "search-results__empty"; empty.textContent = "Không tìm thấy câu hỏi phù hợp."; fragment.append(empty); }
    matches.forEach(({ question, index }) => { const button = document.createElement("button"); const number = document.createElement("span"); const text = document.createElement("span"); button.type = "button"; button.className = "search-result-item"; number.className = "search-result-item__number"; text.className = "search-result-item__text"; number.textContent = `Q${index + 1}`; text.textContent = question.question; button.append(number, text); button.addEventListener("click", () => { elements.questionSearch.value = ""; renderSearchResults(""); goToQuestion(index); }); fragment.append(button); });
    elements.searchResults.replaceChildren(fragment); elements.searchResults.hidden = false;
  }

  function selectMenuView(view) {
    elements.sideMenuItems.forEach((item) => item.classList.toggle("is-active", item.dataset.view === view));
    if (view === "bookmarks") { const index = state.questions.findIndex((question) => state.bookmarks.includes(question.id)); return index >= 0 ? goToQuestion(index) : showAssistantNotice("No bookmarked question is available. Mark a question to review it here."); }
    if (view === "wrong") { const index = state.questions.findIndex((question) => state.checked[question.id] && !isCorrect(question)); return index >= 0 ? goToQuestion(index) : showAssistantNotice("No verified incorrect answer is available."); }
    if (view === "search") return elements.questionSearch.focus();
    if (view === "statistics") return submitExam();
    if (view === "settings") { toggleTheme(); showAssistantNotice("Theme updated. Use the Dark Mode control at the bottom of the sidebar to switch again."); }
  }

  function saveCurrentNote() { state.notes[currentQuestion().id] = elements.notesInput.value; saveState(); elements.notesSaveState.textContent = "Saved locally"; }

  function openAiExplanation() {
    const question = currentQuestion();
    const ai = question.aiExplanation || { heading: "How to reason through this question", overview: question.explanation, reasoning_steps: ["Identify the requested Azure control.", "Compare each option against the stated requirement."], exam_tip: "Use the source rationale to validate your final choice.", caution: "Some visual-response items require the source exhibit for full context." };
    const steps = Array.isArray(ai.reasoning_steps) && ai.reasoning_steps.length ? ai.reasoning_steps : [question.explanation];
    const reference = safeUrl(question.reference);
    const sourcePages = question.source?.pdf_page_start ? `PDF source: pages ${question.source.pdf_page_start}${question.source.pdf_page_end && question.source.pdf_page_end !== question.source.pdf_page_start ? `–${question.source.pdf_page_end}` : ""}` : "PDF source item";
    elements.aiModalContent.innerHTML = `<section class="ai-brief-hero"><span class="ai-brief-hero__mark" aria-hidden="true">✦</span><div><span class="eyebrow">${escapeHtml(question.domain)}</span><h3>${escapeHtml(ai.heading || "Question explanation")}</h3><p>${escapeHtml(ai.overview || question.explanation)}</p></div></section><section class="ai-brief-section"><span class="eyebrow">Reasoning path</span><ol>${steps.slice(0, 5).map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol></section><section class="ai-brief-tip"><span aria-hidden="true">◆</span><div><strong>Exam signal</strong><p>${escapeHtml(ai.exam_tip || "Match each requirement to the most direct Azure security control.")}</p></div></section><section class="ai-brief-caution"><span class="eyebrow">Review note</span><p>${escapeHtml(ai.caution || "Use the exhibit and source rationale together before making your final selection.")}</p></section><footer class="ai-brief-footer"><span>${escapeHtml(sourcePages)}</span>${reference ? `<a href="${reference}" target="_blank" rel="noopener noreferrer">Open official reference ↗</a>` : ""}</footer>`;
    elements.aiExplanationModal.showModal();
  }

  function buildResults() {
    const items = state.questions.map((question, index) => ({ question, index, answered: selectedFor(question).length > 0, correct: selectedFor(question).length > 0 && isCorrect(question) }));
    const correctCount = items.filter((item) => item.correct).length;
    const wrongCount = items.filter((item) => item.answered && !item.correct).length;
    const unansweredCount = items.filter((item) => !item.answered).length;
    const score = state.questions.length ? Math.round((correctCount / state.questions.length) * 100) : 0;
    return { items, correctCount, wrongCount, unansweredCount, score, passed: score >= PASSING_SCORE };
  }

  function submitExam() {
    const result = buildResults();
    const review = result.items.filter((item) => !item.correct);
    const outcome = result.passed ? "PASS" : "NOT YET";
    elements.resultModalContent.innerHTML = `<section class="result-summary"><img class="result-illustration" src="./assets/ui/az500-result-medallion_ae708962.webp" alt="" width="94" height="94"><div><span class="eyebrow">Practice result</span><h2 id="resultTitle">${outcome}</h2><p>${result.passed ? "You reached the 70% target." : "You are below the 70% target. Review the flagged questions below."}</p></div></section><section class="result-card"><div class="result-card__score"><div><span class="result-score-label">Score</span><strong class="result-score-number ${result.passed ? "score-pass" : "score-fail"}">${result.score}%</strong></div><span class="pass-state ${result.passed ? "pass-state--pass" : "pass-state--fail"}">${outcome} · Target ≥ ${PASSING_SCORE}%</span></div><div class="result-metrics"><div class="metric metric--correct"><strong>${result.correctCount}</strong><span>Correct</span></div><div class="metric metric--wrong"><strong>${result.wrongCount}</strong><span>Wrong</span></div><div class="metric metric--unanswered"><strong>${result.unansweredCount}</strong><span>Unanswered</span></div></div></section><section class="result-review"><div class="result-review__heading"><h3>Review queue</h3><span>${review.length} questions</span></div><div class="review-list" id="reviewList"></div></section><div class="result-modal__actions"><button class="button button--primary" id="continueReviewButton" type="button">Continue review</button></div>`;
    const list = $("reviewList");
    if (!review.length) list.innerHTML = '<p class="empty-review">✓ No questions are waiting for review.</p>';
    review.forEach((item) => { const button = document.createElement("button"); button.type = "button"; button.className = "review-item"; button.innerHTML = `<span class="review-item__heading"><span class="review-item__number">QUESTION ${String(item.index + 1).padStart(2, "0")}</span><span class="review-item__state ${item.answered ? "" : "review-item__state--unanswered"}">${item.answered ? "Incorrect" : "Unanswered"}</span></span><p>${escapeHtml(item.question.question)}</p>`; button.addEventListener("click", () => { elements.resultModal.close(); goToQuestion(item.index); }); list.append(button); });
    $("continueReviewButton").addEventListener("click", () => elements.resultModal.close());
    elements.resultModal.showModal();
  }

  function safeUrl(value) { try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.href : ""; } catch { return ""; } }
  function escapeHtml(value) { return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;").replaceAll("\n", "<br>"); }
  function renderLoadError(error) { elements.questionText.textContent = "Question data could not be loaded."; elements.selectionHint.textContent = `Check question_1.json. ${error instanceof Error ? error.message : ""}`; elements.checkButton.disabled = true; elements.submitButton.disabled = true; }
  function openSidebar() { elements.sidebar.classList.add("is-open"); elements.sidebarToggle.setAttribute("aria-expanded", "true"); elements.sidebarBackdrop.hidden = false; }
  function closeSidebar() { elements.sidebar.classList.remove("is-open"); elements.sidebarToggle.setAttribute("aria-expanded", "false"); elements.sidebarBackdrop.hidden = true; }

  function bindEvents() {
    elements.themeToggle.addEventListener("change", toggleTheme); elements.themeIconButton.addEventListener("click", toggleTheme); elements.randomButton.addEventListener("click", goToRandomQuestion); elements.headerBookmarkButton.addEventListener("click", toggleBookmark);
    elements.bookmarkButton.addEventListener("click", toggleBookmark); elements.checkButton.addEventListener("click", checkCurrentAnswer); elements.previousButton.addEventListener("click", () => goToQuestion(state.currentIndex - 1)); elements.nextButton.addEventListener("click", () => goToQuestion(state.currentIndex + 1)); elements.submitButton.addEventListener("click", submitExam); elements.closeModalButton.addEventListener("click", () => elements.resultModal.close());
    elements.sidebarToggle.addEventListener("click", openSidebar); elements.sidebarClose.addEventListener("click", closeSidebar); elements.sidebarBackdrop.addEventListener("click", closeSidebar);
    elements.questionSearch.addEventListener("input", (event) => renderSearchResults(event.target.value)); elements.questionSearch.addEventListener("keydown", (event) => { if (event.key === "Escape") renderSearchResults(""); if (event.key === "Enter") elements.searchResults.querySelector("button")?.click(); });
    elements.sideMenuItems.forEach((item) => item.addEventListener("click", () => selectMenuView(item.dataset.view)));
    elements.notesInput.addEventListener("input", saveCurrentNote); elements.aiExplainButton.addEventListener("click", openAiExplanation); elements.closeAiModalButton.addEventListener("click", () => elements.aiExplanationModal.close());
    elements.closeExhibitViewer.addEventListener("click", () => elements.exhibitViewer.close());
    elements.exhibitZoomIn.addEventListener("click", () => zoomExhibit(0.25)); elements.exhibitZoomOut.addEventListener("click", () => zoomExhibit(-0.25)); elements.exhibitZoomReset.addEventListener("click", resetExhibitView);
    elements.exhibitViewerStage.addEventListener("wheel", (event) => { event.preventDefault(); zoomExhibit(event.deltaY < 0 ? 0.2 : -0.2); }, { passive: false });
    elements.exhibitViewerStage.addEventListener("pointerdown", (event) => { exhibitView.dragging = true; exhibitView.pointerX = event.clientX; exhibitView.pointerY = event.clientY; elements.exhibitViewerStage.setPointerCapture(event.pointerId); });
    elements.exhibitViewerStage.addEventListener("pointermove", (event) => { if (!exhibitView.dragging) return; exhibitView.x += event.clientX - exhibitView.pointerX; exhibitView.y += event.clientY - exhibitView.pointerY; exhibitView.pointerX = event.clientX; exhibitView.pointerY = event.clientY; updateExhibitTransform(); });
    ["pointerup", "pointercancel"].forEach((eventName) => elements.exhibitViewerStage.addEventListener(eventName, (event) => { exhibitView.dragging = false; if (elements.exhibitViewerStage.hasPointerCapture(event.pointerId)) elements.exhibitViewerStage.releasePointerCapture(event.pointerId); }));
    elements.exhibitViewer.addEventListener("click", (event) => { if (event.target === elements.exhibitViewer) elements.exhibitViewer.close(); });
    window.addEventListener("keydown", (event) => { if (event.key === "Escape") { closeSidebar(); if (elements.exhibitViewer.open) elements.exhibitViewer.close(); } if (elements.exhibitViewer.open && ["+", "="].includes(event.key)) zoomExhibit(0.25); if (elements.exhibitViewer.open && event.key === "-") zoomExhibit(-0.25); if (elements.exhibitViewer.open && event.key === "0") resetExhibitView(); if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); elements.questionSearch.focus(); } });
  }

  restoreState(); bindEvents(); applyTheme(); loadQuestions();
})();
