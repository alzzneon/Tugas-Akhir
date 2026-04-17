import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    address: "",
    password: "",
    password_confirmation: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axios.post("http://127.0.0.1:8000/api/register", form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/");
    } catch (err) {
      if (err.response?.data?.errors) {
        const firstError = Object.values(err.response.data.errors);
        setError(firstError);
      } else {
        setError(err.response?.data?.message || "Pendaftaran gagal.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 font-sans">
      <div className="w-full max-w-xl">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 md:p-12">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-slate-900">Buat Akun Baru</h1>
            <p className="text-slate-500 mt-2">Lengkapi data untuk kemudahan verifikasi sewa</p>
          </div>

          {error && (
            <div className="mb-8 bg-red-50 text-red-600 px-5 py-3 rounded-2xl text-sm border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <div className="md:col-span-2">
              <label className="block mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nama Lengkap</label>
              <input
                name="full_name"
                type="text"
                value={form.full_name}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-red-600/10 focus:border-red-600 transition-all"
                placeholder="Sesuai KTP"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-red-600/10 focus:border-red-600 transition-all"
                placeholder="nama@email.com"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nomor HP</label>
              <input
                name="phone_number"
                type="text"
                value={form.phone_number}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-red-600/10 focus:border-red-600 transition-all"
                placeholder="0812..."
                required
              />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Alamat Domisili</label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-red-600/10 focus:border-red-600 transition-all"
                placeholder="Alamat lengkap saat ini"
                rows="2"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-red-600/10 focus:border-red-600 transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Konfirmasi</label>
              <input
                name="password_confirmation"
                type="password"
                value={form.password_confirmation}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-red-600/10 focus:border-red-600 transition-all"
                placeholder="Ulangi password"
                required
              />
            </div>

            <div className="md:col-span-2 mt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold hover:bg-slate-900 transition-all duration-300 shadow-lg shadow-red-100 disabled:opacity-50"
              >
                {loading ? "Mendaftarkan Akun..." : "Daftar Akun Sekarang"}
              </button>
              <p className="text-center mt-6 text-sm text-slate-500">
                Sudah memiliki akun?{" "}
                <Link to="/login" className="text-red-600 font-bold hover:underline">
                  Login di sini
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}