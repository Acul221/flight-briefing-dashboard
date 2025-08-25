import { createWorker } from "tesseract.js";

let workerPromise = null;

export async function getTessWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const w = await createWorker({
        logger: () => {},
        workerPath: "https://unpkg.com/tesseract.js@5/dist/worker.min.js",
        langPath: "https://unpkg.com/tesseract.js-core@5.0.2/lang/",
        corePath: "https://unpkg.com/tesseract.js-core@5.0.2/tesseract-core.wasm.js",
      });
      await w.loadLanguage("eng");
      await w.initialize("eng");
      await w.setParameters({
        preserve_interword_spaces: "1",
        tessedit_char_whitelist:
          "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:/-.() \n",
      });
      return w;
    })();
  }
  return workerPromise;
}

export async function recognizeWith(worker, dataUrl, psm = 6) {
  await worker.setParameters({ tessedit_pageseg_mode: String(psm) });
  const { data: { text } } = await worker.recognize(dataUrl);
  return text;
}
