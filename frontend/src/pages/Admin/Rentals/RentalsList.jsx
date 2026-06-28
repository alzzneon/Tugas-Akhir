import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import DataTable from "../../../Components/Admin/DataTable";
import Modal from "../../../Components/Admin/Modal";

const BADGE_STYLES = {
  gray: "bg-gray-100 text-gray-600",
  yellow: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60",
  green: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60",
  red: "bg-red-50 text-red-600 ring-1 ring-red-200/60",
  blue: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/60",
  indigo: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/60",
};

function Badge({ children, color = "gray" }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium tracking-wide ${
        BADGE_STYLES[color] || BADGE_STYLES.gray
      }`}
    >
      {children}
    </span>
  );
}

function getStatusColor(s) {
  switch (String(s || "").toLowerCase()) {
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
    case "inspection":
    case "waiting_payment":
    case "repair_process":
      return "indigo";
    default:
      return "gray";
  }
}

function getPaymentStatusColor(s) {
  switch (String(s || "").toLowerCase()) {
    case "paid":
      return "green";
    case "refund":
    case "refunded":
      return "blue";
    case "failed":
    case "expired":
      return "red";
    case "unpaid":
      return "yellow";
    default:
      return "gray";
  }
}

function getRentalStatusLabel(s) {
  return (
    {
      pending: "Menunggu Persetujuan",
      approved: "Disetujui",
      ongoing: "Sedang Berjalan",
      overdue: "Terlambat",
      returned: "Dikembalikan",
      inspection: "Dalam Inspeksi",
      waiting_payment: "Menunggu Pembayaran Denda",
      repair_process: "Proses Perbaikan",
      completed: "Selesai",
      rejected: "Ditolak",
      cancelled: "Dibatalkan",
    }[String(s || "").toLowerCase()] || s
  );
}

function getPaymentStatusLabel(s) {
  return (
    {
      unpaid: "Belum Bayar",
      paid: "Sudah Bayar",
      refund: "Refund",
      refunded: "Refunded",
      failed: "Gagal",
      expired: "Kedaluwarsa",
    }[String(s || "").toLowerCase()] || s
  );
}

function formatCurrency(v) {
  return `Rp ${Number(v || 0).toLocaleString("id-ID")}`;
}

function formatDate(dateString) {
  if (!dateString) return "-";

  try {
    const date = new Date(dateString);

    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return dateString;
  }
}

function formatDateTimeForApi(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

const inputCls = (err) =>
  `w-full rounded-lg border text-[13px] px-3 py-2 outline-none transition bg-white text-gray-800 ${
    err ? "border-red-300" : "border-gray-200"
  }`;

function FieldLabel({ children }) {
  return (
    <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
      {children}
    </label>
  );
}

const RENTAL_STATUS_OPTIONS = {
  pending: "Menunggu Persetujuan",
  approved: "Disetujui",
  ongoing: "Sedang Berjalan",
  overdue: "Terlambat",
  returned: "Dikembalikan",
  inspection: "Dalam Inspeksi",
  waiting_payment: "Menunggu Pembayaran Denda",
  repair_process: "Proses Perbaikan",
  completed: "Selesai",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
};

const PAYMENT_STATUS_OPTIONS = {
  unpaid: "Belum Bayar",
  paid: "Sudah Bayar",
  refund: "Refund",
  refunded: "Refunded",
  failed: "Gagal",
  expired: "Kedaluwarsa",
};

function SectionDivider({ label }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
        {label}
      </span>
      <div className="flex-1 border-t border-gray-100" />
    </div>
  );
}

export default function RentalsList({ type }) {
  const token = localStorage.getItem("token");

  const api = useMemo(
    () =>
      axios.create({
        baseURL: "http://localhost:8000/api",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }),
    [token]
  );

  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [openFilter, setOpenFilter] = useState(false);

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editMode, setEditMode] = useState("edit");

  const [editForm, setEditForm] = useState({
    status: "",
    payment_status: "",
    notes: "",
    actual_return_at: "",
    system_late_fine_amount: 0,
    damages: [],
    damage_name: "",
    damage_cost: "",
  });

  async function fetchRentals() {
    try {
      setLoading(true);

      const res = await api.get("/admin/rentals");
      const rentals = res.data?.data || [];

      if (!type) {
        setRows(rentals);
        return;
      }

      const filtered = rentals.filter((item) => {
        const vehicleType = item.vehicle?.vehicle_type?.code;

        return vehicleType?.toUpperCase() === type.toUpperCase();
      });

      setRows(filtered);
    } catch (err) {
      console.log(err);

      setMsg(err.response?.data?.message || "Gagal memuat data rental.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRentals();
  }, []);

  function handleEditChange(e) {
    const { name, value, type, checked } = e.target;

    setEditForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function addDamageItem() {
    if (!editForm.damage_name || !editForm.damage_cost) {
      setMsg("Isi deskripsi kerusakan dan biaya perbaikan terlebih dahulu.");
      return;
    }

    setEditForm((prev) => ({
      ...prev,
      damages: [
        ...prev.damages,
        {
          description: prev.damage_name,
          repair_cost: Number(prev.damage_cost),
        },
      ],
      damage_name: "",
      damage_cost: "",
    }));

    setMsg("");
  }

  function removeDamage(index) {
    setEditForm((prev) => ({
      ...prev,
      damages: prev.damages.filter((_, i) => i !== index),
    }));
  }

  function openEditModal(row, mode = "edit") {
    setSelectedRow(row);
    setEditMode(mode);
    setMsg("");

    const existingDamages = Array.isArray(row.damages)
      ? row.damages.map((item) => ({
          description: item.description || "",
          repair_cost: Number(item.repair_cost || 0),
        }))
      : [];

    const existingLateFineAmount = Array.isArray(row.late_fines)
      ? row.late_fines.reduce((total, item) => {
          return total + Number(item.total_fine || 0);
        }, 0)
      : 0;

    setEditForm({
      status: row.status || "",
      payment_status: row.payment_status || "",
      notes: row.notes || "",
      actual_return_at: row.actual_return_at || "",
      system_late_fine_amount: existingLateFineAmount,
      damages: existingDamages,
      damage_name: "",
      damage_cost: "",
    });

    setOpenEdit(true);
  }

  function closeEditModal() {
    setOpenEdit(false);
    setSelectedRow(null);
    setEditMode("edit");
  }

  async function handleApprove(id) {
    const confirmed = window.confirm("Setujui penyewaan ini?");

    if (!confirmed) return;

    try {
      setMsg("");
      await api.patch(`/admin/rentals/${id}/approve`);
      await fetchRentals();
    } catch (err) {
      console.log(err);

      setMsg(err.response?.data?.message || "Gagal menyetujui rental.");
    }
  }

  async function handleReject(row) {
    const reason = window.prompt("Masukkan alasan penolakan:", "Ditolak admin");

    if (!reason) return;

    try {
      setMsg("");

      await api.patch(`/admin/rentals/${row.id}/reject`, {
        reason,
      });

      await fetchRentals();
    } catch (err) {
      console.log(err);

      setMsg(err.response?.data?.message || "Gagal menolak rental.");
    }
  }

  async function handleMarkOngoing(id) {
    const confirmed = window.confirm(
      "Tandai rental ini sebagai sedang berjalan?"
    );

    if (!confirmed) return;

    try {
      setMsg("");
      await api.patch(`/admin/rentals/${id}/mark-ongoing`);
      await fetchRentals();
    } catch (err) {
      console.log(err);

      setMsg(err.response?.data?.message || "Gagal memulai rental.");
    }
  }

  async function handleMarkReturned(row) {
    const defaultReturnTime = formatDateTimeForApi(new Date());

    const actualReturn = window.prompt(
      "Masukkan waktu pengembalian aktual:",
      defaultReturnTime
    );

    if (!actualReturn) return;

    const confirmed = window.confirm("Tandai kendaraan ini sudah dikembalikan?");

    if (!confirmed) return;

    try {
      setMsg("");

      await api.patch(`/admin/rentals/${row.id}/mark-returned`, {
        actual_return_at: actualReturn,
      });

      await fetchRentals();
    } catch (err) {
      console.log(err);

      setMsg(
        err.response?.data?.message ||
          "Gagal menandai kendaraan dikembalikan."
      );
    }
  }

  async function handleCompleteRepair(row) {
    const confirmed = window.confirm(
      "Tandai proses perbaikan rental ini selesai?"
    );

    if (!confirmed) return;

    try {
      setMsg("");

      await api.patch(`/admin/rentals/${row.id}/update-status-payment`, {
        status: "completed",
      });

      await fetchRentals();
    } catch (err) {
      console.log(err);

      setMsg(err.response?.data?.message || "Gagal menyelesaikan rental.");
    }
  }

  async function handleRefund(id) {
    const confirmed = window.confirm("Yakin ingin melakukan refund rental ini?");

    if (!confirmed) return;

    try {
      setMsg("");

      await api.patch(`/admin/rentals/${id}/refund`);

      alert("Refund berhasil diproses");

      await fetchRentals();
    } catch (err) {
      console.log("ERROR REFUND:");
      console.log(err.response?.data);

      alert(JSON.stringify(err.response?.data, null, 2));
    }
  }

  async function handleSaveEdit(e) {
    e.preventDefault();

    try {
      setSavingEdit(true);
      setMsg("");

      const currentStatus = selectedRow.status;

      const hasPendingDamageInput =
        Boolean(editForm.damage_name) || Boolean(editForm.damage_cost);

      const hasDamageItems = editForm.damages.length > 0;

      const canRunInspection = [
        "returned",
        "inspection",
        "waiting_payment",
      ].includes(currentStatus);

      if (editMode === "inspection") {
        if (!canRunInspection) {
          setMsg("Rental belum bisa diinspeksi dari status saat ini.");
          setSavingEdit(false);
          return;
        }

        if (hasPendingDamageInput) {
          setMsg(
            "Klik + Tambah Kerusakan terlebih dahulu sebelum menyimpan inspeksi."
          );
          setSavingEdit(false);
          return;
        }

        await api.patch(`/admin/rentals/${selectedRow.id}/inspect`, {
          has_late_fine: false,
          late_fine_amount: 0,
          has_damage: hasDamageItems,
          damages: editForm.damages,
        });
      } else {
        await api.patch(`/admin/rentals/${selectedRow.id}/update-status-payment`, {
          notes: editForm.notes,
        });
      }

      await fetchRentals();
      closeEditModal();
    } catch (err) {
      console.log(err);

      setMsg(err.response?.data?.message || "Gagal menyimpan perubahan.");
    } finally {
      setSavingEdit(false);
    }
  }

  const filteredRows = rows.filter((row) => {
    const keyword = search.trim().toLowerCase();

    const customerName =
      row.user?.full_name || row.manual_customer?.customer_name || "";

    const customerPhone =
      row.user?.phone_number || row.manual_customer?.customer_phone || "";

    const vehicleName = row.vehicle?.name || "";

    const bookingCode = row.booking_code || "";

    const matchesSearch =
      !keyword ||
      [bookingCode, customerName, customerPhone, vehicleName]
        .join(" ")
        .toLowerCase()
        .includes(keyword);

    const matchesStatus = !statusFilter || row.status === statusFilter;

    const matchesPayment =
      !paymentStatusFilter || row.payment_status === paymentStatusFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  const activeFilterCount = [statusFilter, paymentStatusFilter].filter(
    Boolean
  ).length;

  function resetFilters() {
    setStatusFilter("");
    setPaymentStatusFilter("");
  }

  return (
    <div className="space-y-4">
      {msg && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {msg}
        </div>
      )}

      <DataTable
        title="Daftar Rental"
        subtitle="Kelola rental kendaraan"
        rows={filteredRows}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        showActions
        searchRight={
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenFilter((prev) => !prev)}
              className={`relative inline-flex h-[42px] w-[42px] items-center justify-center border text-gray-600 transition hover:bg-gray-50 ${
                activeFilterCount > 0
                  ? "border-[#C8102E] text-[#C8102E]"
                  : "border-gray-300"
              }`}
              title="Filter data"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 4h18l-7 8v6l-4 2v-8L3 4z"
                />
              </svg>

              {activeFilterCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C8102E] px-1 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {openFilter && (
              <div className="absolute left-0 top-full z-30 mt-2 w-[290px] border border-gray-200 bg-white p-4 shadow-lg">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-gray-700">
                    Filter Data
                  </p>

                  <button
                    type="button"
                    onClick={() => setOpenFilter(false)}
                    className="text-lg leading-none text-gray-400 hover:text-gray-700"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500">
                      Status Rental
                    </label>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#C8102E]"
                    >
                      <option value="">Semua Status Rental</option>

                      {Object.keys(RENTAL_STATUS_OPTIONS).map((key) => (
                        <option key={key} value={key}>
                          {RENTAL_STATUS_OPTIONS[key]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500">
                      Status Pembayaran
                    </label>

                    <select
                      value={paymentStatusFilter}
                      onChange={(e) => setPaymentStatusFilter(e.target.value)}
                      className="w-full border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#C8102E]"
                    >
                      <option value="">Semua Pembayaran</option>

                      {Object.keys(PAYMENT_STATUS_OPTIONS).map((key) => (
                        <option key={key} value={key}>
                          {PAYMENT_STATUS_OPTIONS[key]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="flex-1 border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Reset
                    </button>

                    <button
                      type="button"
                      onClick={() => setOpenFilter(false)}
                      className="flex-1 bg-[#C8102E] px-3 py-2 text-sm font-semibold text-white hover:opacity-95"
                    >
                      Terapkan
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        }
        columns={[
          {
            key: "booking_code",
            label: "Kode",
          },
          {
            key: "customer",
            label: "Penyewa",
          },
          {
            key: "vehicle",
            label: "Kendaraan",
          },
          {
            key: "total_price",
            label: "Total",
          },
          {
            key: "status",
            label: "Status",
          },
          {
            key: "payment_status",
            label: "Pembayaran",
          },
        ]}
        renderCell={({ row, col }) => {
          if (col.key === "customer") {
            return (
              row.user?.full_name ||
              row.manual_customer?.customer_name ||
              "-"
            );
          }

          if (col.key === "vehicle") {
            return row.vehicle?.name || "-";
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

          return row[col.key];
        }}
        actionsRender={({ row }) => (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => openEditModal(row, "edit")}
              className="rounded-md bg-indigo-600 px-3 py-1 text-xs text-white"
            >
              Edit
            </button>

            {row.status === "pending" && (
              <>
                <button
                  type="button"
                  onClick={() => handleApprove(row.id)}
                  className="rounded-md bg-emerald-600 px-3 py-1 text-xs text-white"
                >
                  Setujui
                </button>

                <button
                  type="button"
                  onClick={() => handleReject(row)}
                  className="rounded-md bg-red-600 px-3 py-1 text-xs text-white"
                >
                  Tolak
                </button>
              </>
            )}

            {row.status === "approved" && row.payment_status === "unpaid" && (
              <button
                type="button"
                onClick={() => handleReject(row)}
                className="rounded-md bg-red-600 px-3 py-1 text-xs text-white"
              >
                Tolak
              </button>
            )}

            {row.status === "approved" && row.payment_status === "paid" && (
              <>
                <button
                  type="button"
                  onClick={() => handleMarkOngoing(row.id)}
                  className="rounded-md bg-blue-600 px-3 py-1 text-xs text-white"
                >
                  Mulai
                </button>

                <button
                  type="button"
                  onClick={() => handleRefund(row.id)}
                  className="rounded-md bg-red-600 px-3 py-1 text-xs text-white"
                >
                  Refund
                </button>
              </>
            )}

            {["ongoing", "overdue"].includes(row.status) && (
              <button
                type="button"
                onClick={() => handleMarkReturned(row)}
                className="rounded-md bg-amber-600 px-3 py-1 text-xs text-white"
              >
                Kembalikan
              </button>
            )}

            {["returned", "inspection", "waiting_payment"].includes(
              row.status
            ) && (
              <button
                type="button"
                onClick={() => openEditModal(row, "inspection")}
                className="rounded-md bg-purple-600 px-3 py-1 text-xs text-white"
              >
                {row.status === "waiting_payment"
                  ? "Revisi Inspeksi"
                  : "Inspeksi"}
              </button>
            )}

            {row.status === "repair_process" && (
              <button
                type="button"
                onClick={() => handleCompleteRepair(row)}
                className="rounded-md bg-emerald-600 px-3 py-1 text-xs text-white"
              >
                Selesaikan
              </button>
            )}
          </div>
        )}
      />

      <Modal
        open={openEdit}
        size="lg"
        title={editMode === "inspection" ? "Inspeksi Rental" : "Edit Rental"}
        onClose={closeEditModal}
      >
        {selectedRow && (
          <form onSubmit={handleSaveEdit} className="space-y-5">
            <div className="rounded-xl border border-gray-100 p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Kode Booking</span>
                <span className="font-medium">{selectedRow.booking_code}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Penyewa</span>
                <span>
                  {selectedRow.user?.full_name ||
                    selectedRow.manual_customer?.customer_name ||
                    "-"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">No. Handphone</span>
                <span className="text-gray-700">
                  {selectedRow.user?.phone_number ||
                    selectedRow.manual_customer?.customer_phone ||
                    "-"}
                </span>
              </div>

              <div className="flex justify-between items-start">
                <span className="text-gray-400 text-sm">Alamat</span>
                <span className="text-gray-700 text-right max-w-xs break-words">
                  {selectedRow.user?.address ||
                    selectedRow.manual_customer?.address ||
                    "-"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Kendaraan</span>
                <span>{selectedRow.vehicle?.name || "-"}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Masa Sewa</span>
                <span className="text-gray-700 font-medium">
                  {formatDate(selectedRow.start_date)} -{" "}
                  {formatDate(selectedRow.end_date)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Total</span>
                <span className="font-semibold">
                  {formatCurrency(selectedRow.total_price)}
                </span>
              </div>
            </div>

            <SectionDivider label="STATUS RENTAL" />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Status Rental</FieldLabel>
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] text-gray-700">
                  {getRentalStatusLabel(editForm.status)}
                </div>
                <p className="mt-1 text-[11px] text-gray-400">
                  Status rental diubah melalui tombol aksi pada tabel.
                </p>
              </div>

              <div>
                <FieldLabel>Status Pembayaran</FieldLabel>
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] text-gray-700">
                  {getPaymentStatusLabel(editForm.payment_status)}
                </div>
                <p className="mt-1 text-[11px] text-gray-400">
                  Pembayaran diperbarui otomatis oleh sistem.
                </p>
              </div>

              <div className="col-span-2">
                <FieldLabel>Pengembalian Aktual</FieldLabel>
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] text-gray-700">
                  {editForm.actual_return_at
                    ? formatDate(editForm.actual_return_at)
                    : "-"}
                </div>
                <p className="mt-1 text-[11px] text-gray-400">
                  Waktu pengembalian diisi saat tombol Kembalikan digunakan.
                </p>
              </div>

              <div className="col-span-2">
                <FieldLabel>Catatan</FieldLabel>
                <textarea
                  rows={3}
                  name="notes"
                  value={editForm.notes}
                  onChange={handleEditChange}
                  className={inputCls(false)}
                />
              </div>
            </div>

            <SectionDivider label="DENDA KETERLAMBATAN" />

            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
              <p className="text-sm font-medium text-gray-700">
                {Number(editForm.system_late_fine_amount || 0) > 0
                  ? formatCurrency(editForm.system_late_fine_amount)
                  : "Tidak ada denda keterlambatan"}
              </p>

              <p className="mt-1 text-[11px] text-gray-400">
                Denda keterlambatan dihitung otomatis oleh sistem saat kendaraan
                dikembalikan.
              </p>
            </div>

            {editMode === "inspection" && (
              <>
                <SectionDivider label="KERUSAKAN" />

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Deskripsi kerusakan"
                      value={editForm.damage_name}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          damage_name: e.target.value,
                        }))
                      }
                      className={inputCls(false)}
                    />

                    <input
                      type="number"
                      placeholder="Biaya perbaikan"
                      value={editForm.damage_cost}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          damage_cost: e.target.value,
                        }))
                      }
                      className={inputCls(false)}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={addDamageItem}
                    className="rounded-md bg-red-500 px-3 py-2 text-xs text-white"
                  >
                    + Tambah Kerusakan
                  </button>

                  <div className="space-y-2">
                    {editForm.damages.length === 0 && (
                      <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-400">
                        Belum ada data kerusakan. Jika kendaraan baik, langsung
                        klik Simpan Inspeksi.
                      </div>
                    )}

                    {editForm.damages.map((dmg, idx) => (
                      <div
                        key={`${dmg.description}-${idx}`}
                        className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {dmg.description}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatCurrency(dmg.repair_cost)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeDamage(idx)}
                          className="text-xs text-red-500"
                        >
                          Hapus
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={savingEdit}
                className="rounded-lg bg-indigo-600 px-5 py-2 text-sm text-white"
              >
                {savingEdit
                  ? "Menyimpan..."
                  : editMode === "inspection"
                    ? "Simpan Inspeksi"
                    : "Simpan"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}