import Tesseract from "tesseract.js";

let worker;

/**
 * Init & cache worker
 */
export async function getWorker() {
  if (!worker) {
    console.log("🟢 Initializing Tesseract worker…");
    worker = await Tesseract.createWorker("eng"); // bahasa default English
  }
  return worker;
}

/**
 * Warmup worker supaya lebih cepat saat pertama OCR
 */
export async function warmup() {
  try {
    await getWorker();
    console.log("⚡ Tesseract warm-up complete");
  } catch (err) {
    console.error("❌ Warmup failed:", err);
  }
}

/**
 * OCR dengan custom PSM (Page Segmentation Mode)
 * @param {HTMLImageElement|HTMLCanvasElement|string} input - bisa img, canvas, atau DataURL
 * @param {number} psm - default 6 (Assume a single uniform block of text)
 */
export async function recognizePSM(input, psm = 6, options = {}) {
  try {
    const w = await getWorker();
    const { data } = await w.recognize(input, {
      tessedit_pageseg_mode: psm,
      ...options,
    });
    return data.text || "";
  } catch (err) {
    console.error("❌ recognizePSM error:", err);
    return "";
  }
}


/**
 * Optional: terminate worker kalau mau clear memory
 */
export async function terminateWorker() {
  if (worker) {
    await worker.terminate();
    worker = null;
    console.log("🛑 Tesseract worker terminated");
  }
}
