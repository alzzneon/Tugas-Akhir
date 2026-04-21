import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import DataTable from "../../../Components/Admin/DataTable";
import Modal from "../../../Components/Admin/Modal";

function Badge({ children, color = "gray" }) {
  const styles = {
    gray: "bg-gray-100 text-gray-700",
    yellow: "bg-yellow-100 text-yellow-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
    indigo: "bg-indigo-100 text-indigo-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        styles[color] || styles.gray
      }`}
    >
      {children}
    </span>
  );
}

function getStatusColor(status) {
  switch (String(status || "").toLowerCase()) {
    case "pending":
      return "yellow";
    case "approved":
      return "blue";
    case "paid":
    case "completed":
      return "green";
    case "rejected":
    case "cancelled":
    case "expired":
      return "red";
    case "ongoing":
    case "overdue":
      return "indigo";
    default:
      return "gray";
  }
}

function getPaymentStatusColor(status) {
  switch (String(status || "").toLowerCase()) {
    case "paid":
      return "green";
    case "failed":
    case "expired":
      return "red";
    case "unpaid":
      return "yellow";
    default:
      return "gray";
  }
}

function getRentalStatusLabel(status) {
  switch (String(status || "").toLowerCase()) {
    case "pending":
      return "Menunggu Persetujuan";
    case "approved":
      return "Disetujui";
    case "paid":
      return "Lunas";
    case "ongoing":
      return "Sedang Berjalan";
    case "completed":
      return "Selesai";
    case "overdue":
      return "Terlambat";
    case "rejected":
      return "Ditolak";
    case "cancelled":
      return "Dibatalkan";
    case "expired":
      return "Kedaluwarsa";
    default:
      return status || "-";
  }
}

function getPaymentStatusLabel(status) {
  switch (String(status || "").toLowerCase()) {
    case "unpaid":
      return "Belum Bayar";
    case "paid":
      return "Sudah Bayar";
    case "failed":
      return "Gagal";
    case "expired":
      return "Kedaluwarsa";
    default:
      return status || "-";
  }
}

function getPickupMethodLabel(value) {
  switch (String(value || "").toLowerCase()) {
    case "pickup":
      return "Diambil sendiri";
    case "delivery":
      return "Diantar";
    default:
      return "-";
  }
}

function formatDateTime(value) {
  if (!value) return "-";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  return d.toLocaleString("id-ID", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(value) {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
}

function normalizeDateTimeLocal(value) {
  if (!value) return "";
  return String(value).slice(0, 16);
}

function getAllowedStatusOptions(row) {
  const currentStatus = String(row?.status || "").toLowerCase();

  const map = {
    pending: ["pending", "approved", "rejected", "cancelled"],
    approved: ["approved", "paid", "rejected", "cancelled", "expired"],
    paid: ["paid", "ongoing", "completed"],
    ongoing: ["ongoing", "completed", "overdue"],
    overdue: ["overdue", "completed"],
    completed: ["completed"],
    rejected: ["rejected"],
    cancelled: ["cancelled"],
    expired: ["expired"],
  };

  return map[currentStatus] || [currentStatus];
}

function getAllowedPaymentStatusOptions(row) {
  const currentStatus = String(row?.status || "").toLowerCase();

  if (["paid", "completed", "ongoing", "overdue"].includes(currentStatus)) {
    return ["paid"];
  }

  return ["unpaid", "paid", "failed", "expired"];
}

export default function RentalsList({ type = "mobil" }) {
  const token = localStorage.getItem("token");

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [q, setQ] = useState("");

  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const [customerMode, setCustomerMode] = useState("registered");
  const [createErrors, setCreateErrors] = useState({});
  const [createForm, setCreateForm] = useState({
    user_id: "",
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    vehicle_id: "",
    start_date: "",
    end_date: "",
    pickup_method: "pickup",
    delivery_address: "",
    notes: "",
    direct_approve: true,
    payment_deadline_hours: 2,
  });
  const [savingCreate, setSavingCreate] = useState(false);

  const [selectedRow, setSelectedRow] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    status: "",
    payment_status: "",
    payment_type: "full",
    payment_method: "transfer",
    amount: "",
    notes: "",
  });

  const api = useMemo(() => {
    return axios.create({
      baseURL: "http://localhost:8000/api",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
  }, [token]);

  const columns = [
    { key: "booking_code", label: "Kode Booking" },
    { key: "penyewa", label: "Penyewa" },
    { key: "kendaraan", label: "Kendaraan" },
    { key: "periode", label: "Periode Sewa" },
    { key: "pickup_method", label: "Metode Pengambilan" },
    { key: "total_price", label: "Total" },
    { key: "status", label: "Status Rental" },
    { key: "payment_status", label: "Status Pembayaran" },
  ];

  async function fetchRentals() {
    try {
      setMsg("");
      setLoading(true);

      const res = await api.get("/admin/rentals");
      const data = Array.isArray(res.data?.data) ? res.data.data : [];

      const filtered = data.filter((item) => {
        const vehicleTypeCode = String(
          item?.vehicle?.vehicle_type?.code || ""
        ).toLowerCase();

        return vehicleTypeCode === String(type).toLowerCase();
      });

      setRows(filtered);
    } catch (err) {
      console.error("Gagal memuat rental:", err);
      setMsg(err.response?.data?.message || "Gagal memuat data penyewaan.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsers() {
    try {
      setLoadingUsers(true);
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
    try {
      setLoadingVehicles(true);
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

  useEffect(() => {
    fetchRentals();
    fetchUsers();
    fetchVehicles();
  }, [type]);

  const filteredRows = rows.filter((row) => {
    const s = q.toLowerCase();

    const penyewaNama =
      row.user?.full_name || row.manual_customer?.customer_name || "";
    const kendaraanNama = row.vehicle?.name || "";
    const bookingCode = row.booking_code || "";
    const plat = row.vehicle?.plate_number || "";

    return (
      penyewaNama.toLowerCase().includes(s) ||
      kendaraanNama.toLowerCase().includes(s) ||
      bookingCode.toLowerCase().includes(s) ||
      plat.toLowerCase().includes(s)
    );
  });

  function resetCreateForm() {
    setCustomerMode("registered");
    setCreateErrors({});
    setCreateForm({
      user_id: "",
      customer_name: "",
      customer_phone: "",
      customer_email: "",
      vehicle_id: "",
      start_date: "",
      end_date: "",
      pickup_method: "pickup",
      delivery_address: "",
      notes: "",
      direct_approve: true,
      payment_deadline_hours: 2,
    });
  }

  function openCreateModal() {
    resetCreateForm();
    setOpenCreate(true);
  }

  function closeCreateModal() {
    setOpenCreate(false);
    resetCreateForm();
  }

  function handleCreateChange(e) {
    const { name, value, type: inputType, checked } = e.target;

    setCreateForm((prev) => {
      const nextValue = inputType === "checkbox" ? checked : value;

      return {
        ...prev,
        [name]: nextValue,
        ...(name === "pickup_method" && nextValue === "pickup"
          ? { delivery_address: "" }
          : {}),
      };
    });

    setCreateErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    setMsg("");
  }

  function handleCustomerModeChange(mode) {
    setCustomerMode(mode);
    setMsg("");
    setCreateErrors({});
    setCreateForm((prev) => ({
      ...prev,
      user_id: "",
      customer_name: "",
      customer_phone: "",
      customer_email: "",
    }));
  }

  function validateCreateForm() {
    const nextErrors = {};

    if (customerMode === "registered" && !createForm.user_id) {
      nextErrors.user_id = "User wajib dipilih.";
    }

    if (customerMode === "manual") {
      if (!String(createForm.customer_name || "").trim()) {
        nextErrors.customer_name = "Nama penyewa wajib diisi.";
      }

      if (!String(createForm.customer_phone || "").trim()) {
        nextErrors.customer_phone = "Nomor telepon wajib diisi.";
      }
    }

    if (!createForm.vehicle_id) {
      nextErrors.vehicle_id = "Kendaraan wajib dipilih.";
    }

    if (!createForm.start_date) {
      nextErrors.start_date = "Tanggal mulai wajib diisi.";
    }

    if (!createForm.end_date) {
      nextErrors.end_date = "Tanggal selesai wajib diisi.";
    }

    if (createForm.start_date && createForm.end_date) {
      const start = new Date(createForm.start_date);
      const end = new Date(createForm.end_date);

      if (end <= start) {
        nextErrors.end_date =
          "Tanggal selesai harus lebih besar dari tanggal mulai.";
      }
    }

    if (!createForm.pickup_method) {
      nextErrors.pickup_method = "Metode pengambilan wajib dipilih.";
    }

    if (
      createForm.pickup_method === "delivery" &&
      !String(createForm.delivery_address || "").trim()
    ) {
      nextErrors.delivery_address =
        "Alamat pengantaran wajib diisi jika metode pengambilan adalah diantar.";
    }

    if (Number(createForm.payment_deadline_hours) < 1) {
      nextErrors.payment_deadline_hours = "Batas pembayaran minimal 1 jam.";
    }

    setCreateErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmitCreate(e) {
    e.preventDefault();

    if (!validateCreateForm()) {
      return;
    }

    try {
      setSavingCreate(true);
      setMsg("");

      const payload = {
        vehicle_id: Number(createForm.vehicle_id),
        start_date: createForm.start_date,
        end_date: createForm.end_date,
        pickup_method: createForm.pickup_method,
        delivery_address:
          createForm.pickup_method === "delivery"
            ? createForm.delivery_address.trim()
            : null,
        notes: createForm.notes?.trim() || null,
        direct_approve: !!createForm.direct_approve,
        payment_deadline_hours: Number(createForm.payment_deadline_hours),
      };

      if (customerMode === "registered") {
        payload.user_id = createForm.user_id;
      } else {
        payload.customer_name = createForm.customer_name.trim();
        payload.customer_phone = createForm.customer_phone.trim();
        payload.customer_email = createForm.customer_email?.trim() || null;
      }

      await api.post("/admin/rentals", payload);

      closeCreateModal();
      await fetchRentals();
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

        setCreateErrors(mapped);
      }

      setMsg(
        err.response?.data?.message ||
          "Terjadi kesalahan saat menyimpan penyewaan."
      );
    } finally {
      setSavingCreate(false);
    }
  }

  function openEditModal(row) {
    const statusOptions = getAllowedStatusOptions(row);
    const paymentOptions = getAllowedPaymentStatusOptions(row);

    setSelectedRow(row);
    setEditForm({
      status: statusOptions.includes(row.status) ? row.status : statusOptions[0],
      payment_status: paymentOptions.includes(row.payment_status)
        ? row.payment_status
        : paymentOptions[0],
      payment_type: "full",
      payment_method: "transfer",
      amount: "",
      notes: "",
    });
    setOpenEdit(true);
  }

  function closeEditModal() {
    setOpenEdit(false);
    setSelectedRow(null);
    setEditForm({
      status: "",
      payment_status: "",
      payment_type: "full",
      payment_method: "transfer",
      amount: "",
      notes: "",
    });
  }

  function handleEditChange(e) {
    const { name, value } = e.target;

    setEditForm((prev) => {
      const next = {
        ...prev,
        [name]: value,
      };

      if (name === "status" && value === "paid") {
        next.payment_status = "paid";
      }

      return next;
    });
  }

  async function handleSaveEdit(e) {
    e.preventDefault();

    if (!selectedRow) return;

    try {
      setSavingEdit(true);
      setMsg("");

      await api.patch(`/admin/rentals/${selectedRow.id}/update-status-payment`, {
        status: editForm.status,
        payment_status: editForm.payment_status,
        payment_type: "full",
        payment_method: editForm.payment_method,
        amount: editForm.amount ? Number(editForm.amount) : 0,
        notes: editForm.notes || null,
      });

      closeEditModal();
      await fetchRentals();
    } catch (err) {
      console.error("Gagal update rental:", err);
      setMsg(err.response?.data?.message || "Gagal memperbarui rental.");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleMarkOngoing(row) {
    try {
      setMsg("");
      await api.patch(`/admin/rentals/${row.id}/mark-ongoing`);
      await fetchRentals();
    } catch (err) {
      console.error("Gagal memulai rental:", err);
      setMsg(
        err.response?.data?.message ||
          "Gagal mengubah status menjadi sedang berjalan."
      );
    }
  }

  async function handleComplete(row) {
    try {
      setMsg("");
      await api.patch(`/admin/rentals/${row.id}/complete`);
      await fetchRentals();
    } catch (err) {
      console.error("Gagal menyelesaikan rental:", err);
      setMsg(err.response?.data?.message || "Gagal menyelesaikan rental.");
    }
  }

  return (
    <div>
      {msg && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {msg}
        </div>
      )}

      <DataTable
        title={`Penyewaan ${type === "mobil" ? "Mobil" : "Motor"}`}
        subtitle="Kelola booking, pembayaran, dan status penyewaan."
        searchValue={q}
        onSearchChange={setQ}
        onCreate={openCreateModal}
        createLabel="+ Tambah"
        columns={columns}
        rows={filteredRows}
        loading={loading}
        showActions
        renderCell={({ row, col }) => {
          const penyewaNama =
            row.user?.full_name || row.manual_customer?.customer_name || "-";

          const penyewaKontak =
            row.user?.email ||
            row.user?.phone_number ||
            row.manual_customer?.customer_phone ||
            row.manual_customer?.customer_email ||
            "-";

          if (col.key === "penyewa") {
            return (
              <div>
                <div className="font-medium">{penyewaNama}</div>
                <div className="text-xs text-gray-500">{penyewaKontak}</div>
              </div>
            );
          }

          if (col.key === "kendaraan") {
            return (
              <div>
                <div className="font-medium">{row.vehicle?.name || "-"}</div>
                <div className="text-xs text-gray-500">
                  {row.vehicle?.plate_number || "-"}
                </div>
              </div>
            );
          }

          if (col.key === "periode") {
            return (
              <div>
                <div>{formatDateTime(row.start_date)}</div>
                <div className="text-xs text-gray-500">
                  sampai {formatDateTime(row.end_date)}
                </div>
              </div>
            );
          }

          if (col.key === "pickup_method") {
            return (
              <div>
                <div className="font-medium">
                  {getPickupMethodLabel(row.pickup_method)}
                </div>
                {row.pickup_method === "delivery" && row.delivery_address ? (
                  <div className="text-xs text-gray-500">
                    {row.delivery_address}
                  </div>
                ) : null}
              </div>
            );
          }

          if (col.key === "total_price") {
            return formatCurrency(row.total_price);
          }

          if (col.key === "status") {
            return (
              <Badge color={getStatusColor(row.status)}>
                {getRentalStatusLabel(row.status)}
              </Badge>
            );
          }

          if (col.key === "payment_status") {
            return (
              <Badge color={getPaymentStatusColor(row.payment_status)}>
                {getPaymentStatusLabel(row.payment_status)}
              </Badge>
            );
          }

          return String(row[col.key] ?? "");
        }}
        actionsRender={({ row }) => (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => openEditModal(row)}
              className="rounded-lg bg-indigo-600 px-3 py-1 text-sm text-white hover:bg-indigo-700"
            >
              Edit
            </button>

            {["paid"].includes(String(row.status || "").toLowerCase()) && (
              <button
                onClick={() => handleMarkOngoing(row)}
                className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
              >
                Mulai
              </button>
            )}

            {["ongoing", "overdue"].includes(
              String(row.status || "").toLowerCase()
            ) && (
              <button
                onClick={() => handleComplete(row)}
                className="rounded-lg bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
              >
                Selesaikan
              </button>
            )}
          </div>
        )}
      />

      <Modal
        open={openCreate}
        size="lg"
        title={`Tambah Penyewaan ${type === "mobil" ? "Mobil" : "Motor"}`}
        onClose={closeCreateModal}
      >
        <form onSubmit={handleSubmitCreate} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Mode Penyewa</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleCustomerModeChange("registered")}
                className={`rounded-xl border px-4 py-2 text-sm ${
                  customerMode === "registered"
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-gray-300 bg-white text-gray-700"
                }`}
              >
                Pilih User Terdaftar
              </button>

              <button
                type="button"
                onClick={() => handleCustomerModeChange("manual")}
                className={`rounded-xl border px-4 py-2 text-sm ${
                  customerMode === "manual"
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-gray-300 bg-white text-gray-700"
                }`}
              >
                Input Manual
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {customerMode === "registered" ? (
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Pilih User
                </label>
                <select
                  name="user_id"
                  value={createForm.user_id}
                  onChange={handleCreateChange}
                  disabled={loadingUsers || savingCreate}
                  className="mt-2 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
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
                {createErrors.user_id && (
                  <p className="mt-1 text-xs text-red-600">{createErrors.user_id}</p>
                )}
              </div>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Nama Penyewa
                  </label>
                  <input
                    type="text"
                    name="customer_name"
                    value={createForm.customer_name}
                    onChange={handleCreateChange}
                    placeholder="Masukkan nama penyewa"
                    disabled={savingCreate}
                    className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                  {createErrors.customer_name && (
                    <p className="mt-1 text-xs text-red-600">
                      {createErrors.customer_name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Nomor Telepon
                  </label>
                  <input
                    type="text"
                    name="customer_phone"
                    value={createForm.customer_phone}
                    onChange={handleCreateChange}
                    placeholder="08xxxxxxxxxx"
                    disabled={savingCreate}
                    className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                  {createErrors.customer_phone && (
                    <p className="mt-1 text-xs text-red-600">
                      {createErrors.customer_phone}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="customer_email"
                    value={createForm.customer_email}
                    onChange={handleCreateChange}
                    placeholder="email@contoh.com"
                    disabled={savingCreate}
                    className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                  {createErrors.customer_email && (
                    <p className="mt-1 text-xs text-red-600">
                      {createErrors.customer_email}
                    </p>
                  )}
                </div>
              </>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700">
                Pilih Kendaraan
              </label>
              <select
                name="vehicle_id"
                value={createForm.vehicle_id}
                onChange={handleCreateChange}
                disabled={loadingVehicles || savingCreate}
                className="mt-2 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="">
                  {loadingVehicles ? "Memuat kendaraan..." : "-- Pilih Kendaraan --"}
                </option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.name} - {vehicle.plate_number} - Rp{" "}
                    {Number(vehicle.daily_rate || 0).toLocaleString("id-ID")}/hari
                  </option>
                ))}
              </select>
              {createErrors.vehicle_id && (
                <p className="mt-1 text-xs text-red-600">{createErrors.vehicle_id}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Mulai Sewa
              </label>
              <input
                type="datetime-local"
                name="start_date"
                value={normalizeDateTimeLocal(createForm.start_date)}
                onChange={handleCreateChange}
                disabled={savingCreate}
                className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              />
              {createErrors.start_date && (
                <p className="mt-1 text-xs text-red-600">{createErrors.start_date}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Selesai Sewa
              </label>
              <input
                type="datetime-local"
                name="end_date"
                value={normalizeDateTimeLocal(createForm.end_date)}
                onChange={handleCreateChange}
                disabled={savingCreate}
                className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              />
              {createErrors.end_date && (
                <p className="mt-1 text-xs text-red-600">{createErrors.end_date}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Metode Pengambilan
              </label>
              <select
                name="pickup_method"
                value={createForm.pickup_method}
                onChange={handleCreateChange}
                disabled={savingCreate}
                className="mt-2 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="pickup">Diambil sendiri</option>
                <option value="delivery">Diantar</option>
              </select>
              {createErrors.pickup_method && (
                <p className="mt-1 text-xs text-red-600">{createErrors.pickup_method}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Batas Pembayaran (jam)
              </label>
              <input
                type="number"
                min="1"
                name="payment_deadline_hours"
                value={createForm.payment_deadline_hours}
                onChange={handleCreateChange}
                disabled={savingCreate}
                className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              />
              {createErrors.payment_deadline_hours && (
                <p className="mt-1 text-xs text-red-600">
                  {createErrors.payment_deadline_hours}
                </p>
              )}
            </div>

            {createForm.pickup_method === "delivery" && (
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">
                  Alamat Pengantaran
                </label>
                <textarea
                  name="delivery_address"
                  value={createForm.delivery_address}
                  onChange={handleCreateChange}
                  rows="3"
                  placeholder="Masukkan alamat pengantaran lengkap"
                  disabled={savingCreate}
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                />
                {createErrors.delivery_address && (
                  <p className="mt-1 text-xs text-red-600">
                    {createErrors.delivery_address}
                  </p>
                )}
              </div>
            )}

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Catatan</label>
              <textarea
                name="notes"
                value={createForm.notes}
                onChange={handleCreateChange}
                rows="3"
                placeholder="Catatan tambahan"
                disabled={savingCreate}
                className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div className="md:col-span-2">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="direct_approve"
                  checked={createForm.direct_approve}
                  onChange={handleCreateChange}
                  disabled={savingCreate}
                />
                Langsung setujui saat dibuat admin
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeCreateModal}
              className="rounded-xl border px-4 py-2 font-semibold hover:bg-gray-50"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={savingCreate}
              className="rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {savingCreate ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={openEdit}
        size="md"
        title="Edit Status Rental & Pembayaran"
        onClose={closeEditModal}
      >
        {selectedRow && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="rounded-xl border bg-gray-50 p-4 text-sm">
              <div>
                <strong>Kode:</strong> {selectedRow.booking_code}
              </div>
              <div>
                <strong>Penyewa:</strong>{" "}
                {selectedRow.user?.full_name ||
                  selectedRow.manual_customer?.customer_name ||
                  "-"}
              </div>
              <div>
                <strong>Kendaraan:</strong> {selectedRow.vehicle?.name || "-"}
              </div>
              <div>
                <strong>Metode Pengambilan:</strong>{" "}
                {getPickupMethodLabel(selectedRow.pickup_method)}
              </div>
              {selectedRow.pickup_method === "delivery" &&
              selectedRow.delivery_address ? (
                <div>
                  <strong>Alamat Pengantaran:</strong>{" "}
                  {selectedRow.delivery_address}
                </div>
              ) : null}
              <div>
                <strong>Total:</strong> {formatCurrency(selectedRow.total_price)}
              </div>
              <div>
                <strong>Status Saat Ini:</strong>{" "}
                {getRentalStatusLabel(selectedRow.status)}
              </div>
              <div>
                <strong>Status Pembayaran Saat Ini:</strong>{" "}
                {getPaymentStatusLabel(selectedRow.payment_status)}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Status Rental
                </label>
                <select
                  name="status"
                  value={editForm.status}
                  onChange={handleEditChange}
                  className="mt-2 w-full rounded-xl border bg-white px-3 py-2 text-sm"
                >
                  {getAllowedStatusOptions(selectedRow).map((status) => (
                    <option key={status} value={status}>
                      {getRentalStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Status Pembayaran
                </label>
                <select
                  name="payment_status"
                  value={editForm.payment_status}
                  onChange={handleEditChange}
                  className="mt-2 w-full rounded-xl border bg-white px-3 py-2 text-sm"
                >
                  {getAllowedPaymentStatusOptions(selectedRow).map((status) => (
                    <option key={status} value={status}>
                      {getPaymentStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Tipe Pembayaran
                </label>
                <select
                  name="payment_type"
                  value={editForm.payment_type}
                  onChange={handleEditChange}
                  className="mt-2 w-full rounded-xl border bg-white px-3 py-2 text-sm"
                >
                  <option value="full">Full</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Metode Pembayaran
                </label>
                <select
                  name="payment_method"
                  value={editForm.payment_method}
                  onChange={handleEditChange}
                  className="mt-2 w-full rounded-xl border bg-white px-3 py-2 text-sm"
                >
                  <option value="transfer">Transfer</option>
                  <option value="cash">Cash</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Nominal Pembayaran
                </label>
                <input
                  type="number"
                  name="amount"
                  min="0"
                  value={editForm.amount}
                  onChange={handleEditChange}
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                  placeholder="0"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">
                  Catatan
                </label>
                <textarea
                  name="notes"
                  rows="3"
                  value={editForm.notes}
                  onChange={handleEditChange}
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                  placeholder="Catatan perubahan status/pembayaran"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-xl border px-4 py-2 font-semibold hover:bg-gray-50"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={savingEdit}
                className="rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {savingEdit ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}