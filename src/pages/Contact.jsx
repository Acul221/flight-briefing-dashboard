export default function Contact() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Kontak Kami</h1>
      <p className="mb-2">Hubungi kami jika ada pertanyaan atau kendala:</p>

      <ul className="space-y-2 text-gray-700">
        <li>Email: <a href="mailto:skydeckpro@gmail.com" className="text-blue-600">skydeckpro@gmail.com</a></li>
        <li>WhatsApp: <a href="https://wa.me/6281219828080" target="_blank" className="text-blue-600">+62 812-1982-8080</a></li>
        <li>Alamat: Menteng, Jakarta Pusat (sesuai data pendaftaran)</li>
      </ul>
    </div>
  );
}
