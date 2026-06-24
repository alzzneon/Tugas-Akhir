import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function LoginAdmin() {
  const navigate = useNavigate();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  function handlePhoneChange(value) {
    setPhoneNumber(value.replace(/[^\d+]/g, ""));
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const res = await fetch("http://127.0.0.1:8000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          phone_number: phoneNumber.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data.message || "Login gagal.");
        return;
      }

      const role = data.user?.role;

      if (role !== "admin" && role !== "super_admin") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setMsg("Akun ini belum memiliki akses sebagai administrator.");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/admin/dashboard", { replace: true });
    } catch {
      setMsg("Belum dapat terhubung ke server. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

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
              Selamat Datang Admin
            </p>
            <p className="mt-1 text-[12px] text-[#888888] leading-relaxed">
              Silakan masuk untuk mengelola data penyewaan Ambrina Rental.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="px-6 py-6 flex flex-col gap-4">
            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-[#888888] uppercase tracking-[0.12em]">
                Nomor WhatsApp
              </label>
              <input
                type="tel"
                placeholder="08123456789"
                value={phoneNumber}
                onChange={(e) => handlePhoneChange(e.target.value)}
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
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-3 text-[13px] text-[#1A1A1A] bg-[#F5F5F5] border border-[#DDDDDD] rounded-xl outline-none focus:border-[#C8102E] focus:bg-white transition-colors"
                required
              />
            </div>

            {/* Error */}
            {msg && (
              <div className="px-3.5 py-2.5 text-[12px] font-semibold text-[#C8102E] bg-[#FFF5F5] border border-[#F5CCCC] border-l-4 border-l-[#C8102E] rounded-xl tracking-[0.02em]">
                {msg}
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

          {/* Footer note */}
          <div className="px-6 py-4 bg-[#FAFAFA] border-t border-[#EEEEEE]">
            <p className="text-[10px] text-[#BBBBBB] text-center leading-relaxed tracking-[0.04em]">
              Gunakan akun administrator yang sudah terdaftar.
            </p>
          </div>
        </div>

        {/* Copyright */}
        <p className="mt-5 text-center text-[10px] text-[#BBBBBB] uppercase tracking-[0.12em]">
          © 2026 Ambrina Rental.
        </p>
      </div>
    </div>
  );
}