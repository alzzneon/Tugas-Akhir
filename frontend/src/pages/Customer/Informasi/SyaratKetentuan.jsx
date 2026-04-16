import Header from "../../../Components/Public/Header";
import Footer from "../../../Components/Public/Footer";

export default function SyaratKetentuan() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800">
      <Header />

      <main className="flex-1 py-20 px-6">
        <article className="max-w-3xl mx-auto">
          {/* Header Section */}
          <header className="mb-16 border-b border-slate-100 pb-10">
            <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">
              Syarat dan Ketentuan
            </h1>
            <p className="text-slate-500 text-lg">
              Harap baca dengan seksama sebelum melakukan pengajuan penyewaan di RentCare.
            </p>
          </header>

          <div className="space-y-16">
            {/* Ketentuan Umum */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                <span className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center text-xs mr-4">01</span>
                Ketentuan Umum
              </h2>
              <ul className="space-y-4 text-slate-600 ml-12 list-none">
                <li className="flex gap-3">
                  <span className="text-red-600">•</span>
                  Pelanggan wajib mengisi data pengajuan dengan benar dan jujur.
                </li>
                <li className="flex gap-3">
                  <span className="text-red-600">•</span>
                  Setiap pengajuan sewa akan melewati proses verifikasi oleh tim admin.
                </li>
                <li className="flex gap-3">
                  <span className="text-red-600">•</span>
                  Kendaraan tidak tersedia untuk tanggal yang sudah dipesan oleh pengguna lain.
                </li>
              </ul>
            </section>

            {/* Kewajiban Pelanggan */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                <span className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center text-xs mr-4">02</span>
                Kewajiban Pelanggan
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ml-12">
                {[
                  "Menjaga kondisi fisik dan mesin kendaraan.",
                  "Penggunaan unit hanya untuk tujuan legal.",
                  "Pengembalian tepat waktu sesuai kesepakatan.",
                  "Tanggung jawab atas kelalaian penggunaan."
                ].map((text, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-lg text-sm text-slate-700 border-l-2 border-slate-200">
                    {text}
                  </div>
                ))}
              </div>
            </section>

            {/* Denda */}
            <section className="bg-red-50 p-8 rounded-2xl ml-12">
              <h3 className="text-lg font-bold text-red-900 mb-2">Keterlambatan Pengembalian</h3>
              <p className="text-red-800 leading-relaxed opacity-90">
                Keterlambatan yang melebihi batas waktu akan dikenakan denda administratif sesuai dengan kebijakan yang berlaku di sistem kami.
              </p>
            </section>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}