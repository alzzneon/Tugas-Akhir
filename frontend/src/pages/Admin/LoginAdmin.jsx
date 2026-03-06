import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginAdmin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data.message || "Login gagal");
        return;
      }

      // ✅ simpan token
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user.role === "admin" || data.user.role === "super_admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        setMsg("Akun ini bukan admin");
      }
    } catch {
      setMsg("❌ Gagal koneksi ke server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-8 text-white">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold">RentCare</h1>
          <p className="text-white/80 text-sm mt-1">Admin Login</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input label="Email" type="email" value={email} onChange={setEmail} />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
          />

          <button
            disabled={loading}
            className="w-full rounded-xl bg-white text-indigo-700 font-semibold py-3 hover:bg-white/90 transition disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {msg && (
          <div className="mt-4 rounded-xl bg-white/10 border border-white/20 p-3 text-center text-sm">
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}

function Input({ label, type, value, onChange }) {
  return (
    <div>
      <label className="text-sm text-white/80">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 outline-none focus:ring-2 focus:ring-white/40"
      />
    </div>
  );
}