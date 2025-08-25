// src/lib/parseRawQuestion_v2.js
const REQUIRED_LETTERS = ["A", "B", "C", "D"];

function takeSingleLine(block, label) {
  const re = new RegExp(`^${label}\\s*:\\s*(.*?)\\s*$`, "mi");
  const m = block.match(re);
  return m ? m[1].trim() : "";
}

function normalizeChoiceHeader(line) {
  // "A. text" | "A) text" | boleh ada "✅ " di depan
  const m = line.match(/^\s*(?:✅\s*)?([A-D])\s*[.)]\s*(.*)$/i);
  if (!m) return null;
  const markedCorrect = /^\s*✅/.test(line);
  return { letter: m[1].toUpperCase(), text: (m[2] || "").trim(), markedCorrect };
}

function parseArrowExplanation(line) {
  // "→ ✅ ..." | "-> ❌ ..." | tanpa emoji = fallback
  const m = line.match(/^\s*(?:→|->)\s*(✅|❌)?\s*(.*)$/);
  if (!m) return { isArrow: false, isCorrect: false, explanation: "" };
  return { isArrow: true, isCorrect: m[1] === "✅", explanation: (m[2] || "").trim() };
}

function parseImageLine(line) {
  // "Image: <url>" atau "ImageA: <url>" / "Image A: <url>"
  // return { kind: 'Q' | 'A'|'B'|'C'|'D', url, matched: boolean }
  const m1 = line.match(/^\s*Image\s*:\s*(\S+)\s*$/i);
  if (m1) return { matched: true, kind: "Q", url: m1[1] };

  const m2 = line.match(/^\s*Image\s*([A-D])\s*:\s*(\S+)\s*$/i); // "Image A: url"
  if (m2) return { matched: true, kind: m2[1].toUpperCase(), url: m2[2] };

  const m3 = line.match(/^\s*Image([A-D])\s*:\s*(\S+)\s*$/i); // "ImageA: url"
  if (m3) return { matched: true, kind: m3[1].toUpperCase(), url: m3[2] };

  return { matched: false, kind: "", url: "" };
}

export function parseRawBlock_v2(raw) {
  const safe = String(raw || "").replace(/\r/g, "").trim();

  // ID & Question
  const id = takeSingleLine(safe, "ID") || "";
  const qMatch = safe.match(/^\s*Question\s*:\s*([\s\S]*?)(?:\n\s*[A-D][).]\s|$)/mi);
  const question = qMatch ? qMatch[1].trim() : "";
  if (!question) throw new Error("Tidak menemukan 'Question:' atau teks pertanyaan kosong.");

  // Cari index awal pilihan
  const startIdx = safe.search(/^\s*[A-D][).]\s+/m);
  if (startIdx === -1) throw new Error("Tidak menemukan header pilihan 'A.' s/d 'D.'");

  // Gambar pertanyaan (cari 'Image:' sebelum pilihan pertama)
  let questionImage = "";
  const beforeChoices = safe.slice(0, startIdx);
  beforeChoices.split(/\n/).forEach((line) => {
    const pic = parseImageLine(line);
    if (pic.matched && pic.kind === "Q") questionImage = pic.url;
  });

  const lines = safe.slice(startIdx).split(/\n/);
  const tempChoices = [];
  const imageMapDecl = {}; // dari "ImageA:" global, dsb.

  // Kumpulkan deklarasi gambar global untuk pilihan (ImageA:/Image A:)
  safe.split(/\n/).forEach((line) => {
    const pic = parseImageLine(line);
    if (pic.matched && pic.kind !== "Q") {
      imageMapDecl[pic.kind] = pic.url;
    }
  });

  for (let i = 0; i < lines.length; i++) {
    const head = normalizeChoiceHeader(lines[i]);
    if (!head) continue;

    let j = i + 1;
    let explanation = "";
    let isCorrect = head.markedCorrect;
    let choiceImage = imageMapDecl[head.letter] || "";

    // Cek baris setelah header: mungkin ada "Image:" lalu "→ ..."
    const next1 = lines[j] || "";
    const img1 = parseImageLine(next1);
    if (img1.matched && (img1.kind === "Q" || img1.kind === head.letter)) {
      choiceImage = img1.url;
      j += 1;
    }

    const next2 = lines[j] || "";
    const arrow = parseArrowExplanation(next2);
    if (arrow.isArrow) {
      explanation = arrow.explanation;
      if (arrow.isCorrect) isCorrect = true;
      j += 1;
    }

    tempChoices.push({
      label: head.letter,
      text: head.text,
      explanation,
      isCorrect: !!isCorrect,
      image: choiceImage || "",
    });

    i = j - 1; // lompat sesuai yang sudah dipakai
  }

  // Validasi A–D
  const lettersFound = new Set(tempChoices.map((c) => c.label));
  for (const L of REQUIRED_LETTERS) {
    if (!lettersFound.has(L)) {
      throw new Error(`Pilihan ${L} tidak ditemukan. Pastikan menulis ${L}. dan baris panah "→" sesudahnya.`);
    }
  }

  const choices = tempChoices
    .sort((a, b) => a.label.localeCompare(b.label))
    .map((c) => ({
      label: c.label,
      text: c.text,
      explanation: c.explanation,
      isCorrect: !!c.isCorrect,
      image: c.image || "",
    }));

  if (!choices.some((c) => c.isCorrect)) {
    throw new Error("Belum ada jawaban benar. Tambahkan '✅' pada baris panah atau header pilihan.");
  }

  // Metadata
  const tagsLine = takeSingleLine(safe, "Tags");
  const tags = tagsLine ? tagsLine.split(/[,;]+/).map((s) => s.trim()).filter(Boolean) : [];
  const level = takeSingleLine(safe, "Level") || "All Level";
  const source = takeSingleLine(safe, "Source") || "";
  const category = takeSingleLine(safe, "Category") || "";
  const aircraft = takeSingleLine(safe, "Aircraft") || "";

  return {
    id,
    question,
    questionImage,                 // <-- NEW
    choices,
    choiceImages: choices.map(c => c.image || ""), // convenience
    tags,
    level,
    source,
    category,
    aircraft,
  };
}

export function parseRawBatch_v2(rawAll) {
  const text = String(rawAll || "").replace(/\r/g, "").trim();
  if (!text) return [];
  const blocks = text.split(/\n-{3,}\n/).map((s) => s.trim()).filter(Boolean);
  return blocks.map(parseRawBlock_v2);
}
