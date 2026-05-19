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
            <h1 className="text-3xl font-black text-slate-900">
              Buat Akun Customer
            </h1>

            <p className="text-slate-500 mt-2">
              Registrasi menggunakan nomor WhatsApp dan verifikasi OTP
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

          {/* STEP 1 */}

          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="block mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-red-600/10 focus:border-red-600 transition-all"
                  placeholder="08123456789"
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

          {/* STEP 2 */}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label className="block mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  Nomor WhatsApp
                </label>

                <input
                  type="text"
                  value={phoneNumber}
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
                  onChange={(e) =>
                    setOtp(
                      e.target.value.replace(/\D/g, "").slice(0, 6)
                    )
                  }
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
                Ganti nomor WhatsApp
              </button>
            </form>
          )}

          {/* STEP 3 */}

          {step === 3 && (
            <form
              onSubmit={handleCompleteRegister}
              className="grid grid-cols-1 md:grid-cols-2 gap-5"
            >
              <div className="md:col-span-2">
                <label className="block mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  Nomor WhatsApp
                </label>

                <input
                  type="text"
                  value={phoneNumber}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-5 py-3 text-slate-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  Nama Lengkap
                </label>

                <input
                  name="full_name"
                  type="text"
                  value={form.full_name}
                  onChange={handleFormChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-red-600/10 focus:border-red-600 transition-all"
                  placeholder="Sesuai KTP"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  Email (Opsional)
                </label>

                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleFormChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-red-600/10 focus:border-red-600 transition-all"
                  placeholder="nama@email.com"
                />
              </div>

              <div>
                <label className="block mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  Password
                </label>

                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleFormChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-red-600/10 focus:border-red-600 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  Konfirmasi Password
                </label>

                <input
                  name="password_confirmation"
                  type="password"
                  value={form.password_confirmation}
                  onChange={handleFormChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-red-600/10 focus:border-red-600 transition-all"
                  placeholder="Ulangi password"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  Alamat Domisili
                </label>

                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleFormChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-red-600/10 focus:border-red-600 transition-all"
                  placeholder="Alamat lengkap saat ini"
                  rows="2"
                  required
                />
              </div>

              <div className="md:col-span-2 mt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold hover:bg-slate-900 transition-all duration-300 shadow-lg shadow-red-100 disabled:opacity-50"
                >
                  {loading
                    ? "Mendaftarkan Akun..."
                    : "Daftar Akun Sekarang"}
                </button>

                <p className="text-center mt-6 text-sm text-slate-500">
                  Sudah memiliki akun?{" "}
                  <Link
                    to="/login"
                    className="text-red-600 font-bold hover:underline"
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