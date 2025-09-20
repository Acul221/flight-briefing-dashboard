import { useState } from "react";
import { Helmet } from "react-helmet-async";

export default function Terms() {
  const [lang, setLang] = useState("id"); // default Indonesia

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Helmet>
        <title>Syarat & Ketentuan / Terms of Service – SkyDeckPro</title>
        <meta
          name="description"
          content="SkyDeckPro Terms of Service / Syarat & Ketentuan penggunaan layanan."
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
          <h1 className="text-2xl font-bold mb-4">Syarat & Ketentuan</h1>
          <p className="mb-4">
            Selamat datang di SkyDeckPro. Dengan mengakses atau menggunakan layanan kami, 
            Anda menyetujui Syarat & Ketentuan berikut. Mohon dibaca dengan seksama.
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-2">1) Deskripsi Layanan</h2>
          <p>
            SkyDeckPro menyediakan layanan pembelajaran digital untuk pilot, termasuk kuis interaktif, 
            alat belajar, dan (di masa depan) fitur OCR logbook.
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-2">2) Hak & Kewajiban Pengguna</h2>
          <ul className="list-disc ml-6 space-y-2">
            <li>Menjaga kerahasiaan kredensial akun Anda.</li>
            <li>Menggunakan layanan hanya untuk tujuan sah, pribadi, dan edukatif.</li>
            <li>Bertanggung jawab atas keakuratan data atau dokumen yang diunggah.</li>
          </ul>

          <h2 className="text-lg font-semibold mt-6 mb-2">3) Larangan Penggunaan</h2>
          <ul className="list-disc ml-6 space-y-2">
            <li>Mencoba membobol sistem, melakukan scraping, atau reverse engineering.</li>
            <li>Menjual kembali, mendistribusikan, atau mempublikasikan konten berbayar tanpa izin.</li>
            <li>Mengunggah materi ilegal, melanggar hukum, atau berbahaya.</li>
          </ul>

          <h2 className="text-lg font-semibold mt-6 mb-2">4) Pembayaran & Langganan</h2>
          <ul className="list-disc ml-6 space-y-2">
            <li>Langganan ditagih dalam Rupiah (IDR) bulanan atau tahunan.</li>
            <li>Harga & manfaat dapat berubah dengan pemberitahuan sebelumnya di situs.</li>
            <li>Akses aktif setelah pembayaran dikonfirmasi oleh mitra pembayaran kami.</li>
            <li>Tidak ada pengembalian dana kecuali diwajibkan oleh hukum Indonesia.</li>
          </ul>

          <h2 className="text-lg font-semibold mt-6 mb-2">5) Perlindungan Data & Privasi</h2>
          <p>
            Kami memproses data pribadi sesuai UU PDP 2022 dan standar global yang relevan (GDPR/CCPA bila berlaku). 
            Pengguna berhak mengakses, memperbaiki, atau meminta penghapusan data mereka melalui kontak resmi.
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-2">6) Hak Kekayaan Intelektual</h2>
          <p>
            Semua kuis, materi belajar, dan konten platform dimiliki atau dilisensikan kepada SkyDeckPro. 
            Dilarang menyalin, mendistribusikan, atau menggunakan secara tidak sah.
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-2">7) Penghentian</h2>
          <p>
            Kami berhak menangguhkan atau menghentikan akun yang melanggar Syarat ini atau 
            menyalahgunakan layanan.
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-2">8) Disclaimer & Batasan Tanggung Jawab</h2>
          <p>
            SkyDeckPro menyediakan alat belajar sebagai sumber tambahan. Kami tidak bertanggung jawab atas 
            keputusan operasional atau regulasi berdasarkan konten ini. Tanggung jawab dibatasi sesuai hukum yang berlaku.
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-2">9) Hukum yang Berlaku</h2>
          <p>
            Syarat ini diatur oleh hukum Republik Indonesia. Sengketa akan diselesaikan sesuai yurisdiksi yang berlaku.
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-2">10) Perubahan Syarat</h2>
          <p>
            Kami dapat memperbarui Syarat ini secara berkala. Penggunaan berlanjut dianggap menyetujui perubahan tersebut.
          </p>
        </div>
      ) : (
        <div>
          <h1 className="text-2xl font-bold mb-4">Terms of Service</h1>
          <p className="mb-4">
            Welcome to SkyDeckPro. By accessing or using our services, you agree to the 
            following Terms. Please read them carefully.
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-2">1) Service Description</h2>
          <p>
            SkyDeckPro provides digital learning services for pilots, including interactive 
            quizzes, study tools, and (in future) OCR logbook features.
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-2">2) User Rights & Responsibilities</h2>
          <ul className="list-disc ml-6 space-y-2">
            <li>Keep your account credentials confidential and secure.</li>
            <li>Use the service only for lawful, personal, and educational purposes.</li>
            <li>You are responsible for the accuracy of any data or documents you upload.</li>
          </ul>

          <h2 className="text-lg font-semibold mt-6 mb-2">3) Prohibited Uses</h2>
          <ul className="list-disc ml-6 space-y-2">
            <li>Attempting to bypass access controls, scrape, or reverse engineer the platform.</li>
            <li>Reselling, redistributing, or publicly posting paid or protected content without permission.</li>
            <li>Uploading infringing, unlawful, or harmful materials.</li>
          </ul>

          <h2 className="text-lg font-semibold mt-6 mb-2">4) Payments & Subscriptions</h2>
          <ul className="list-disc ml-6 space-y-2">
            <li>Subscriptions are billed in Indonesian Rupiah (IDR) on a recurring basis (monthly or yearly).</li>
            <li>Prices and benefits may change with prior notice on the website.</li>
            <li>Access is activated after payment is confirmed by our payment processor.</li>
            <li>No refunds are provided except where legally required.</li>
          </ul>

          <h2 className="text-lg font-semibold mt-6 mb-2">5) Data Protection & Privacy</h2>
          <p>
            We process personal data in accordance with Indonesia’s Personal Data Protection Law (UU PDP 2022) 
            and applicable global standards (GDPR/CCPA where relevant). Users have the right to access, correct, 
            or request deletion of their data. By using the service, you consent to international transfers where required.
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-2">6) Intellectual Property</h2>
          <p>
            All quizzes, study materials, and platform content are owned by or licensed to SkyDeckPro. 
            Unauthorized copying, distribution, or derivative use is prohibited.
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-2">7) Termination</h2>
          <p>
            We reserve the right to suspend or terminate accounts that violate these Terms or engage in misuse of the service.
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-2">8) Disclaimer & Limitation of Liability</h2>
          <p>
            SkyDeckPro provides study tools as supplementary resources. We are not responsible for regulatory or 
            operational decisions made based on this content. To the maximum extent permitted by law, liability for damages is limited.
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-2">9) Governing Law</h2>
          <p>
            These Terms are governed by and construed in accordance with the laws of the Republic of Indonesia.
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-2">10) Changes to Terms</h2>
          <p>
            We may revise these Terms periodically. Continued use after updates constitutes acceptance of the new Terms.
          </p>
        </div>
      )}
    </div>
  );
}
