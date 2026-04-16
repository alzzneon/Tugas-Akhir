import Header from "../../../Components/Public/Header";
import Footer from "../../../Components/Public/Footer";

export default function KebijakanPrivasi() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800">
      <Header />

      <main className="flex-1 py-20 px-6">
        <article className="max-w-3xl mx-auto">
          {/* Header Section */}
          <header className="mb-16">
            <div className="inline-block px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
              Privasi Anda Prioritas Kami
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">
              Kebijakan Privasi
            </h1>
            <p className="text-slate-500 text-lg leading-relaxed">
              RentCare berkomitmen penuh untuk melindungi kerahasiaan data pribadi yang Anda percayakan kepada kami.
            </p>
          </header>

          <div className="space-y-12">
            {/* Data Collection */}
            <section className="group">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4 group-hover:text-red-600 transition-colors">
                Data yang Dikumpulkan
              </h2>
              <p className="text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-xl border border-slate-100">
                Informasi yang kami ambil meliputi nama lengkap, alamat email, nomor telepon aktif, alamat domisili, serta dokumen identitas yang diperlukan untuk verifikasi sewa.
              </p>
            </section>

            {/* Usage */}
            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">
                Penggunaan Data
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-600">
                {[
                  "Memproses pengajuan sewa kendaraan.",
                  "Verifikasi identitas pelanggan.",
                  "Update status penyewaan berkala.",
                  "Peningkatan kualitas layanan."
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className="text-red-600 mt-1">✦</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Protection */}
            <section className="border-t border-slate-100 pt-12">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">
                Perlindungan Data
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Kami menerapkan standar keamanan sistem untuk mencegah akses tidak sah, perubahan data, maupun kebocoran informasi pribadi pelanggan kepada pihak ketiga yang tidak berkepentingan.
              </p>
            </section>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}