import { useEffect, useState } from "react";
import axios from "axios";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Pencil,
  Save,
  X,
} from "lucide-react";

const API_URL =
  "http://localhost:8000/api/admin/company-profile";

export default function CompanyProfile() {
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState({
    alamat: "",
    phone: "",
    email: "",
  });

  const [originalData, setOriginalData] = useState({
    alamat: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    getProfile();
  }, []);

  const getProfile = async () => {
    try {
      const res = await axios.get(API_URL, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem(
            "token"
          )}`,
        },
      });

      const data = {
        alamat: res.data?.alamat || "",
        phone: res.data?.phone || "",
        email: res.data?.email || "",
      };

      setForm(data);
      setOriginalData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      await axios.put(API_URL, form, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem(
            "token"
          )}`,
        },
      });

      setOriginalData(form);
      setEditing(false);

      alert("Data berhasil disimpan");
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.message ||
          "Gagal menyimpan data"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setForm(originalData);
    setEditing(false);
  };

return (
  <div className="space-y-5">

    {/* Header Halaman */}
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Informasi Perusahaan
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Kelola data yang tampil pada website
        </p>
      </div>

      {!editing ? (
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Pencil size={16} />
          Edit
        </button>
      ) : (
        <button
          onClick={handleCancel}
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          <X size={16} />
          Batal
        </button>
      )}
    </div>

    {/* Card */}
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        {/* Alamat */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Alamat
          </label>

          <textarea
            rows={4}
            disabled={!editing}
            value={form.alamat}
            onChange={(e) =>
              setForm({
                ...form,
                alamat: e.target.value,
              })
            }
            className={`w-full rounded-xl border px-4 py-3 transition ${
              editing
                ? "border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                : "bg-gray-50 border-gray-200"
            }`}
          />
        </div>

        {/* Nomor HP */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Nomor HP
          </label>

          <input
            type="text"
            disabled={!editing}
            value={form.phone}
            onChange={(e) =>
              setForm({
                ...form,
                phone: e.target.value,
              })
            }
            className={`w-full rounded-xl border px-4 py-3 transition ${
              editing
                ? "border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                : "bg-gray-50 border-gray-200"
            }`}
          />
        </div>

        {/* Email */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Email
          </label>

          <input
            type="email"
            disabled={!editing}
            value={form.email}
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value,
              })
            }
            className={`w-full rounded-xl border px-4 py-3 transition ${
              editing
                ? "border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                : "bg-gray-50 border-gray-200"
            }`}
          />
        </div>

        {editing && (
          <div className="flex justify-end border-t border-gray-100 pt-5">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {loading
                ? "Menyimpan..."
                : "Simpan Perubahan"}
            </button>
          </div>
        )}
      </form>

    </div>
  </div>
);
}