import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import DataTable from "../../Components/Admin/DataTable";
import Modal from "../../Components/Admin/Modal";

import { adminFetch } from "../../lib/adminFetch";

const PASSWORD_MASK = "";

const emptyForm = {
  full_name: "",
  email: "",
  phone_number: "",
  address: "",
  birth_place: "",
  birth_date: "",
  password: "",
};

function formatDateInput(value) {
  if (!value) return "";

  return String(value).slice(0, 10);
}

export default function AdminUsers() {
  const nav = useNavigate();

  const endpoint = "/api/admin/admins";

  const columns = [
    { key: "full_name", label: "Nama" },
    { key: "email", label: "Email" },
    { key: "phone_number", label: "No HP" },
    { key: "address", label: "Alamat" },
    { key: "birth_place", label: "Tempat Lahir" },
    { key: "birth_date", label: "Tanggal Lahir" },
    { key: "password_mask", label: "Password" },
  ];

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [active, setActive] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(emptyForm);

  const loadData = async () => {
    try {
      setLoading(true);
      setMsg("");

      const data = await adminFetch(endpoint);
      const adminRows = Array.isArray(data) ? data : data?.data || [];

      setRows(
        adminRows.map((item) => ({
          ...item,
          birth_date: formatDateInput(item.birth_date),
          password_mask: PASSWORD_MASK,
        }))
      );
    } catch (e) {
      if (e.message === "UNAUTHORIZED") {
        nav("/admin/login", { replace: true });
        return;
      }

      setMsg(e.message || "Gagal memuat data admin.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setMode("create");
    setActive(null);
    setMsg("");
    setForm({ ...emptyForm });
    setOpen(true);
  };

  const openEdit = (row) => {
    setMode("edit");
    setActive(row);
    setMsg("");

    setForm({
      full_name: row.full_name || "",
      email: row.email || "",
      phone_number: row.phone_number || "",
      address: row.address || "",
      birth_place: row.birth_place || "",
      birth_date: formatDateInput(row.birth_date),
      password: PASSWORD_MASK,
    });

    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setActive(null);
    setForm({ ...emptyForm });
    setMsg("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordFocus = () => {
    if (mode === "edit" && form.password === PASSWORD_MASK) {
      setForm((prev) => ({
        ...prev,
        password: "",
      }));
    }
  };

  const handlePasswordBlur = () => {
    if (mode === "edit" && form.password.trim() === "") {
      setForm((prev) => ({
        ...prev,
        password: PASSWORD_MASK,
      }));
    }
  };

  const validateForm = () => {
    const requiredFields = [
      "full_name",
      "email",
      "phone_number",
      "address",
      "birth_place",
      "birth_date",
    ];

    for (const key of requiredFields) {
      if (!String(form[key] || "").trim()) {
        return "Semua field wajib diisi.";
      }
    }

    if (mode === "create" && !form.password.trim()) {
      return "Password wajib diisi.";
    }

    if (
      form.password &&
      form.password !== PASSWORD_MASK &&
      form.password.length < 6
    ) {
      return "Password minimal 6 karakter.";
    }

    return "";
  };

  const submit = async (e) => {
    e.preventDefault();

    const validationMessage = validateForm();

    if (validationMessage) {
      setMsg(validationMessage);
      return;
    }

    try {
      setSaving(true);
      setMsg("");

      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone_number: form.phone_number.trim(),
        address: form.address.trim(),
        birth_place: form.birth_place.trim(),
        birth_date: form.birth_date,
      };

      if (mode === "create") {
        payload.password = form.password;
      }

      if (mode === "edit" && form.password !== PASSWORD_MASK) {
        payload.password = form.password;
      }

      if (mode === "create") {
        await adminFetch(endpoint, {
          method: "POST",
          body: JSON.stringify(payload),
          headers: {
            "Content-Type": "application/json",
          },
        });
      } else {
        await adminFetch(`${endpoint}/${active.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
          headers: {
            "Content-Type": "application/json",
          },
        });
      }

      closeModal();
      await loadData();
    } catch (err) {
      setMsg(err.message || "Gagal menyimpan data admin.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!confirm(`Hapus admin ${row.full_name}?`)) return;

    try {
      setMsg("");

      await adminFetch(`${endpoint}/${row.id}`, {
        method: "DELETE",
      });

      await loadData();
    } catch (err) {
      setMsg(err.message || "Gagal menghapus admin.");
    }
  };

  return (
    <div className="space-y-4">
      {msg && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {msg}
        </div>
      )}

      <DataTable
        title="Admin"
        subtitle="Kelola akun admin yang dibuat oleh super admin"
        columns={columns}
        rows={rows}
        loading={loading}
        onCreate={openCreate}
        onEdit={openEdit}
        onDelete={remove}
      />

      <Modal
        open={open}
        title={mode === "create" ? "Tambah Admin" : "Edit Admin"}
        onClose={closeModal}
      >
        <form onSubmit={submit} autoComplete="off" className="space-y-4">
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Nama Lengkap
              </label>
              <input
                type="text"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                required
                autoComplete="off"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                placeholder="Masukkan nama lengkap"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Email
              </label>
              <input
                type="text"
                name="admin_contact_email"
                inputMode="email"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                required
                autoComplete="new-password"
                data-lpignore="true"
                data-form-type="other"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                placeholder="Masukkan email"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Nomor HP
              </label>
              <input
                type="text"
                name="phone_number"
                value={form.phone_number}
                onChange={handleChange}
                required
                autoComplete="off"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                placeholder="Contoh: 081234567890"
              />
              <p className="mt-1 text-[11px] text-gray-400">
                Nomor HP admin otomatis dianggap terverifikasi.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Tempat Lahir
              </label>
              <input
                type="text"
                name="birth_place"
                value={form.birth_place}
                onChange={handleChange}
                required
                autoComplete="off"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                placeholder="Masukkan tempat lahir"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Tanggal Lahir
              </label>
              <input
                type="date"
                name="birth_date"
                value={form.birth_date}
                onChange={handleChange}
                required
                autoComplete="off"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Alamat
              </label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                required
                rows={3}
                autoComplete="off"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                placeholder="Masukkan alamat lengkap"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Password
              </label>
              <input
                type="password"
                name="admin_new_password"
                value={form.password}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                onFocus={handlePasswordFocus}
                onBlur={handlePasswordBlur}
                required={mode === "create"}
                autoComplete="new-password"
                data-lpignore="true"
                data-form-type="other"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                placeholder={
                  mode === "create"
                    ? "Masukkan password admin"
                    : "Kosongkan jika tidak ingin mengganti password"
                }
              />
              <p className="mt-1 text-[11px] text-gray-400">
                Password tidak ditampilkan asli. Pada mode edit, ubah isi field
                ini jika ingin mengganti password.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-gray-400"
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}