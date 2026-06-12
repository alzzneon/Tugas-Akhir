import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:8000/api/admin/company-profile";

export default function CompanyProfile() {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    alamat: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    getProfile();
  }, []);

  const getProfile = async () => {
    try {
      const res = await axios.get(API_URL);

      setForm({
        alamat: res.data?.alamat || "",
        phone: res.data?.phone || "",
        email: res.data?.email || "",
      });
    } catch (err) {
      console.error("GET ERROR:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      await axios.put(
        API_URL,
        form,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      alert("Data berhasil disimpan");
    } catch (err) {
      console.error("PUT ERROR:", err);
      console.log(err.response);
      console.log(err.response?.data);

      alert(
        err.response?.data?.message ||
        "Gagal menyimpan data"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="rounded-xl bg-white p-6 shadow">
        <h1 className="mb-6 text-xl font-semibold">
          Informasi Perusahaan
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div>
            <label className="mb-2 block text-sm">
              Alamat
            </label>

            <textarea
              rows={4}
              value={form.alamat}
              onChange={(e) =>
                setForm({
                  ...form,
                  alamat: e.target.value,
                })
              }
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm">
              Nomor HP
            </label>

            <input
              type="text"
              value={form.phone}
              onChange={(e) =>
                setForm({
                  ...form,
                  phone: e.target.value,
                })
              }
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm">
              Email
            </label>

            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm({
                  ...form,
                  email: e.target.value,
                })
              }
              className="w-full rounded-lg border p-3"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-white"
          >
            {loading
              ? "Menyimpan..."
              : "Simpan"}
          </button>
        </form>
      </div>
    </div>
  );
}