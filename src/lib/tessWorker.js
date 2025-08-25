// src/lib/tessCdnWorker.js
// Pastikan di public/index.html ada:
// <script src="https://cdn.jsdelivr.net/npm/tesseract.js@5.0.4/dist/tesseract.min.js"></script>

let workerPromise = null;

export async function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      if (!window.Tesseract) throw new Error("Tesseract global belum termuat");

      const worker = await window.Tesseract.createWorker({
        workerPath: "https://cdn.jsdelivr.net/npm/tesseract.js@5.0.4/dist/worker.min.js",
        corePath:   "https://cdn.jsdelivr.net/npm/tesseract.js-core@5.0.0/tesseract-core.wasm.js",
        langPath:   "https://tessdata.projectnaptha.com/4.0.0_fast/",
        logger: null, // disable log biar tidak error cloning
      });

      await worker.loadLanguage("eng");
      await worker.initialize("eng");
      await worker.setParameters({
        preserve_interword_spaces: "1",
        tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:/-.() \n",
        tessedit_pageseg_mode: "6",
      });
      return worker;
    })();
  }
  return workerPromise;
}

export async function recognizePSM(image, psm = 6) {
  const worker = await getWorker();
  await worker.setParameters({ tessedit_pageseg_mode: String(psm) });
  const { data: { text } } = await worker.recognize(image);
  return text;
}

// Optional: pre-load saat startup
export async function warmup() {
  await getWorker();
}
