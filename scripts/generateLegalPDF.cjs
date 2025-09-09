// scripts/generateLegalPDF.cjs
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const { jsPDF } = require("jspdf");

// ---------- Config ----------
const OUTPUT_DIR = path.join("public", "legal");
const LOGO_PATH = path.join("public", "logo.png");
const BRAND = "SkyDeckPro";
const BUILD_DATE_ISO = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
const PAGE = {
  marginX: 20,
  marginY: 22,
  lineHeight: 6.8,
  bodyFontSize: 11.5,
  headingFontSize: 14,
  titleFontSize: 18,
};

// ---------- Helpers ----------
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function addHeader(doc, title) {
  const { marginX } = PAGE;
  // Logo (optional)
  if (fs.existsSync(LOGO_PATH)) {
    try {
      const imgData = fs.readFileSync(LOGO_PATH).toString("base64");
      doc.addImage(`data:image/png;base64,${imgData}`, "PNG", marginX, 10, 28, 16);
    } catch (e) {
      console.warn("⚠️ Could not load logo:", e.message);
    }
  }
  // Brand
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(BRAND, 105, 18, { align: "center" });
  // Title
  doc.setFontSize(PAGE.titleFontSize);
  doc.setFont("helvetica", "bold");
  doc.text(title, 105, 32, { align: "center" });
}

function addFooter(doc) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const h = doc.internal.pageSize.getHeight();
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    doc.text(`© ${BRAND} 2025 – All Rights Reserved`, 105, h - 12, { align: "center" });
    doc.text(`Generated on: ${BUILD_DATE_ISO}`, 105, h - 6, { align: "center" });
    // Page number
    doc.text(`Page ${i} / ${pageCount}`, 200 - PAGE.marginX, h - 6, { align: "right" });
  }
}

function setDocMeta(doc, { title, subject }) {
  try {
    doc.setProperties({
      title,
      subject,
      author: BRAND,
      creator: `${BRAND} – Legal PDF Builder`,
      keywords: "SkyDeckPro, Terms, Privacy, Refund, Legal",
    });
  } catch {
    // jsPDF older versions may not support all meta fields
  }
}

function writeMultiline(doc, text, opts = {}) {
  const {
    x = PAGE.marginX,
    yStart = 42, // below title
    maxWidth = doc.internal.pageSize.getWidth() - PAGE.marginX * 2,
    lineHeight = PAGE.lineHeight,
    fontSize = PAGE.bodyFontSize,
  } = opts;

  doc.setFontSize(fontSize);
  doc.setFont("helvetica", "normal");

  const lines = doc.splitTextToSize(text.trim().replace(/\t/g, "  "), maxWidth);
  let y = yStart;

  lines.forEach((ln) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (y > pageHeight - PAGE.marginY - 8) {
      doc.addPage();
      y = PAGE.marginY;
    }
    doc.text(ln, x, y);
    y += lineHeight;
  });

  return y;
}

function writeHeading(doc, text, y, level = 2) {
  const sizes = { 1: PAGE.titleFontSize, 2: PAGE.headingFontSize, 3: 12.5 };
  const style = level === 1 ? "bold" : "bold";
  const fontSize = sizes[level] || PAGE.headingFontSize;
  const x = PAGE.marginX;

  const h = doc.internal.pageSize.getHeight();
  if (y > h - PAGE.marginY - 12) {
    doc.addPage();
    y = PAGE.marginY;
  }
  doc.setFont("helvetica", style);
  doc.setFontSize(fontSize);
  doc.text(text, x, y);
  return y + (level === 1 ? 8 : 6);
}

function createPDF(filename, title, sections = []) {
  const doc = new jsPDF({ compress: true, unit: "pt", format: "a4" });
  setDocMeta(doc, { title, subject: `${BRAND} – ${title}` });

  // First page header
  addHeader(doc, title);

  let y = 50;

  // Body
  sections.forEach((sec, idx) => {
    const { heading, content } = sec;

    // Heading
    if (heading) y = writeHeading(doc, heading, y, 2);

    // Body text
    y = writeMultiline(doc, content, { yStart: y });

    // Section spacing
    y += 6;

    // Force small gap between major sections
    if (idx < sections.length - 1) {
      const h = doc.internal.pageSize.getHeight();
      if (y > h - 120) {
        doc.addPage();
        y = PAGE.marginY;
      }
    }
  });

  // Footer with page numbers
  addFooter(doc);

  // Save
  ensureDir(OUTPUT_DIR);
  const outPath = path.join(OUTPUT_DIR, filename);
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  fs.writeFileSync(outPath, pdfBuffer);
  console.log(`✅ Created: ${outPath}`);
}

// ---------- Content (updated & strengthened) ----------

const TERMS_SECTIONS = [
  {
    heading: "Last Updated",
    content: "September 2025",
  },
  {
    heading: "1. Service Description",
    content:
      "SkyDeckPro provides digital learning services for pilots, including interactive quizzes, study tools, and (future) OCR logbook features. The service is provided on an as-is and as-available basis.",
  },
  {
    heading: "2. User Rights & Responsibilities",
    content:
      "- Keep your credentials confidential and secure.\n- Use the service only for lawful, personal, educational purposes.\n- Ensure any data or documents you submit are accurate and do not infringe others’ rights.\n- You are responsible for your device security and internet connection.",
  },
  {
    heading: "3. Prohibited Uses",
    content:
      "- Bypassing access controls, scraping, or reverse engineering.\n- Reselling, redistributing, or publicly posting paid/protected content.\n- Uploading unlawful, infringing, or harmful materials, or interfering with service operation.",
  },
  {
    heading: "4. Payments & Subscriptions",
    content:
      "Subscriptions are billed in Indonesian Rupiah (IDR) on a recurring basis (monthly or yearly). Prices/features may change with prior notice on our website/app. Access activates after our payment partner confirms payment. Unless required by law, fees are non-refundable (see Refund Policy).",
  },
  {
    heading: "5. Data Protection & Privacy",
    content:
      "We process personal data under Indonesia’s Personal Data Protection Law (UU PDP 2022) and applicable global standards where relevant. Users may request access, correction, or deletion of personal data. International transfers may occur to deliver the service, subject to appropriate safeguards. See our Privacy Policy for details.",
  },
  {
    heading: "6. Intellectual Property",
    content:
      "All quizzes, explanations, software, and other content are owned by or licensed to SkyDeckPro and protected by IP laws. Unauthorized copying, distribution, or derivative works are prohibited.",
  },
  {
    heading: "7. Termination",
    content:
      "We may suspend or terminate accounts for violations of these Terms, suspected fraud, or security risks. You may cancel at any time via your account or by contacting support.",
  },
  {
    heading: "8. Disclaimer & Limitation of Liability",
    content:
      "SkyDeckPro provides study tools for educational purposes and is not a substitute for official regulatory training or operational decision-making. To the maximum extent permitted by law, SkyDeckPro is not liable for indirect, incidental, or consequential damages; direct liability, if any, is limited to fees paid in the 3 months preceding the claim.",
  },
  {
    heading: "9. Governing Law & Dispute Resolution",
    content:
      "These Terms are governed by the laws of the Republic of Indonesia. Disputes should first be resolved amicably; if unresolved, they may be brought before the competent courts in Jakarta.",
  },
  {
    heading: "10. Changes to Terms",
    content:
      "We may update these Terms periodically. Continued use after updates constitutes acceptance of the revised Terms.",
  },
];

const REFUND_SECTIONS = [
  {
    heading: "Last Updated",
    content: "September 2025",
  },
  {
    heading: "Refund Policy (Digital Services)",
    content:
      "Purchases are final due to the digital, instantly-accessible nature of our services. Refunds are limited to the cases below, without prejudice to rights required by applicable consumer laws.",
  },
  {
    heading: "Eligible Cases",
    content:
      "- Confirmed duplicate (double) payment for the same subscription.\n- A technical error from our system prevents activation despite successful payment.",
  },
  {
    heading: "Processing & Method",
    content:
      "Approved refunds are processed within 7 business days using the original payment method and in Indonesian Rupiah (IDR). Refunds cannot be transferred to another account or converted into credits.",
  },
  {
    heading: "How to Request",
    content:
      "Email support@skydeckpro.id with proof of payment and a brief description of the issue. We may request additional information to verify the request.",
  },
  {
    heading: "Policy Changes",
    content:
      "We may amend this Refund Policy from time to time. Continued use after updates indicates acceptance.",
  },
];

const PRIVACY_SECTIONS = [
  {
    heading: "Last Updated",
    content: "September 2025",
  },
  {
    heading: "Overview",
    content:
      "This Privacy Policy explains what personal data we collect, how we use it, the legal bases for processing, how long we retain it, and your rights. By using SkyDeckPro, you agree to this Policy.",
  },
  {
    heading: "Data We Collect",
    content:
      "- Account data: email, name (optional), WhatsApp (optional), auth identifiers.\n- Transaction data: order_id, payment status, method token (via Midtrans; we do not store full card details).\n- Usage & technical data: access logs, device/browser, IP, timestamps, diagnostics.\n- Learning data: quiz attempts, scores, progress, preferences.\n- Logbook (future): images/files you upload for OCR and extracted text.\n- Support: messages and attachments you send to our support.",
  },
  {
    heading: "How We Use Data (Purposes)",
    content:
      "- Provide the service: authentication, content delivery, maintain sessions.\n- Process payments: verify and activate subscriptions via payment partner.\n- Security & integrity: prevent abuse, detect fraud, maintain audit logs.\n- Support & improvements: respond to requests, fix issues, aggregated analytics.\n- Legal compliance: fulfill legal obligations and respond to lawful requests.",
  },
  {
    heading: "Legal Bases",
    content:
      "- Contract: to deliver features you request.\n- Consent: optional fields (e.g., WhatsApp), marketing communications, and, where required, international transfers.\n- Legitimate interests: security, fraud prevention, privacy-preserving analytics.\n- Legal obligation: tax, accounting, lawful authority requests.",
  },
  {
    heading: "Third-Party Processors & Integrations",
    content:
      "We use reputable vendors: Supabase (auth/DB/storage/logs), Netlify (hosting/CDN/TLS), Midtrans (payments), AVWX (weather), Windy (maps), INA-SIAM (aviation info). We do not sell personal data.",
  },
  {
    heading: "International Transfers",
    content:
      "Vendors may process data outside Indonesia. We use contractual safeguards and security controls to ensure protection equivalent to Indonesian standards. By using the service and, where required, by providing consent, you acknowledge such transfers.",
  },
  {
    heading: "Storage, Security & Retention",
    content:
      "Encrypted connections (HTTPS/TLS), access controls, provider-side encryption at rest, regular backups. Data retained while your account is active; inactive accounts may be deleted or anonymized after a reasonable period (e.g., 12–24 months). Transaction records kept as required by law. OCR source images (future) are deleted after extraction where feasible unless you choose to retain them.",
  },
  {
    heading: "Your Rights",
    content:
      "Subject to law, you may request access, correction, deletion, restriction, or portability of your personal data and withdraw consent at any time (does not affect prior lawful processing). Deleting essential data may end paid access. We aim to respond within legally required timelines.",
  },
  {
    heading: "Cookies & Analytics",
    content:
      "We use essential cookies/local storage for authentication. We do not run third-party advertising cookies. If we add analytics/marketing cookies, we will provide clear notice and controls.",
  },
  {
    heading: "Children",
    content:
      "SkyDeckPro targets adult learners (pilots/trainees). We do not knowingly collect data from children. If a child’s data was provided, contact us to remove it.",
  },
  {
    heading: "Breach Notifications",
    content:
      "We maintain incident response procedures. Where required, we notify affected users and/or authorities within prescribed timelines after becoming aware of a qualifying breach.",
  },
  {
    heading: "Jurisdiction & Updates",
    content:
      "This Policy is governed by the laws of the Republic of Indonesia. We may update this Policy; material changes will be posted with a new effective date.",
  },
  {
    heading: "Contact",
    content:
      "Privacy inquiries / data rights: privacy@skydeckpro.id\nGeneral support: support@skydeckpro.id\nWhatsApp: +62 812-1982-8080",
  },
];

const CONTACT_SECTIONS = [
  {
    heading: "Last Updated",
    content: "September 2025",
  },
  {
    heading: "Contact Information",
    content:
      "For inquiries, support, or partnership opportunities:\n\nGeneral: support@skydeckpro.id\nPrivacy/Data Rights: privacy@skydeckpro.id\nWhatsApp: +62 812-1982-8080\nBusiness Address: Menteng, Central Jakarta (per business registration)",
  },
];

// ---------- Generate ----------
(function main() {
  ensureDir(OUTPUT_DIR);

  createPDF("terms.pdf", "Terms & Conditions", TERMS_SECTIONS);
  createPDF("refund.pdf", "Refund Policy", REFUND_SECTIONS);
  createPDF("privacy.pdf", "Privacy Policy", PRIVACY_SECTIONS);
  createPDF("contact.pdf", "Contact Information", CONTACT_SECTIONS);
})();
