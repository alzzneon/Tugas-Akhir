import Header from "../../../Components/Public/Header";
import Footer from "../../../Components/Public/Footer";

export default function TentangPerusahaan() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <section className="bg-red-500 text-white py-16 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Tentang Perusahaan</h1>
          <p className="text-lg leading-relaxed">
            RentCare adalah layanan penyewaan kendaraan yang menyediakan mobil
            dan motor dengan proses pemesanan yang mudah, aman, dan nyaman.
          </p>
        </div>
      </section>

      <main className="flex-1 py-12 px-6 md:px-12">
        <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              Siapa Kami
            </h2>
            <p className="text-gray-700 leading-relaxed">
              RentCare hadir untuk membantu pelanggan mendapatkan kendaraan
              sewa dengan cepat dan praktis. Kami berfokus pada kemudahan
              pengajuan sewa, kejelasan informasi kendaraan, serta pelayanan
              yang profesional.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Visi</h2>
            <p className="text-gray-700 leading-relaxed">
              Menjadi platform penyewaan kendaraan terpercaya yang memberikan
              pengalaman sewa yang mudah, aman, dan transparan.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Misi</h2>
            <ul className="list-disc pl-6 text-gray-700 leading-relaxed space-y-2">
              <li>Menyediakan kendaraan yang layak dan terawat.</li>
              <li>Memberikan proses pengajuan sewa yang sederhana.</li>
              <li>Menjaga transparansi informasi harga dan status sewa.</li>
              <li>Memberikan pelayanan yang responsif kepada pelanggan.</li>
            </ul>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}