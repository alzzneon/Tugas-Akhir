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
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
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
        const firstError = Object.values(err.response.data.errors)[0][0];
        setError(firstError);
      } else {
        setError(err.response?.data?.message || "Register gagal");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Daftar Customer</h1>

        {error && (
          <div className="mb-4 bg-red-100 text-red-600 px-4 py-3 rounded-lg text-sm leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="full_name" className="block mb-1 font-medium">
              Nama Lengkap
            </label>
            <input
              id="full_name"
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-red-300"
              placeholder="Masukkan nama lengkap"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block mb-1 font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-red-300"
              placeholder="Masukkan email"
              required
            />
          </div>

          <div>
            <label htmlFor="phone_number" className="block mb-1 font-medium">
              Nomor HP
            </label>
            <input
              id="phone_number"
              type="text"
              name="phone_number"
              value={form.phone_number}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-red-300"
              placeholder="Masukkan nomor HP"
              required
            />
          </div>

          <div>
            <label htmlFor="address" className="block mb-1 font-medium">
              Alamat
            </label>
            <textarea
              id="address"
              name="address"
              value={form.address}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-red-300"
              placeholder="Masukkan alamat"
              rows="3"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block mb-1 font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-red-300"
              placeholder="Masukkan password"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password_confirmation"
              className="block mb-1 font-medium"
            >
              Konfirmasi Password
            </label>
            <input
              id="password_confirmation"
              type="password"
              name="password_confirmation"
              value={form.password_confirmation}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-red-300"
              placeholder="Ulangi password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-500 text-white py-2.5 rounded-lg hover:bg-red-600 disabled:opacity-70"
          >
            {loading ? "Loading..." : "Daftar"}
          </button>
        </form>

        <p className="text-center mt-4 text-sm">
          Sudah punya akun?{" "}
          <Link to="/login" className="text-red-500 font-medium hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}