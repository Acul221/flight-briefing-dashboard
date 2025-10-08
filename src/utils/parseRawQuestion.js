// src/utils/parseRawQuestion.js
// Named export: parseRawQuestion(text) -> normalized object for editor form

function extractUrl(s = "") {
  const md = s.match(/!\[[^\]]*]\(([^)]+)\)/); // markdown image
  if (md) return md[1];
  const u = s.match(/https?:\/\/\S+/i);       // plain url
  return u ? u[0] : null;
}

function pickField(lines, labelRegex) {
  const re = new RegExp(`^\\s*(?:${labelRegex})\\s*:\\s*(.*)$`, "i");
  const idx = lines.findIndex((l) => re.test(l));
  if (idx >= 0) {
    const m = lines[idx].match(re);
    lines.splice(idx, 1);
    return (m?.[1] || "").trim();
  }
  return "";
}

function pickImage(lines, labelRegex) {
  const re = new RegExp(`^\\s*(?:${labelRegex})\\s*:?(.*)$`, "i");
  const idx = lines.findIndex((l) => re.test(l));
  if (idx >= 0) {
    const m = lines[idx].match(re);
    let rest = (m?.[1] || "").trim();
    lines.splice(idx, 1);
    let url = extractUrl(rest);
    if (!url) {
      // cari next non-empty line sebagai URL
      for (let j = idx; j < lines.length; j++) {
        const cand = lines[j].trim();
        if (!cand) continue;
        url = extractUrl(cand);
        if (url) {
          lines.splice(j, 1);
        }
        break;
      }
    }
    return url || null;
  }
  return null;
}

export function parseRawQuestion(input) {
  const text = String(input || "").replace(/\r\n/g, "\n").trim();
  const lines = text.split("\n");

  const id = pickField(lines, "ID");
  const qFromField = pickField(lines, "Question");
  const qFirstNonEmpty = qFromField || (lines.find((l) => l.trim()) || "");
  const question = qFirstNonEmpty;

  const question_image_url = pickImage(lines, "Image\\s*question|Question\\s*image|Image");

  const choices = [{ text: "" }, { text: "" }, { text: "" }, { text: "" }];
  const explanations = ["", "", "", ""];
  const choice_images = [null, null, null, null];

  // A: / A) / A.  ...
  const choiceLine = /^\s*([A-Da-d])[\)\.:]\s*(.*)$/;
  lines.forEach((line) => {
    let m;

    // Choice text
    m = line.match(choiceLine);
    if (m) {
      const idx = "ABCD".indexOf(m[1].toUpperCase());
      choices[idx] = { text: (m[2] || "").trim() };
      return;
    }

    // Explanation A:
    m = line.match(/^\s*Explanation\s*([A-Da-d])\s*:\s*(.*)$/i);
    if (m) {
      const idx = "ABCD".indexOf(m[1].toUpperCase());
      explanations[idx] = (m[2] || "").trim();
      return;
    }

    // Image answer A: / Image A:
    m = line.match(/^\s*(?:Image\s*(?:answer)?\s*([A-Da-d])|Image\s*([A-Da-d]))\s*:?(.+)?$/i);
    if (m) {
      const letter = (m[1] || m[2] || "A").toUpperCase();
      const idx = "ABCD".indexOf(letter);
      const rest = (m[3] || "").trim();
      const url = extractUrl(rest);
      if (url) choice_images[idx] = url;
      return;
    }
  });

  // Correct / Answer
  const correctRaw = pickField(lines, "Correct(?:\\s*answer)?|Answer");
  const correctMatch = correctRaw.match(/[A-D]/i);
  const correctIndex = correctMatch ? "ABCD".indexOf(correctMatch[0].toUpperCase()) : 0;

  // Difficulty
  const diffRaw = (pickField(lines, "Level|Difficulty") || "").toLowerCase();
  const difficulty = /hard/.test(diffRaw) ? "hard" : /easy/.test(diffRaw) ? "easy" : "medium";

  const source = pickField(lines, "Source");
  const category = pickField(lines, "Category");
  const subcategory = pickField(lines, "Sub\\s*Category|SubCategory|Subcategory");
  const tagsCsv = pickField(lines, "Tags");
  const tags = tagsCsv
    ? tagsCsv.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  // Pastikan choices terisi object {text}
  for (let i = 0; i < 4; i++) {
    if (!choices[i] || typeof choices[i] !== "object") choices[i] = { text: String(choices[i] || "") };
  }

  return {
    id: id || null,
    question,
    question_image_url,
    choices,
    choice_images,
    explanations,
    correctIndex,
    difficulty,
    source,
    category,
    subcategory,
    tags,
  };
}
