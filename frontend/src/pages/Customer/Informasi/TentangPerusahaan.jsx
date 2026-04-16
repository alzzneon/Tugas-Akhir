import Header from "../../../Components/Public/Header";
import Footer from "../../../Components/Public/Footer";

export default function TentangPerusahaan() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1">
        {/* Simple Hero */}
        <section className="bg-slate-900 text-white py-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-6">Membantu Mobilitas Anda <br/>Sejak 2020</h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              RentCare lahir dari keinginan untuk memberikan layanan transportasi yang transparan, mudah, dan bisa diandalkan oleh siapa saja.
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-6">Visi Kami</h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                Menjadi standar baru dalam industri penyewaan kendaraan di Indonesia melalui integrasi teknologi yang memudahkan pengguna.
              </p>
              <div className="h-1 w-20 bg-red-600"></div>
            </div>
            <div className="bg-slate-50 p-10 rounded-2xl">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Komitmen Layanan</h2>
              <ul className="space-y-4">
                {["Ketersediaan Unit Real-time", "Dukungan Pelanggan 24/7", "Asuransi Perjalanan", "Tanpa Biaya Tersembunyi"].map((item, i) => (
                  <li key={i} className="flex items-center text-slate-700">
                    <span className="text-red-600 mr-3">✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}