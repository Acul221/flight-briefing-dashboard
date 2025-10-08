// src/utils/parseRawQuestion.js
// v3.2 — parser blok teks: lettered + bullets + ✓/✗ + multi-line + fallback header

export function parseRawQuestion(raw) {
  const norm = (s) => (s ?? "").replace(/\r/g, "");
  const lines = norm(raw)
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const mapAns = { A: 0, B: 1, C: 2, D: 3 };
  const init4 = () => ["", "", "", ""];
  const out = {
    id: "",
    question: "",
    answers: init4(),
    explanations: init4(),
    correctIndex: null,
    level: "medium",
    source: "",
    category: "",
    subcategory: "",
    tags: "",
  };

  const isHeader = (s) =>
    /^(ID|Question|Source|Level|Category|Sub\s*Category|Tags|Correct)\s*:/i.test(s);
  const isChoiceLettered = (s) => /^[ABCD]\s*[:\.\)]\s+/.test(s);
  const isBullet = (s) => /^[-*•]\s+/.test(s);

  const takeSimple = (key, label) => {
    const i = lines.findIndex((l) => l.toLowerCase().startsWith(label.toLowerCase()));
    if (i >= 0) out[key] = lines[i].slice(label.length).trim();
  };

  // headers ringan
  takeSimple("id", "ID:");
  takeSimple("source", "Source:");
  takeSimple("category", "Category:");
  takeSimple("subcategory", "SubCategory:");
  takeSimple("tags", "Tags:");

  // ---------- Question body ----------
  (function findQuestion() {
    const qi = lines.findIndex((l) => /^question\s*:/i.test(l));
    if (qi >= 0) {
      const after = lines.slice(qi + 1);
      const stop = after.findIndex((l) => isChoiceLettered(l) || isBullet(l));
      out.question = (stop >= 0 ? after.slice(0, stop) : after).join("\n").trim();
    }
    if (!out.question) {
      const stop = lines.findIndex((l) => isChoiceLettered(l) || isBullet(l));
      if (stop > 0) {
        const head = lines.slice(0, stop).filter((l) => !/^ID:/i.test(l));
        out.question = head.join("\n").replace(/^Question:\s*/i, "").trim();
      }
    }
  })();

  // ---------- pass 1: lettered choices ----------
  let usingLettered = false;
  let i = 0;

  const tryConsumeExplanationBlock = (startIndex, targetIdx) => {
    let j = startIndex;
    let captured = "";
    let seenMarker = false;
    let correctForThis = false;

    while (j < lines.length) {
      const s = lines[j];
      if (isChoiceLettered(s) || isBullet(s) || isHeader(s)) break;

      // style lama: "Explanation A: ..."
      const mOld = s.match(/^Explanation\s+([ABCD])\s*[:\-]\s*(.*)$/i);
      if (mOld) {
        const idx = mapAns[mOld[1].toUpperCase()];
        let text = (mOld[2] || "").trim();
        j++;
        while (
          j < lines.length &&
          !isChoiceLettered(lines[j]) &&
          !isBullet(lines[j]) &&
          !isHeader(lines[j])
        ) {
          text += " " + lines[j].trim();
          j++;
        }
        out.explanations[idx] = text;
        return j;
      }

      // marker modern: ✓/✗ + (Correct|Incorrect) optional
      const mMark = s.match(
        /^(?:[→\-–—•*]\s*)?(?:[✗✖✘✕×xX]|[✓✔])?\s*(Correct|Incorrect)?\b[:\-–—]?\s*(.*)$/i
      );
      if (mMark) {
        const tag = (mMark[1] || "").toLowerCase();
        const tail = (mMark[2] || "").trim();
        if (tag) {
          seenMarker = true;
          if (tag === "correct") correctForThis = true;
        }
        if (tail) captured += (captured ? " " : "") + tail;
        j++;
        continue;
      }

      // baris biasa → bagian explanation
      captured += (captured ? " " : "") + s;
      j++;
    }

    if (captured.trim()) {
      out.explanations[targetIdx] = captured.trim();
      if (seenMarker && correctForThis) out.correctIndex = targetIdx;
    }
    return j;
  };

  while (i < lines.length) {
    const l = lines[i];
    const mChoice = l.match(/^([ABCD])\s*[:\.\)]\s+(.*)$/i);
    if (mChoice) {
      usingLettered = true;
      const idx = mapAns[mChoice[1].toUpperCase()];
      out.answers[idx] = (mChoice[2] || "").trim();
      i = tryConsumeExplanationBlock(i + 1, idx);
      continue;
    }
    i++;
  }

  // ---------- pass 2: bullets kalau tidak lettered ----------
  if (!usingLettered) {
    const bullets = lines.filter((l) => isBullet(l));
    for (let k = 0; k < Math.min(4, bullets.length); k++) {
      out.answers[k] = bullets[k].replace(/^[-*•]\s+/, "").trim();
    }
    const corr = lines.find((x) => /^correct\s*:/i.test(x));
    if (corr) {
      const val = corr.split(":")[1]?.trim();
      let idx = "ABCD".indexOf((val || "").toUpperCase());
      if (idx < 0 && /^\d+$/.test(val || "")) idx = Math.max(0, Math.min(3, parseInt(val, 10) - 1));
      if (idx >= 0) out.correctIndex = idx;
    }
  }

  // ---------- fallback Correct: header ----------
  if (out.correctIndex == null) {
    const corr2 = lines.find((l) => /^correct\s*:/i.test(l));
    if (corr2) {
      const val = corr2.split(":")[1]?.trim();
      let idx = "ABCD".indexOf((val || "").toUpperCase());
      if (idx < 0 && /^\d+$/.test(val || "")) idx = Math.max(0, Math.min(3, parseInt(val, 10) - 1));
      if (idx >= 0) out.correctIndex = idx;
    }
  }

  // Level (optional)
  const lvl = lines.find((l) => /^level\s*:/i.test(l));
  if (lvl) out.level = (lvl.split(":")[1] || "medium").trim().toLowerCase();

  return out;
}
