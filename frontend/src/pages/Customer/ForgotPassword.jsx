import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = "http://127.0.0.1:8000/api";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [form, setForm] = useState({
    password: "",
    password_confirmation: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const getErrorMessage = (err, fallback = "Terjadi kesalahan.") => {
    const errors = err?.response?.data?.errors;
    if (errors) {
      const firstKey = Object.keys(errors)[0];
      if (firstKey && Array.isArray(errors[firstKey])) {
        return errors[firstKey][0];
      }
    }
    return err?.response?.data?.message || fallback;
  };

  const handleChangePassword = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await axios.post(`${API_BASE}/forgot-password/send-otp`, {
        email,
      });

      setMessage(res.data.message || "OTP berhasil dikirim ke email.");
      setStep(2);
    } catch (err) {
      setError(getErrorMessage(err, "Gagal mengirim OTP."));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await axios.post(`${API_BASE}/forgot-password/verify-otp`, {
        email,
        otp,
      });

      setMessage(res.data.message || "OTP berhasil diverifikasi.");
      setStep(3);
    } catch (err) {
      setError(getErrorMessage(err, "Verifikasi OTP gagal."));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await axios.post(`${API_BASE}/forgot-password/reset`, {
        email,
        password: form.password,
        password_confirmation: form.password_confirmation,
      });

      setMessage(res.data.message || "Password berhasil diperbarui.");

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      setError(getErrorMessage(err, "Gagal mengubah password."));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await axios.post(`${API_BASE}/forgot-password/send-otp`, {
        email,
      });

      setMessage(res.data.message || "OTP baru berhasil dikirim.");
    } catch (err) {
      setError(getErrorMessage(err, "Gagal mengirim ulang OTP."));
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => {
    const items = [
      { no: 1, label: "Email" },
      { no: 2, label: "OTP" },
      { no: 3, label: "Password Baru" },
    ];

    return (
      <div className="flex items-center justify-center gap-3 mb-8 flex-wrap">
        {items.map((item) => {
          const active = step === item.no;
          const passed = step > item.no;

          return (
            <div key={item.no} className="flex items-center gap-3">
              <div
                className={[
                  "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border",
                  passed
                    ? "bg-green-600 text-white border-green-600"
                    : active
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-white text-slate-500 border-slate-300",
                ].join(" ")}
              >
                {item.no}
              </div>
              <span
                className={[
                  "text-sm font-semibold",
                  active || passed ? "text-slate-900" : "text-slate-400",
                ].join(" ")}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 font-sans">
      <div className="w-full max-w-xl">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 md:p-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-slate-900">Lupa Password</h1>
            <p className="text-slate-500 mt-2">
              Reset password dilakukan melalui verifikasi OTP email
            </p>
          </div>

          {renderStepIndicator()}

          {message && (
            <div className="mb-6 bg-green-50 text-green-700 px-5 py-3 rounded-2xl text-sm border border-green-100">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 text-red-600 px-5 py-3 rounded-2xl text-sm border border-red-100">
              {error}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="block mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-red-600/10 focus:border-red-600 transition-all"
                  placeholder="nama@email.com"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold hover:bg-slate-900 transition-all duration-300 shadow-lg shadow-red-100 disabled:opacity-50"
              >
                {loading ? "Mengirim OTP..." : "Kirim Kode OTP"}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label className="block mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-5 py-3 text-slate-500"
                />
              </div>

              <div>
                <label className="block mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  Kode OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-red-600/10 focus:border-red-600 transition-all tracking-[0.35em] text-center text-lg font-bold"
                  placeholder="123456"
                  maxLength={6}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold hover:bg-slate-900 transition-all duration-300 shadow-lg shadow-red-100 disabled:opacity-50"
                >
                  {loading ? "Memverifikasi..." : "Verifikasi OTP"}
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="w-full bg-slate-100 text-slate-700 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all disabled:opacity-50"
                >
                  Kirim Ulang OTP
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setOtp("");
                  setMessage("");
                  setError("");
                }}
                className="w-full text-sm text-slate-500 hover:text-slate-800 transition-all"
              >
                Ganti email
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className="block mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-5 py-3 text-slate-500"
                />
              </div>

              <div>
                <label className="block mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  Password Baru
                </label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChangePassword}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-red-600/10 focus:border-red-600 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  Konfirmasi Password Baru
                </label>
                <input
                  type="password"
                  name="password_confirmation"
                  value={form.password_confirmation}
                  onChange={handleChangePassword}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-red-600/10 focus:border-red-600 transition-all"
                  placeholder="Ulangi password baru"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold hover:bg-slate-900 transition-all duration-300 shadow-lg shadow-red-100 disabled:opacity-50"
              >
                {loading ? "Menyimpan..." : "Simpan Password Baru"}
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-slate-50 text-center">
            <p className="text-slate-500 text-sm">
              Kembali ke{" "}
              <Link to="/login" className="text-red-600 font-bold hover:underline">
                halaman login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}