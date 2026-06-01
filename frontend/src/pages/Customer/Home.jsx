import { Link } from "react-router-dom";
import Header from "../../Components/Public/Header";
import Footer from "../../Components/Public/Footer";

const features = [
  {
    num: "01",
    title: "Harga Transparan",
    desc: "Estimasi biaya jelas sejak awal tanpa biaya tambahan yang disembunyikan.",
  },
  {
    num: "02",
    title: "Unit Terawat",
    desc: "Inspeksi rutin dan kebersihan unit terjamin untuk kenyamanan perjalanan Anda.",
  },
  {
    num: "03",
    title: "Proses Digital",
    desc: "Booking dan verifikasi dokumen dilakukan sepenuhnya secara online.",
  },
];

const vehicles = [
  {
    href: "/mobil",
    bgClass: "bg-red-50",
    title: "Sewa Mobil",
    desc: "Cocok untuk keluarga, perjalanan jauh, atau kebutuhan bisnis. Pilihan unit lengkap dari city car hingga SUV.",
  },
  {
    href: "/motor",
    bgClass: "bg-slate-50",
    title: "Sewa Motor",
    desc: "Fleksibel dan hemat untuk mobilitas harian. Matic, sport, hingga touring tersedia dengan harga terjangkau.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-slate-800">
      <Header />

      <section className="relative bg-white overflow-hidden border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center relative z-10">
          <span className="inline-block bg-red-50 text-red-600 text-xs font-semibold tracking-widest uppercase px-3 py-1.5 rounded mb-6">
            Premium Rental Service
          </span>
          <h1 
            className="text-5xl md:text-6xl font-extrabold leading-tight tracking-tight text-slate-900 mb-6"
            style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "1px" }}
          >
            Sewa Mobil & Motor <span className="text-red-600">Tanpa Ribet</span>
          </h1>
          <p className="text-sm md:text-base text-slate-500 leading-relaxed mb-8 max-w-md mx-auto">
            Proses verifikasi cepat dengan armada kendaraan keluaran terbaru.
            Siap menemani perjalanan Anda kapan saja.
          </p>

          {/* CTA Buttons */}
          <div className="flex justify-center gap-4">
            <Link
              to="/mobil"
              className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Sewa Mobil
            </Link>
            <Link
              to="/motor"
              className="border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Sewa Motor
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl font-extrabold text-slate-900 mb-2"
              style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "1px", fontSize: "34px" }}
            >
              Pilih Kendaraan Anda
            </h2>
            <p className="text-sm text-slate-400">
              Dua pilihan utama, satu pengalaman terbaik.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {vehicles.map((v, i) => (
              <Link
                key={i}
                to={v.href}
                className="group bg-white border border-slate-100 rounded-xl overflow-hidden hover:shadow-md transition-all duration-200 block"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3
                      className="text-xl font-extrabold text-slate-900"
                      style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.5px", fontSize: "22px" }}
                    >
                      {v.title}
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-red-600 bg-red-50 px-2 py-0.5 rounded">
                      Tersedia
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-6">{v.desc}</p>
                  <span className="text-xs font-semibold text-red-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Lihat semua unit &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-3xl font-extrabold text-slate-900 mb-12 text-center"
            style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "1px", fontSize: "34px" }}
          >
            Kenapa Pilih Kami?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="relative pl-8 border-l border-slate-100">
                <div className="absolute left-0 top-0 text-xs font-mono text-red-500 tracking-widest">
                  {f.num}
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}