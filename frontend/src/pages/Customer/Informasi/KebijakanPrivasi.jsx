import Header from "../../../Components/Public/Header";
import Footer from "../../../Components/Public/Footer";

export default function KebijakanPrivasi() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <section className="bg-red-500 text-white py-16 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Kebijakan Privasi</h1>
          <p className="text-lg leading-relaxed">
            RentCare berkomitmen untuk menjaga keamanan dan kerahasiaan data
            pribadi pelanggan.
          </p>
        </div>
      </section>

      <main className="flex-1 py-12 px-6 md:px-12">
        <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Data yang Dikumpulkan
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Kami dapat mengumpulkan data seperti nama, email, nomor telepon,
              alamat, dan informasi lain yang dibutuhkan untuk proses pengajuan
              penyewaan kendaraan.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Penggunaan Data
            </h2>
            <ul className="list-disc pl-6 text-gray-700 leading-relaxed space-y-2">
              <li>Memproses pengajuan penyewaan kendaraan.</li>
              <li>Melakukan verifikasi data pelanggan.</li>
              <li>Memberikan informasi terkait status penyewaan.</li>
              <li>Meningkatkan kualitas layanan RentCare.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Perlindungan Data
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Kami berupaya menjaga data pelanggan dari akses, penggunaan, atau
              perubahan yang tidak sah dengan menerapkan langkah pengamanan yang
              wajar pada sistem.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}