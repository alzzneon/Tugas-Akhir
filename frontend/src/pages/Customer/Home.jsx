import Header from "../../Components/Public/Header";
import Footer from "../../Components/Public/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="bg-red-500 text-white py-20 px-12 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-4 leading-tight">
            Sewa Mobil & Motor Mudah dan Cepat
          </h1>
          <p className="text-lg mb-8 opacity-95">
            Platform penyewaan kendaraan terpercaya dengan proses yang mudah dan
            harga transparan
          </p>
          <button className="bg-white text-red-500 px-8 py-3.5 rounded-lg font-semibold hover:bg-gray-50">
            Sewa Sekarang
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-12 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-center text-3xl font-bold mb-12 text-gray-900">
            Mengapa Pilih Kami?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl text-center border border-gray-200">
              <div className="text-4xl mb-4 text-red-500">$</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">
                Harga Transparan
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Tidak ada biaya tersembunyi. Semua harga jelas dan tertera di website
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl text-center border border-gray-200">
              <div className="text-4xl mb-4 text-red-500">🔧</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">
                Kendaraan Terawat
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Semua kendaraan dalam kondisi prima dan dirawat secara berkala
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl text-center border border-gray-200">
              <div className="text-4xl mb-4 text-red-500">⚡</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">
                Proses Mudah
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Booking online yang cepat dengan proses yang sederhana
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
