import { useState } from "react";
import { Helmet } from "react-helmet-async";

export default function Privacy() {
  const [lang, setLang] = useState("id"); // default Indonesia

  return (
    <div className="max-w-3xl mx-auto p-6 prose dark:prose-invert">
      <Helmet>
        <title>Kebijakan Privasi / Privacy Policy – SkyDeckPro</title>
        <meta
          name="description"
          content="SkyDeckPro Privacy Policy / Kebijakan Privasi: bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi Anda."
        />
      </Helmet>

      {/* Toggle Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setLang("id")}
          className={`px-3 py-1 rounded-l ${lang === "id" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
        >
          ID
        </button>
        <button
          onClick={() => setLang("en")}
          className={`px-3 py-1 rounded-r ${lang === "en" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
        >
          EN
        </button>
      </div>

      {lang === "id" ? (
        <div>
          <h1>Kebijakan Privasi</h1>
          <p><strong>Terakhir diperbarui:</strong> 9 Sep 2025</p>
          <p>
            SkyDeckPro menghormati privasi Anda. Kebijakan ini menjelaskan data pribadi apa yang kami kumpulkan,
            alasan kami mengumpulkannya, bagaimana kami menggunakannya, serta hak-hak Anda. Dengan menggunakan
            SkyDeckPro, Anda dianggap menyetujui Kebijakan ini.
          </p>

          <h2>Siapa Kami</h2>
          <p>
            SkyDeckPro adalah platform e-learning aviasi yang menyediakan kuis, alat belajar, dan (di masa depan) fitur OCR logbook.
            Untuk pertanyaan privasi, lihat bagian <a href="#contact">Kontak</a>.
          </p>

          <h2>Data yang Kami Kumpulkan</h2>
          <ul>
            <li><strong>Data akun</strong>: email, nama (opsional), nomor WhatsApp (opsional), identifier autentikasi.</li>
            <li><strong>Data transaksi</strong>: order_id, status pembayaran, metode pembayaran (diproses oleh mitra pembayaran; kami tidak menyimpan detail kartu).</li>
            <li><strong>Data penggunaan & teknis</strong>: log akses, info perangkat/browser, alamat IP, timestamp, log error/diagnostik.</li>
            <li><strong>Data belajar</strong>: percobaan kuis, skor, progres, preferensi.</li>
            <li><strong>Logbook (mendatang)</strong>: file/gambar yang diunggah untuk OCR dan teks hasil ekstraksi.</li>
            <li><strong>Data dukungan</strong>: pesan & lampiran yang dikirimkan ke support.</li>
          </ul>

          <h2>Tujuan Penggunaan Data</h2>
          <ul>
            <li><strong>Penyediaan layanan</strong>: autentikasi, menyediakan kuis/konten, menjaga sesi.</li>
            <li><strong>Pemrosesan pembayaran</strong>: verifikasi & aktivasi langganan melalui mitra pembayaran.</li>
            <li><strong>Keamanan</strong>: mencegah penyalahgunaan, mendeteksi penipuan, audit log.</li>
            <li><strong>Dukungan pengguna</strong>: menjawab permintaan, memperbaiki masalah, meningkatkan reliabilitas.</li>
            <li><strong>Peningkatan produk</strong>: analitik agregat untuk fitur & konten.</li>
            <li><strong>Kewajiban hukum</strong>: memenuhi kewajiban hukum, permintaan otoritas.</li>
          </ul>

          <h2>Dasar Hukum Pemrosesan</h2>
          <ul>
            <li><strong>Kontrak</strong>: untuk membuat akun & menyediakan fitur langganan.</li>
            <li><strong>Persetujuan</strong>: data opsional (misalnya WhatsApp), komunikasi marketing, transfer data internasional.</li>
            <li><strong>Kepentingan sah</strong>: keamanan, pencegahan penipuan, analitik layanan.</li>
            <li><strong>Kewajiban hukum</strong>: pajak, akuntansi, permintaan otoritas.</li>
          </ul>

          <h2>Pihak Ketiga</h2>
          <ul>
            <li><strong>Supabase</strong> (auth, database, storage).</li>
            <li><strong>Netlify</strong> (hosting, CDN, TLS, access logs).</li>
            <li><strong>Midtrans</strong> (pembayaran).</li>
            <li><strong>AVWX</strong> (data cuaca, tanpa identifier pribadi).</li>
            <li><strong>Windy</strong> & <strong>INA-SIAM</strong> (embed data aviasi/cuaca).</li>
          </ul>
          <p>Kami <strong>tidak</strong> menjual data pribadi Anda dan tidak membagikan data ke pengiklan.</p>

          <h2>Penyimpanan & Keamanan</h2>
          <ul>
            <li><strong>Keamanan</strong>: koneksi terenkripsi (HTTPS/TLS), kontrol akses berbasis peran.</li>
            <li><strong>Enkripsi</strong>: data in transit & at rest terenkripsi.</li>
            <li><strong>Backup</strong>: backup reguler untuk pemulihan bencana.</li>
            <li><strong>Retensi</strong>: data akun & belajar disimpan selama akun aktif. Data transaksi disimpan sesuai ketentuan pajak.</li>
          </ul>

          <h2>Hak Anda</h2>
          <p>
            Berdasarkan UU PDP 2022 & GDPR, Anda berhak mengakses, memperbaiki, menghapus, membatasi, atau meminta portabilitas data pribadi.
            Anda juga dapat menarik persetujuan kapan saja.
          </p>

          <h2 id="contact">Kontak</h2>
          <p><strong>Permintaan data/privasi:</strong> <a href="mailto:privacy@skydeckpro.id">privacy@skydeckpro.id</a></p>
          <p><strong>Dukungan umum:</strong> <a href="mailto:support@skydeckpro.id">support@skydeckpro.id</a></p>
        </div>
      ) : (
        <div>
          <h1>Privacy Policy</h1>
          <p><strong>Last updated:</strong> Sep 9, 2025</p>
          <p>
            SkyDeckPro respects your privacy. This Policy explains what personal data we collect,
            why we collect it, how we use it, and your rights. By using SkyDeckPro, you agree to this Policy.
          </p>

          <h2>Who We Are</h2>
          <p>
            SkyDeckPro is an aviation e-learning platform providing quizzes, study tools, and (future) OCR logbook features.
            For inquiries, see <a href="#contact">Contact</a>.
          </p>

          <h2>Data We Collect</h2>
          <ul>
            <li><strong>Account data</strong>: email, name (optional), WhatsApp number (optional), authentication identifiers.</li>
            <li><strong>Transaction data</strong>: order_id, payment status, payment method (processed by payment partner).</li>
            <li><strong>Usage & technical data</strong>: access logs, device/browser info, IP address, timestamps, diagnostics.</li>
            <li><strong>Learning data</strong>: quiz attempts, scores, progress, preferences.</li>
            <li><strong>Logbook (future)</strong>: files/images uploaded for OCR and extracted text.</li>
            <li><strong>Support data</strong>: messages, attachments sent to support channels.</li>
          </ul>

          <h2>Purposes of Processing</h2>
          <ul>
            <li><strong>Provide service</strong>: authentication, deliver quizzes, maintain sessions.</li>
            <li><strong>Process payments</strong>: verify and activate subscriptions.</li>
            <li><strong>Security</strong>: prevent abuse, detect fraud, audit logs.</li>
            <li><strong>Support</strong>: respond to requests, fix issues, improve reliability.</li>
            <li><strong>Improvement</strong>: aggregated analytics for features & content.</li>
            <li><strong>Legal</strong>: comply with obligations & lawful requests.</li>
          </ul>

          <h2>Legal Bases</h2>
          <ul>
            <li><strong>Contract</strong>: to provide account & subscription features.</li>
            <li><strong>Consent</strong>: optional fields, marketing, international transfers.</li>
            <li><strong>Legitimate interest</strong>: security, analytics, fraud prevention.</li>
            <li><strong>Legal obligation</strong>: tax, accounting, lawful authority requests.</li>
          </ul>

          <h2>Third-Party Processors</h2>
          <ul>
            <li><strong>Supabase</strong> (auth, database, storage).</li>
            <li><strong>Netlify</strong> (hosting, CDN, TLS, access logs).</li>
            <li><strong>Midtrans</strong> (payments).</li>
            <li><strong>AVWX</strong> (weather data).</li>
            <li><strong>Windy</strong> & <strong>INA-SIAM</strong> (embedded aviation data).</li>
          </ul>
          <p>We <strong>do not</strong> sell your data and we do not share with advertisers.</p>

          <h2>Storage & Security</h2>
          <ul>
            <li><strong>Security</strong>: encrypted connections, role-based access controls.</li>
            <li><strong>Encryption</strong>: in transit & at rest.</li>
            <li><strong>Backups</strong>: for continuity and disaster recovery.</li>
            <li><strong>Retention</strong>: account & learning data kept while active. Transaction data kept for tax requirements.</li>
          </ul>

          <h2>Your Rights</h2>
          <p>
            Subject to law, you may request access, correction, deletion, restriction, or portability of your data. 
            You may withdraw consent anytime.
          </p>

          <h2 id="contact">Contact</h2>
          <p><strong>Privacy inquiries:</strong> <a href="mailto:privacy@skydeckpro.id">privacy@skydeckpro.id</a></p>
          <p><strong>General support:</strong> <a href="mailto:support@skydeckpro.id">support@skydeckpro.id</a></p>
        </div>
      )}
    </div>
  );
}
