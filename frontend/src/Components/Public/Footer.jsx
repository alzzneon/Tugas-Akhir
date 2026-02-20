import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white px-12 py-12 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">RentCare</h3>
          <p className="text-gray-400 leading-relaxed text-sm">
            Layanan penyewaan kendaraan terpercaya dengan armada terlengkap dan
            proses yang mudah.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Tautan Cepat</h4>
          <div className="flex flex-col gap-2">
            <Link to="/tentang" className="text-gray-400 hover:text-white text-sm">
              Tentang Perusahaan
            </Link>
            <Link to="/syarat" className="text-gray-400 hover:text-white text-sm">
              Syarat dan Ketentuan
            </Link>
            <Link to="/faq" className="text-gray-400 hover:text-white text-sm">
              FAQ
            </Link>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Kendaraan</h4>
          <div className="flex flex-col gap-2">
            <Link to="/mobil" className="text-gray-400 hover:text-white text-sm">
              Mobil
            </Link>
            <Link to="/motor" className="text-gray-400 hover:text-white text-sm">
              Motor
            </Link>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Kontak</h4>
          <div className="flex flex-col gap-2 text-gray-400 text-sm">
            <span>+62 812-3456-7890</span>
            <span>info@rentcare.com</span>
            <span>Jakarta, Indonesia</span>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800 pt-6 text-center text-gray-400 text-sm">
        2025 RentCare. All rights reserved.
      </div>
    </footer>
  );
}
