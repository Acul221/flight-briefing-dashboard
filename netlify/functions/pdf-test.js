import PDFDocument from "pdfkit";

export async function handler() {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const buffers = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve({
          statusCode: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": "inline; filename=\"test.pdf\"",
          },
          body: pdfBuffer.toString("base64"),
          isBase64Encoded: true,
        });
      });

      // Isi PDF sederhana
      doc.fontSize(25).text("Hello SkyDeckPro CFO Report!", 100, 100);
      doc.end();
    } catch (err) {
      reject({
        statusCode: 500,
        body: JSON.stringify({ error: err.message }),
      });
    }
  });
}
