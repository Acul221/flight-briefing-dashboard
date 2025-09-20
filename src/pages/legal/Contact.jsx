import { useState } from "react";

export default function Contact() {
  const [lang, setLang] = useState("id"); // default Indonesia

  return (
    <div className="max-w-3xl mx-auto p-6">
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
          <h1 className="text-2xl font-bold mb-4">Kontak Kami</h1>
          <p className="mb-2">
            Kami siap membantu Anda. Hubungi kami melalui:
          </p>

          <ul className="space-y-2 text-gray-700">
            <li>
              Email:{" "}
              <a
                href="mailto:support@skydeckpro.id"
                className="text-blue-600"
              >
                support@skydeckpro.id
              </a>
            </li>
            <li>
              WhatsApp:{" "}
              <a
                href="https://wa.me/6281219828080"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600"
              >
                +62 812-1982-8080
              </a>
            </li>
            <li>
              Alamat: Menteng, Jakarta Pusat (sesuai pendaftaran usaha/virtual
              office)
            </li>
          </ul>
        </div>
      ) : (
        <div>
          <h1 className="text-2xl font-bold mb-4">Contact Us</h1>
          <p className="mb-2">We’re here to help. Reach us via:</p>

          <ul className="space-y-2 text-gray-700">
            <li>
              Email:{" "}
              <a
                href="mailto:support@skydeckpro.id"
                className="text-blue-600"
              >
                support@skydeckpro.id
              </a>
            </li>
            <li>
              WhatsApp:{" "}
              <a
                href="https://wa.me/6281219828080"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600"
              >
                +62 812-1982-8080
              </a>
            </li>
            <li>
              Address: Menteng, Central Jakarta (as per business registration /
              virtual office)
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
