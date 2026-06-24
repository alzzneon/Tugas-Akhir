import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = "http://127.0.0.1:8000/api";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState("");
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

  const handlePhoneChange = (e) => {
    setPhoneNumber(e.target.value.replace(/[^\d+]/g, ""));
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
        phone_number: phoneNumber,
      });

      setMessage(
        res.data.message || "OTP berhasil dikirim ke WhatsApp."
      );

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
        phone_number: phoneNumber,
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
        phone_number: phoneNumber,
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
        phone_number: phoneNumber,
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
      { no: 1, label: "Nomor HP" },
      { no: 2, label: "OTP" },
      { no: 3, label: "Password Baru" },
    ];

    return (
      <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
        {items.map((item) => {
          const active = step === item.no;
          const passed = step > item.no;

          return (
            <div key={item.no} className="flex items-center gap-3">
              <div
                className={[
                  "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold",
                  passed
                    ? "border-green-600 bg-green-600 text-white"
                    : active
                      ? "border-red-600 bg-red-600 text-white"
                      : "border-slate-300 bg-white text-slate-500",
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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 font-sans">
      <div className="w-full max-w-xl">
        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50 md:p-12">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-black text-slate-900">
              Lupa Password
            </h1>

            <p className="mt-2 text-slate-500">
              Reset password dilakukan melalui verifikasi OTP WhatsApp
            </p>
          </div>

          {renderStepIndicator()}

          {message && (
            <div className="mb-6 rounded-2xl border border-green-100 bg-green-50 px-5 py-3 text-sm text-green-700">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Nomor HP
                </label>

                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 outline-none transition-all focus:border-red-600 focus:bg-white focus:ring-2 focus:ring-red-600/10"
                  placeholder="Contoh: 081234567890"
                  required
                />

                <p className="mt-2 text-xs text-slate-400">
                  Masukkan nomor HP yang terdaftar pada akun Anda.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-red-600 py-4 font-bold text-white shadow-lg shadow-red-100 transition-all duration-300 hover:bg-slate-900 disabled:opacity-50"
              >
                {loading ? "Mengirim OTP..." : "Kirim Kode OTP"}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Nomor HP
                </label>

                <input
                  type="tel"
                  value={phoneNumber}
                  disabled
                  className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-5 py-3 text-slate-500"
                />
              </div>

              <div>
                <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Kode OTP
                </label>

                <input
                  type="text"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-center text-lg font-bold tracking-[0.35em] outline-none transition-all focus:border-red-600 focus:bg-white focus:ring-2 focus:ring-red-600/10"
                  placeholder="123456"
                  maxLength={6}
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-red-600 py-4 font-bold text-white shadow-lg shadow-red-100 transition-all duration-300 hover:bg-slate-900 disabled:opacity-50"
                >
                  {loading ? "Memverifikasi..." : "Verifikasi OTP"}
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="w-full rounded-2xl bg-slate-100 py-4 font-bold text-slate-700 transition-all hover:bg-slate-200 disabled:opacity-50"
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
                className="w-full text-sm text-slate-500 transition-all hover:text-slate-800"
              >
                Ganti nomor HP
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Nomor HP
                </label>

                <input
                  type="tel"
                  value={phoneNumber}
                  disabled
                  className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-5 py-3 text-slate-500"
                />
              </div>

              <div>
                <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Password Baru
                </label>

                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChangePassword}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 outline-none transition-all focus:border-red-600 focus:bg-white focus:ring-2 focus:ring-red-600/10"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Konfirmasi Password Baru
                </label>

                <input
                  type="password"
                  name="password_confirmation"
                  value={form.password_confirmation}
                  onChange={handleChangePassword}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 outline-none transition-all focus:border-red-600 focus:bg-white focus:ring-2 focus:ring-red-600/10"
                  placeholder="Ulangi password baru"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-red-600 py-4 font-bold text-white shadow-lg shadow-red-100 transition-all duration-300 hover:bg-slate-900 disabled:opacity-50"
              >
                {loading ? "Menyimpan..." : "Simpan Password Baru"}
              </button>
            </form>
          )}

          <div className="mt-8 border-t border-slate-50 pt-6 text-center">
            <p className="text-sm text-slate-500">
              Kembali ke{" "}
              <Link
                to="/login"
                className="font-bold text-red-600 hover:underline"
              >
                halaman login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}