export default function RefundPolicy() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Kebijakan Pengembalian Dana</h1>
      <p className="mb-4">Produk SkyDeckPro adalah konten digital. Oleh karena itu, kebijakan refund berlaku dengan ketentuan berikut:</p>

      <ul className="list-disc ml-6 space-y-2 text-gray-700">
        <li>Refund <b>tidak berlaku</b> setelah akses diberikan.</li>
        <li>Refund hanya diberikan apabila:
          <ul className="list-disc ml-6">
            <li>Pembayaran ganda (double payment).</li>
            <li>Kesalahan teknis dari sistem (akses gagal).</li>
          </ul>
        </li>
        <li>Refund diproses manual dalam waktu maksimal 7 hari kerja.</li>
      </ul>
    </div>
  );
}
