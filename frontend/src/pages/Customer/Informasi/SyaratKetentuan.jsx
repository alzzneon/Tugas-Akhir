import Header from "../../../Components/Public/Header";
import Footer from "../../../Components/Public/Footer";

export default function SyaratKetentuan() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <section className="bg-red-500 text-white py-16 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Syarat dan Ketentuan</h1>
          <p className="text-lg leading-relaxed">
            Mohon baca syarat dan ketentuan berikut sebelum melakukan
            pengajuan penyewaan kendaraan di RentCare.
          </p>
        </div>
      </section>

      <main className="flex-1 py-12 px-6 md:px-12">
        <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Ketentuan Umum
            </h2>
            <ul className="list-disc pl-6 text-gray-700 leading-relaxed space-y-2">
              <li>Pelanggan wajib mengisi data pengajuan dengan benar.</li>
              <li>Pengajuan sewa akan diproses terlebih dahulu oleh admin.</li>
              <li>
                Kendaraan tidak dapat diajukan pada tanggal yang bentrok dengan
                penyewaan lain.
              </li>
              <li>
                Harga sewa dan ketentuan pembayaran mengikuti informasi pada
                sistem.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Kewajiban Pelanggan
            </h2>
            <ul className="list-disc pl-6 text-gray-700 leading-relaxed space-y-2">
              <li>Menjaga kondisi kendaraan selama masa sewa.</li>
              <li>Menggunakan kendaraan sesuai peruntukannya.</li>
              <li>Mengembalikan kendaraan tepat waktu.</li>
              <li>
                Bertanggung jawab atas kerusakan akibat kelalaian penggunaan.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Keterlambatan Pengembalian
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Apabila kendaraan dikembalikan melebihi waktu yang telah
              ditentukan, maka pelanggan dapat dikenakan denda sesuai kebijakan
              perusahaan.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}