import Header from "../../Components/Public/Header";
import Footer from "../../Components/Public/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-slate-800">
      <Header />

      {/* Hero Section */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-red-600 font-semibold tracking-widest uppercase text-sm mb-4 block">Premium Rental Service</span>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight text-slate-900">
            Sewa Mobil & Motor <br/> <span className="text-red-600">Tanpa Ribet.</span>
          </h1>
          <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Proses verifikasi cepat dengan armada kendaraan keluaran terbaru. Siap menemani perjalanan Anda kapan saja.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-red-600 text-white px-10 py-4 rounded-full font-medium hover:bg-red-700 transition-all shadow-lg shadow-red-200">
              Sewa Sekarang
            </button>
            <button className="bg-white text-slate-700 border border-slate-200 px-10 py-4 rounded-full font-medium hover:bg-slate-50 transition-all">
              Lihat Armada
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: "01", title: "Harga Transparan", desc: "Estimasi biaya jelas sejak awal tanpa biaya tambahan yang disembunyikan." },
              { icon: "02", title: "Unit Terawat", desc: "Inspeksi rutin dan kebersihan unit terjamin untuk kenyamanan perjalanan Anda." },
              { icon: "03", title: "Proses Digital", desc: "Booking dan verifikasi dokumen dilakukan sepenuhnya secara online." }
            ].map((feature, idx) => (
              <div key={idx} className="group">
                <div className="text-red-600 font-mono text-xl mb-4 opacity-50 group-hover:opacity-100 transition-opacity">/ {feature.icon}</div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed text-sm md:text-base">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}