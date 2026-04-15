import { useEffect, useMemo, useState } from "react";
import axios from "axios";

export default function RentalForm({ type = "mobil", onCreated }) {
  const token = localStorage.getItem("token");

  const [customerMode, setCustomerMode] = useState("registered");
  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    user_id: "",
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    vehicle_id: "",
    start_date: "",
    end_date: "",
    notes: "",
    direct_approve: true,
    payment_deadline_hours: 2,
    dp_amount: 0,
  });

  const [errors, setErrors] = useState({});
  const [serverMessage, setServerMessage] = useState("");

  const api = useMemo(() => {
    return axios.create({
      baseURL: "http://localhost:8000/api",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
  }, [token]);

  useEffect(() => {
    fetchUsers();
    fetchVehicles();
  }, [type]);

  async function fetchUsers() {
    setLoadingUsers(true);
    try {
      const res = await api.get("/admin/users-for-rental");
      setUsers(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error("Gagal memuat user:", err);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }

  async function fetchVehicles() {
    setLoadingVehicles(true);
    try {
      const res = await api.get("/admin/masters/vehicles", {
        params: { type_code: type },
      });

      setVehicles(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error("Gagal memuat kendaraan:", err);
      setVehicles([]);
    } finally {
      setLoadingVehicles(false);
    }
  }

  function handleChange(e) {
    const { name, value, type: inputType, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: inputType === "checkbox" ? checked : value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    setServerMessage("");
  }

  function handleCustomerModeChange(mode) {
    setCustomerMode(mode);
    setServerMessage("");
    setErrors((prev) => ({
      ...prev,
      user_id: "",
      customer_name: "",
      customer_phone: "",
      customer_email: "",
    }));
  }

  function validateForm() {
    const nextErrors = {};

    if (customerMode === "registered") {
      if (!form.user_id) nextErrors.user_id = "User wajib dipilih";
    }

    if (customerMode === "manual") {
      if (!form.customer_name.trim()) {
        nextErrors.customer_name = "Nama penyewa wajib diisi";
      }
      if (!form.customer_phone.trim()) {
        nextErrors.customer_phone = "Nomor telepon wajib diisi";
      }
    }

    if (!form.vehicle_id) nextErrors.vehicle_id = "Kendaraan wajib dipilih";
    if (!form.start_date) nextErrors.start_date = "Tanggal mulai wajib diisi";
    if (!form.end_date) nextErrors.end_date = "Tanggal selesai wajib diisi";

    if (form.start_date && form.end_date) {
      const start = new Date(form.start_date);
      const end = new Date(form.end_date);

      if (end <= start) {
        nextErrors.end_date = "Tanggal selesai harus lebih besar dari tanggal mulai";
      }
    }

    if (Number(form.payment_deadline_hours) < 1) {
      nextErrors.payment_deadline_hours = "Batas pembayaran minimal 1 jam";
    }

    if (Number(form.dp_amount) < 0) {
      nextErrors.dp_amount = "DP tidak boleh negatif";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);
    setServerMessage("");

    try {
      const payload = {
        vehicle_id: Number(form.vehicle_id),
        start_date: form.start_date,
        end_date: form.end_date,
        notes: form.notes || null,
        direct_approve: !!form.direct_approve,
        payment_deadline_hours: Number(form.payment_deadline_hours),
        dp_amount: Number(form.dp_amount || 0),
      };

      if (customerMode === "registered") {
        payload.user_id = form.user_id;
      } else {
        payload.customer_name = form.customer_name;
        payload.customer_phone = form.customer_phone;
        payload.customer_email = form.customer_email || null;
      }

      const res = await api.post("/admin/rentals", payload);

      setServerMessage(res.data?.message || "Penyewaan berhasil dibuat");

      setForm({
        user_id: "",
        customer_name: "",
        customer_phone: "",
        customer_email: "",
        vehicle_id: "",
        start_date: "",
        end_date: "",
        notes: "",
        direct_approve: true,
        payment_deadline_hours: 2,
        dp_amount: 0,
      });

      if (typeof onCreated === "function") {
        onCreated();
      }
    } catch (err) {
      console.error("Gagal membuat rental:", err);

      if (err.response?.status === 422) {
        const validationErrors = err.response?.data?.errors || {};
        const mapped = {};

        Object.keys(validationErrors).forEach((key) => {
          mapped[key] = Array.isArray(validationErrors[key])
            ? validationErrors[key][0]
            : validationErrors[key];
        });

        setErrors(mapped);
      }

      setServerMessage(
        err.response?.data?.message || "Terjadi kesalahan saat menyimpan penyewaan."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">
          Tambah Penyewaan {type === "mobil" ? "Mobil" : "Motor"}
        </h2>
        <p className="text-sm text-gray-500">
          Admin dapat membuat penyewaan manual dari panel ini.
        </p>
      </div>

      {serverMessage && (
        <div className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
          {serverMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-2">Mode Penyewa</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleCustomerModeChange("registered")}
              className={`px-4 py-2 rounded-xl border text-sm ${
                customerMode === "registered"
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-700 border-gray-300"
              }`}
            >
              Pilih User Terdaftar
            </button>

            <button
              type="button"
              onClick={() => handleCustomerModeChange("manual")}
              className={`px-4 py-2 rounded-xl border text-sm ${
                customerMode === "manual"
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-700 border-gray-300"
              }`}
            >
              Input Manual
            </button>
          </div>
        </div>

        {customerMode === "registered" ? (
          <div>
            <label className="block text-sm font-medium mb-1">Pilih User</label>
            <select
              name="user_id"
              value={form.user_id}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              disabled={loadingUsers || submitting}
            >
              <option value="">
                {loadingUsers ? "Memuat user..." : "-- Pilih User --"}
              </option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name} - {user.email || user.phone_number}
                </option>
              ))}
            </select>
            {errors.user_id && (
              <p className="mt-1 text-xs text-red-600">{errors.user_id}</p>
            )}
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Nama Penyewa</label>
              <input
                type="text"
                name="customer_name"
                value={form.customer_name}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="Masukkan nama penyewa"
                disabled={submitting}
              />
              {errors.customer_name && (
                <p className="mt-1 text-xs text-red-600">{errors.customer_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Nomor Telepon</label>
              <input
                type="text"
                name="customer_phone"
                value={form.customer_phone}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="08xxxxxxxxxx"
                disabled={submitting}
              />
              {errors.customer_phone && (
                <p className="mt-1 text-xs text-red-600">{errors.customer_phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email (opsional)</label>
              <input
                type="email"
                name="customer_email"
                value={form.customer_email}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="email@contoh.com"
                disabled={submitting}
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Pilih Kendaraan</label>
          <select
            name="vehicle_id"
            value={form.vehicle_id}
            onChange={handleChange}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
            disabled={loadingVehicles || submitting}
          >
            <option value="">
              {loadingVehicles ? "Memuat kendaraan..." : "-- Pilih Kendaraan --"}
            </option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.name} - {vehicle.plate_number} - Rp{" "}
                {Number(vehicle.daily_rate).toLocaleString("id-ID")}/hari
              </option>
            ))}
          </select>
          {errors.vehicle_id && (
            <p className="mt-1 text-xs text-red-600">{errors.vehicle_id}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Mulai Sewa</label>
          <input
            type="datetime-local"
            name="start_date"
            value={form.start_date}
            onChange={handleChange}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
            disabled={submitting}
          />
          {errors.start_date && (
            <p className="mt-1 text-xs text-red-600">{errors.start_date}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Selesai Sewa</label>
          <input
            type="datetime-local"
            name="end_date"
            value={form.end_date}
            onChange={handleChange}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
            disabled={submitting}
          />
          {errors.end_date && (
            <p className="mt-1 text-xs text-red-600">{errors.end_date}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Batas Pembayaran (jam)
          </label>
          <input
            type="number"
            min="1"
            name="payment_deadline_hours"
            value={form.payment_deadline_hours}
            onChange={handleChange}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
            disabled={submitting}
          />
          {errors.payment_deadline_hours && (
            <p className="mt-1 text-xs text-red-600">
              {errors.payment_deadline_hours}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">DP Awal</label>
          <input
            type="number"
            min="0"
            name="dp_amount"
            value={form.dp_amount}
            onChange={handleChange}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
            disabled={submitting}
          />
          {errors.dp_amount && (
            <p className="mt-1 text-xs text-red-600">{errors.dp_amount}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Catatan</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows="3"
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
            placeholder="Catatan tambahan"
            disabled={submitting}
          />
        </div>

        <div className="md:col-span-2">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="direct_approve"
              checked={form.direct_approve}
              onChange={handleChange}
              disabled={submitting}
            />
            Langsung approve saat dibuat admin
          </label>
        </div>

        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitting ? "Menyimpan..." : "Simpan Penyewaan"}
          </button>
        </div>
      </form>
    </div>
  );
}