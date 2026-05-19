import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginAdmin() {
  const navigate = useNavigate();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

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
          phone_number: phoneNumber,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data.message || "Login gagal");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (
        data.user.role === "admin" ||
        data.user.role === "super_admin"
      ) {
        navigate("/admin/dashboard", { replace: true });
      } else {
        setMsg("Akses ditolak. Akun ini bukan administrator.");
      }
    } catch {
      setMsg("❌ Gagal koneksi ke server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">

        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Rent<span className="text-red-600">Care.</span>
          </h1>

          <p className="text-slate-500 mt-2 font-medium">
            Administrator Portal
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-10">

          <form onSubmit={handleLogin} className="space-y-6">

            <Input
              label="Nomor WhatsApp"
              type="text"
              placeholder="08123456789"
              value={phoneNumber}
              onChange={setPhoneNumber}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={setPassword}
            />

            <button
              disabled={loading}
              className="w-full rounded-2xl bg-slate-900 text-white font-bold py-4 hover:bg-red-600 transition-all duration-300 shadow-lg shadow-slate-200 disabled:opacity-50"
            >
              {loading ? "Memproses..." : "Masuk ke Dashboard"}
            </button>

          </form>

          {msg && (
            <div className="mt-6 p-4 rounded-xl text-sm font-medium text-center bg-red-50 text-red-600 border border-red-100">
              {msg}
            </div>
          )}

        </div>

        <p className="text-center text-slate-400 text-xs mt-8 uppercase tracking-widest">
          &copy; 2026 RentCare Premium Services
        </p>

      </div>
    </div>
  );
}

function Input({
  label,
  type,
  placeholder,
  value,
  onChange,
}) {
  return (
    <div className="space-y-2">

      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
        {label}
      </label>

      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl bg-slate-50 border border-slate-200 px-5 py-4 outline-none text-slate-900 placeholder:text-slate-300 focus:bg-white focus:ring-2 focus:ring-red-600/10 focus:border-red-600 transition-all"
        required
      />

    </div>
  );
}