import { useState } from "react";
import { Helmet } from "react-helmet-async";

export default function RefundPolicy() {
  const [lang, setLang] = useState("id"); // default Indonesia

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Helmet>
        <title>Kebijakan Refund / Refund Policy – SkyDeckPro</title>
        <meta
          name="description"
          content="SkyDeckPro Refund Policy / Kebijakan Pengembalian Dana untuk produk digital dan langganan."
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
          <h1 className="text-2xl font-bold mb-4">Kebijakan Pengembalian Dana</h1>
          <p className="mb-4">
            SkyDeckPro menyediakan layanan pendidikan digital. Oleh karena itu,
            semua pembelian dianggap <b>final</b>. Pengembalian dana terbatas
            dan tunduk pada ketentuan berikut:
          </p>

          <ul className="list-disc ml-6 space-y-2">
            <li>
              <b>Tidak ada refund</b> setelah akses ke konten digital berbayar
              diberikan ke akun Anda, kecuali diwajibkan oleh hukum yang berlaku.
            </li>
            <li>
              Refund hanya berlaku dalam kondisi berikut:
              <ul className="list-disc ml-6 mt-2">
                <li>
                  Terdapat <b>pembayaran ganda (double payment)</b> yang
                  terkonfirmasi untuk langganan yang sama, atau
                </li>
                <li>
                  <b>Error teknis</b> dari sistem kami yang menyebabkan langganan
                  tidak aktif meskipun pembayaran berhasil.
                </li>
              </ul>
            </li>
            <li>
              Refund yang disetujui akan diproses dalam waktu{" "}
              <b>7 hari kerja</b>, menggunakan metode pembayaran yang sama,
              dalam Rupiah (IDR).
            </li>
            <li>
              Refund tidak dapat dipindahkan ke akun lain atau dikonversi
              menjadi kredit.
            </li>
            <li>
              Untuk permintaan refund, hubungi tim support di{" "}
              <a
                href="mailto:support@skydeckpro.id"
                className="text-blue-600 underline"
              >
                support@skydeckpro.id
              </a>{" "}
              dengan bukti pembayaran dan deskripsi singkat masalah.
            </li>
            <li>
              SkyDeckPro berhak mengubah Kebijakan Refund ini. Penggunaan
              berlanjut dianggap menyetujui versi terbaru.
            </li>
          </ul>
        </div>
      ) : (
        <div>
          <h1 className="text-2xl font-bold mb-4">Refund Policy</h1>
          <p className="mb-4">
            SkyDeckPro provides digital educational services. As such, all
            purchases are considered <b>final</b>. Refunds are limited and
            subject to the terms below:
          </p>

          <ul className="list-disc ml-6 space-y-2 text-gray-700">
            <li>
              <b>No refunds</b> are provided once access to paid digital content
              has been granted, except as required by applicable law.
            </li>
            <li>
              Refunds are only eligible in the following cases:
              <ul className="list-disc ml-6 mt-2">
                <li>
                  There is a confirmed <b>duplicate payment</b> for the same
                  subscription, or
                </li>
                <li>
                  A <b>technical error</b> from our system prevents activation
                  of your subscription despite successful payment.
                </li>
              </ul>
            </li>
            <li>
              Approved refunds will be processed within{" "}
              <b>7 business days</b>, using the same payment method and in
              Indonesian Rupiah (IDR).
            </li>
            <li>
              Refunds cannot be transferred to another account or converted into
              credits.
            </li>
            <li>
              To request a refund, please contact our support team at{" "}
              <a
                href="mailto:support@skydeckpro.id"
                className="text-blue-600 underline"
              >
                support@skydeckpro.id
              </a>{" "}
              with proof of payment and a brief description of the issue.
            </li>
            <li>
              SkyDeckPro reserves the right to amend this Refund Policy.
              Continued use after updates constitutes acceptance of the revised
              terms.
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
