import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const API_BASE = "http://127.0.0.1:8000/api";

export default function Register() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    address: "",
    password: "",
    password_confirmation: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleFormChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

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

  /*
  |--------------------------------------------------------------------------
  | SEND OTP WA
  |--------------------------------------------------------------------------
  */

  const handleSendOtp = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await axios.post(`${API_BASE}/register/send-otp`, {
        phone_number: phoneNumber,
      });

      setMessage(
        res.data.message || "Kode OTP berhasil dikirim ke WhatsApp."
      );

      setStep(2);
    } catch (err) {
      setError(getErrorMessage(err, "Gagal mengirim kode OTP."));
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | VERIFY OTP WA
  |--------------------------------------------------------------------------
  */

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await axios.post(`${API_BASE}/register/verify-otp`, {
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

  /*
  |--------------------------------------------------------------------------
  | RESEND OTP
  |--------------------------------------------------------------------------
  */

  const handleResendOtp = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await axios.post(`${API_BASE}/register/resend-otp`, {
        phone_number: phoneNumber,
      });

      setMessage(res.data.message || "OTP baru berhasil dikirim.");
    } catch (err) {
      setError(getErrorMessage(err, "Gagal mengirim ulang OTP."));
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | COMPLETE REGISTER
  |--------------------------------------------------------------------------
  */

  const handleCompleteRegister = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        full_name: form.full_name,
        email: form.email || null,
        phone_number: phoneNumber,
        address: form.address,
        password: form.password,
        password_confirmation: form.password_confirmation,
      };

      const res = await axios.post(
        `${API_BASE}/register/complete`,
        payload
      );

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setMessage(res.data.message || "Register berhasil.");

      navigate("/");
    } catch (err) {
      setError(getErrorMessage(err, "Pendaftaran akun gagal."));
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | STEP INDICATOR
  |--------------------------------------------------------------------------
  */

  const renderStepIndicator = () => {
    const items = [
      { no: 1, label: "Nomor HP" },
      { no: 2, label: "OTP WA" },
      { no: 3, label: "Data Diri" },
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
              Buat Akun Customer
            </h1>

            <p className="mt-2 text-slate-500">
              Registrasi menggunakan nomor WhatsApp dan verifikasi OTP
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

          {/* STEP 1 */}
          {step === 1 && (
            <form
              onSubmit={handleSendOtp}
              autoComplete="off"
              className="space-y-5"
            >
              <div>
                <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Nomor WhatsApp
                </label>

                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) =>
                    setPhoneNumber(
                      e.target.value.replace(/\D/g, "").slice(0, 15)
                    )
                  }
                  autoComplete="tel"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 outline-none transition-all focus:border-red-600 focus:bg-white focus:ring-2 focus:ring-red-600/10"
                  placeholder="08123456789"
                  required
                />
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

          {/* STEP 2 */}
          {step === 2 && (
            <form
              onSubmit={handleVerifyOtp}
              autoComplete="off"
              className="space-y-5"
            >
              <div>
                <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Nomor WhatsApp
                </label>

                <input
                  type="text"
                  value={phoneNumber}
                  disabled
                  autoComplete="off"
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
                    setOtp(
                      e.target.value.replace(/\D/g, "").slice(0, 6)
                    )
                  }
                  autoComplete="one-time-code"
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
                Ganti nomor WhatsApp
              </button>
            </form>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <form
              onSubmit={handleCompleteRegister}
              autoComplete="off"
              className="grid grid-cols-1 gap-5 md:grid-cols-2"
            >
              {/* Dummy input untuk mencegah Chrome Autofill masuk ke field asli */}
              <input
                type="text"
                name="fake_username"
                autoComplete="username"
                className="absolute -left-[9999px] h-0 w-0 opacity-0"
                tabIndex={-1}
                aria-hidden="true"
              />

              <input
                type="password"
                name="fake_password"
                autoComplete="current-password"
                className="absolute -left-[9999px] h-0 w-0 opacity-0"
                tabIndex={-1}
                aria-hidden="true"
              />

              <div className="md:col-span-2">
                <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Nomor WhatsApp
                </label>

                <input
                  type="text"
                  value={phoneNumber}
                  disabled
                  autoComplete="off"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-5 py-3 text-slate-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Nama Lengkap
                </label>

                <input
                  name="full_name"
                  type="text"
                  value={form.full_name}
                  onChange={handleFormChange}
                  autoComplete="off"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 outline-none transition-all focus:border-red-600 focus:bg-white focus:ring-2 focus:ring-red-600/10"
                  placeholder="Sesuai KTP"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Email (Opsional)
                </label>

                <input
                  name="customer_contact_email"
                  type="text"
                  inputMode="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 outline-none transition-all focus:border-red-600 focus:bg-white focus:ring-2 focus:ring-red-600/10"
                  placeholder="nama@email.com"
                />
              </div>

              <div>
                <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Password
                </label>

                <input
                  name="customer_new_password"
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 outline-none transition-all focus:border-red-600 focus:bg-white focus:ring-2 focus:ring-red-600/10"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Konfirmasi Password
                </label>

                <input
                  name="customer_confirm_password"
                  type="password"
                  value={form.password_confirmation}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      password_confirmation: e.target.value,
                    }))
                  }
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 outline-none transition-all focus:border-red-600 focus:bg-white focus:ring-2 focus:ring-red-600/10"
                  placeholder="Ulangi password"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Alamat Domisili
                </label>

                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleFormChange}
                  autoComplete="off"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 outline-none transition-all focus:border-red-600 focus:bg-white focus:ring-2 focus:ring-red-600/10"
                  placeholder="Alamat lengkap saat ini"
                  rows="2"
                  required
                />
              </div>

              <div className="mt-4 md:col-span-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-red-600 py-4 font-bold text-white shadow-lg shadow-red-100 transition-all duration-300 hover:bg-slate-900 disabled:opacity-50"
                >
                  {loading
                    ? "Mendaftarkan Akun..."
                    : "Daftar Akun Sekarang"}
                </button>

                <p className="mt-6 text-center text-sm text-slate-500">
                  Sudah memiliki akun?{" "}
                  <Link
                    to="/login"
                    className="font-bold text-red-600 hover:underline"
                  >
                    Login di sini
                  </Link>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}