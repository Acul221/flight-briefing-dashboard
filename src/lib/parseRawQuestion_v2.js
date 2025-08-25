// src/lib/parseRawQuestion_v2.js
// Parser untuk format raw text yang kamu pakai:
// ----------------------------------------------------
// ID: FCOM-ENG-FUEL-010
// Question:
// How does the FADEC achieve thrust regulation based on EPR demand?
//
// A. By adjusting thrust lever detent logic
// → ❌ Incorrect – Thrust lever detents guide pilot input but do not directly regulate thrust.
//
// B. By modulating N2 rotation via accessory gearbox
// → ❌ Incorrect – Accessory gearbox does not control N2 directly.
//
// C. By computing required fuel flow via FMV to maintain target EPR
// → ✅ Correct – FADEC maintains EPR by modulating fuel flow through FMV.
//
// D. By commanding engine starter valve modulation
// → ❌ Incorrect – Starter valve is only active during engine start, not normal thrust regulation.
//
// Tags: FADEC, EPR, thrust control
// Level: Medium
// Source: FCOM DSC-70-45 P 3/6
//
// (opsional) Category: a320/ata21
// (opsional) Aircraft: a320
//
// • Batch: pisahkan soal dengan baris --- (tiga minus) di baris sendiri.
// • Variasi header pilihan didukung: "A.", "A)", "A .", "A )" dan boleh ditandai ✅ di header.
// • Baris penjelasan harus diawali panah: "→" atau "->" lalu tanda ✅/❌ dan teks penjelasan.
// ----------------------------------------------------

const REQUIRED_LETTERS = ["A", "B", "C", "D"];

function takeSingleLine(block, label) {
  // Ambil satu baris "Label: nilai"
  const re = new RegExp(`^${label}\\s*:\\s*(.*?)\\s*$`, "mi");
  const m = block.match(re);
  return m ? m[1].trim() : "";
}

function normalizeChoiceHeader(line) {
  // Match header pilihan:
  //   "A. teks", "A) teks", boleh ada "✅ " di depan
  const m = line.match(/^\s*(?:✅\s*)?([A-D])\s*[.)]\s*(.*)$/i);
  if (!m) return null;
  const markedCorrect = /^\s*✅/.test(line);
  return {
    letter: m[1].toUpperCase(),
    text: (m[2] || "").trim(),
    markedCorrect,
  };
}

function parseArrowExplanation(line) {
  // Match baris panah:
  //   "→ ✅ Correct – ...", "-> ❌ Incorrect – ...", atau tanpa emoji (fallback)
  const m = line.match(/^\s*(?:→|->)\s*(✅|❌)?\s*(.*)$/);
  if (!m) {
    return { isArrow: false, isCorrect: false, explanation: "" };
  }
  return {
    isArrow: true,
    isCorrect: m[1] === "✅",
    explanation: (m[2] || "").trim(),
  };
}

export function parseRawBlock_v2(raw) {
  const safe = String(raw || "").replace(/\r/g, "").trim();

  // ID
  const id = takeSingleLine(safe, "ID") || "";

  // Question: ambil dari "Question:" hingga sebelum baris A./A)
  const qMatch = safe.match(/^\s*Question\s*:\s*([\s\S]*?)(?:\n\s*[A-D][).]\s|$)/mi);
  const question = qMatch ? qMatch[1].trim() : "";
  if (!question) {
    throw new Error("Tidak menemukan 'Question:' atau teks pertanyaan kosong.");
  }

  // Temukan awal blok pilihan dari baris pertama yang cocok A./A)
  const startIdx = safe.search(/^\s*[A-D][).]\s+/m);
  if (startIdx === -1) {
    throw new Error("Tidak menemukan header pilihan 'A.' s/d 'D.'.");
  }

  const lines = safe.slice(startIdx).split(/\n/);
  const tempChoices = [];
  for (let i = 0; i < lines.length; i++) {
    const head = normalizeChoiceHeader(lines[i]);
    if (!head) continue;

    // Cek baris berikutnya untuk panah (explanation)
    const next = lines[i + 1] || "";
    const { isArrow, isCorrect, explanation } = parseArrowExplanation(next);

    tempChoices.push({
      label: head.letter,
      text: head.text,
      explanation: isArrow ? explanation : "",
      isCorrect: head.markedCorrect || (isArrow ? isCorrect : false),
    });

    if (isArrow) i += 1; // lewati baris arrow jika ada
  }

  // Validasi jumlah & kelengkapan pilihan
  const lettersFound = new Set(tempChoices.map((c) => c.label));
  for (const L of REQUIRED_LETTERS) {
    if (!lettersFound.has(L)) {
      throw new Error(`Pilihan ${L} tidak ditemukan. Pastikan menulis ${L}. dan baris panah "→" sesudahnya.`);
    }
  }

  // Sort A..D dan siapkan struktur final
  const choices = tempChoices
    .sort((a, b) => a.label.localeCompare(b.label))
    .map((c) => ({
      label: c.label,
      text: c.text,
      explanation: c.explanation,
      isCorrect: !!c.isCorrect,
    }));

  if (!choices.some((c) => c.isCorrect)) {
    throw new Error("Belum ada jawaban benar. Tambahkan '✅' pada baris panah atau header pilihan.");
  }

  // Metadata
  const tagsLine = takeSingleLine(safe, "Tags");
  const tags = tagsLine
    ? tagsLine.split(/[,;]+/).map((s) => s.trim()).filter(Boolean)
    : [];

  const level = takeSingleLine(safe, "Level") || "All Level";
  const source = takeSingleLine(safe, "Source") || "";
  const category = takeSingleLine(safe, "Category") || "";
  const aircraft = takeSingleLine(safe, "Aircraft") || "";

  return {
    id,
    question,
    choices,
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

  // Split batch by '---' on its own line
  const blocks = text.split(/\n-{3,}\n/).map((s) => s.trim()).filter(Boolean);
  return blocks.map(parseRawBlock_v2);
}

// (opsional) Util ringan untuk quick check satu soal dari string
export function tryParseOne_v2(raw) {
  try {
    return { ok: true, data: parseRawBlock_v2(raw) };
  } catch (e) {
    return { ok: false, error: e?.message || String(e) };
  }
}
