import { useState } from "react";
import { Link } from "react-router-dom";

export default function Header() {
  const [showInfoDropdown, setShowInfoDropdown] = useState(false);
  const [showKendaraanDropdown, setShowKendaraanDropdown] = useState(false);
  const [showAkunDropdown, setShowAkunDropdown] = useState(false);

  const isLoggedIn = false; // TODO: ganti dari state/context

  return (
    <header className="relative z-50 bg-white border-b border-gray-200 px-12 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
            <span className="text-white font-bold">R</span>
          </div>
          <span className="text-xl font-bold text-gray-900">RentCare</span>
        </div>

        <nav className="flex gap-8 items-center">
          <Link to="/" className="text-gray-900 font-medium hover:text-red-500">
            Beranda
          </Link>

          {/* ✅ Informasi dropdown (FIX: hover di wrapper) */}
          <div
            className="relative"
            onMouseEnter={() => setShowInfoDropdown(true)}
            onMouseLeave={() => setShowInfoDropdown(false)}
          >
            <button className="text-gray-900 font-medium hover:text-red-500">
              Informasi ▾
            </button>

            {showInfoDropdown && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[200px] py-2 z-50">
                <Link
                  to="/tentang"
                  className="block px-5 py-3 text-gray-900 hover:bg-gray-50"
                >
                  Tentang Perusahaan
                </Link>
                <Link
                  to="/syarat"
                  className="block px-5 py-3 text-gray-900 hover:bg-gray-50"
                >
                  Syarat dan Ketentuan
                </Link>
                <Link
                  to="/kebijakan"
                  className="block px-5 py-3 text-gray-900 hover:bg-gray-50"
                >
                  Kebijakan Privasi
                </Link>
                <Link
                  to="/faq"
                  className="block px-5 py-3 text-gray-900 hover:bg-gray-50"
                >
                  FAQ
                </Link>
              </div>
            )}
          </div>

          {/* ✅ Kendaraan dropdown (FIX: hover di wrapper) */}
          <div
            className="relative"
            onMouseEnter={() => setShowKendaraanDropdown(true)}
            onMouseLeave={() => setShowKendaraanDropdown(false)}
          >
            <button className="text-gray-900 font-medium hover:text-red-500">
              Kendaraan ▾
            </button>

            {showKendaraanDropdown && (
              <div className="absolute top-full left-0 pt-2 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[160px] py-2 z-50">
                <Link
                  to="/mobil"
                  className="block px-5 py-3 text-gray-900 hover:bg-gray-50"
                >
                  Mobil
                </Link>
                <Link
                  to="/motor"
                  className="block px-5 py-3 text-gray-900 hover:bg-gray-50"
                >
                  Motor
                </Link>
              </div>
            )}
          </div>

          {/* ✅ Conditional Akun/Username */}
          {isLoggedIn ? (
            <div
              className="relative"
              onMouseEnter={() => setShowAkunDropdown(true)}
              onMouseLeave={() => setShowAkunDropdown(false)}
            >
              <button className="text-gray-900 font-medium hover:text-red-500">
                Username ▾
              </button>

              {showAkunDropdown && (
                <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[160px] py-2 z-50">
                  <Link
                    to="/profil"
                    className="block px-5 py-3 text-gray-900 hover:bg-gray-50"
                  >
                    Profil
                  </Link>
                  <Link
                    to="/riwayat"
                    className="block px-5 py-3 text-gray-900 hover:bg-gray-50"
                  >
                    Riwayat
                  </Link>
                  <hr className="my-2 border-gray-200" />
                  <button className="block w-full text-left px-5 py-3 text-red-500 hover:bg-gray-50">
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="text-gray-900 font-medium hover:text-red-500"
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
