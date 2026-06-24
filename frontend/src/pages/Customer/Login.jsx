import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const API_BASE = "http://127.0.0.1:8000/api";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    phone_number: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "phone_number" ? value.replace(/[^\d+]/g, "") : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axios.post(`${API_BASE}/login`, {
        phone_number: form.phone_number.trim(),
        password: form.password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      if (
        res.data.user.role === "admin" ||
        res.data.user.role === "super_admin"
      ) {
        navigate("/admin/dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Nomor HP atau password belum sesuai. Silakan coba lagi."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F0F0F0] px-6 font-sans">
      <div className="w-full max-w-[420px]">
        {/* Brand */}
        <div className="mb-7 text-center">
          <div className="inline-flex items-center mb-3">
            <span className="text-xl font-extrabold text-red-700 tracking-[0.12em] uppercase">
              AMBRINA
            </span>
            <span className="ml-2 text-xl font-extrabold text-red-700 tracking-[0.12em] uppercase">
              RENTAL
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#E0E0E0] border-t-4 border-t-[#C8102E] rounded-2xl shadow-sm overflow-hidden">
          {/* Card header */}
          <div className="px-6 py-5 bg-[#FAFAFA] border-b border-[#EEEEEE]">
            <p className="text-[15px] font-extrabold text-[#1A1A1A] tracking-[0.02em]">
              Selamat Datang
            </p>
            <p className="mt-1 text-[12px] text-[#888888] leading-relaxed">
              Silakan masuk untuk melihat pesanan dan melanjutkan penyewaan
              kendaraan Anda.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-6 flex flex-col gap-4">
            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-[#888888] uppercase tracking-[0.12em]">
                Nomor HP
              </label>
              <input
                type="text"
                name="phone_number"
                value={form.phone_number}
                onChange={handleChange}
                placeholder="08123456789"
                className="w-full px-3.5 py-3 text-[13px] text-[#1A1A1A] bg-[#F5F5F5] border border-[#DDDDDD] rounded-xl outline-none focus:border-[#C8102E] focus:bg-white transition-colors"
                required
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-[#888888] uppercase tracking-[0.12em]">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[10px] font-bold text-[#C8102E] tracking-[0.05em] hover:underline"
                >
                  Lupa Password?
                </Link>
              </div>

              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Masukkan password"
                className="w-full px-3.5 py-3 text-[13px] text-[#1A1A1A] bg-[#F5F5F5] border border-[#DDDDDD] rounded-xl outline-none focus:border-[#C8102E] focus:bg-white transition-colors"
                required
              />
            </div>

            {/* Error */}
            {error && (
              <div className="px-3.5 py-2.5 text-[12px] font-semibold text-[#C8102E] bg-[#FFF5F5] border border-[#F5CCCC] border-l-4 border-l-[#C8102E] rounded-xl tracking-[0.02em]">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 text-[12px] font-bold text-white uppercase tracking-[0.08em] bg-[#C8102E] rounded-xl disabled:bg-[#888888] disabled:cursor-not-allowed hover:opacity-95 transition"
            >
              {loading ? "Sedang masuk..." : "Masuk Sekarang"}
            </button>
          </form>

          {/* Register link */}
          <div className="px-6 py-4 bg-[#FAFAFA] border-t border-[#EEEEEE] text-center">
            <p className="text-[11px] text-[#888888]">
              Belum memiliki akun?{" "}
              <Link
                to="/register"
                className="text-[11px] font-bold text-[#C8102E] uppercase tracking-[0.03em] hover:underline"
              >
                Daftar Sekarang
              </Link>
            </p>
          </div>
        </div>

        {/* Copyright */}
        <p className="mt-5 text-center text-[10px] text-[#BBBBBB] uppercase tracking-[0.12em]">
          © 2026 Ambrina Rental. All Rights Reserved.
        </p>
      </div>
    </div>
  );
}