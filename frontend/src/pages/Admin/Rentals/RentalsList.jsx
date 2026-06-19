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
    case "waiting_payment":
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
      failed: "Gagal",
      expired: "Kedaluwarsa",
    }[String(s || "").toLowerCase()] || s
  );
}

function formatCurrency(v) {
  return `Rp ${Number(v || 0).toLocaleString("id-ID")}`;
}

// Fungsi pembantu untuk memformat tampilan Tanggal agar rapi di Modal Admin
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

// Kamus Translasi untuk Opsi Dropdown Select Status di Dalam Modal
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
  unpaid: "Belum Bayar (Unpaid)",
  paid: "Sudah Bayar (Paid)",
  refund: "Refund",
  failed: "Gagal (Failed)",
  expired: "Kedaluwarsa (Expired)"
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

// export default function RentalsList() {
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

  const [loading, setLoading] = useState(true);

  const [msg, setMsg] = useState("");

  const [openEdit, setOpenEdit] = useState(false);

  const [selectedRow, setSelectedRow] = useState(null);

  const [savingEdit, setSavingEdit] = useState(false);

  const [editForm, setEditForm] = useState({
    status: "",
    payment_status: "",

    payment_method: "transfer",

    payment_type: "full",

    amount: "",

    notes: "",

    actual_return_at: "",

    has_late_fine: false,

    late_fine_amount: "",

    damages: [],

    damage_name: "",

    damage_cost: "",
  });

  async function fetchRentals() {
    try {
      setLoading(true);

      const res = await api.get("/admin/rentals");

      const rentals = res.data?.data || [];

      const filtered = rentals.filter((item) => {
        const vehicleType =
          item.vehicle?.vehicle_type?.code;

        return (
          vehicleType?.toUpperCase() ===
          type.toUpperCase()
        );
      });

      setRows(filtered);
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

      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  }

  function addDamageItem() {
    if (!editForm.damage_name || !editForm.damage_cost)
      return;

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
  }

  function removeDamage(index) {
    setEditForm((prev) => ({
      ...prev,

      damages: prev.damages.filter(
        (_, i) => i !== index
      ),
    }));
  }

  function openEditModal(row) {
    setSelectedRow(row);

    setEditForm({
      status: row.status || "",

      payment_status:
        row.payment_status || "",

      payment_method: "transfer",

      payment_type: "full",

      amount: "",

      notes: "",

      actual_return_at: "",

      has_late_fine: false,

      late_fine_amount: "",

      damages: [],

      damage_name: "",

      damage_cost: "",
    });

    setOpenEdit(true);
  }

  function closeEditModal() {
    setOpenEdit(false);

    setSelectedRow(null);
  }

  async function updateStatusPayment() {
    await api.patch(
      `/admin/rentals/${selectedRow.id}/update-status-payment`,
      {
        status: editForm.status,

        payment_status:
          editForm.payment_status,

        payment_method:
          editForm.payment_method,

        payment_type:
          editForm.payment_type,

        amount: editForm.amount
          ? Number(editForm.amount)
          : 0,

        notes: editForm.notes,
      }
    );
  }

  async function completeRental() {
    if (
      editForm.status !== "completed"
    ) {
      return;
    }

    await api.post(
      `/admin/rentals/${selectedRow.id}/complete`,
      {
        actual_return_at:
          editForm.actual_return_at ||
          null,
      }
    );
  }

async function handleSaveEdit(e) {

  e.preventDefault();

  try {

    setSavingEdit(true);

    setMsg("");

    const currentStatus =
      selectedRow.status;

    const nextStatus =
      editForm.status;

    // APPROVE
    if (
      currentStatus === "pending" &&
      nextStatus === "approved"
    ) {

      await api.patch(
        `/admin/rentals/${selectedRow.id}/approve`
      );
    }

    // REJECT
    else if (
      nextStatus === "rejected"
    ) {

      await api.patch(
        `/admin/rentals/${selectedRow.id}/reject`,
        {
          reason:
            editForm.notes ||
            "Ditolak admin",
        }
      );
    }

    // ONGOING
    else if (
      selectedRow.status === "approved" &&
      selectedRow.payment_status === "paid" &&
      nextStatus === "ongoing"
    )
    {

      await api.patch(
        `/admin/rentals/${selectedRow.id}/mark-ongoing`
      );
    }

    // RETURNED
    else if (
      ["ongoing", "overdue"].includes(currentStatus) &&
      nextStatus === "returned"
    ) {

      await api.patch(
        `/admin/rentals/${selectedRow.id}/mark-returned`,
        {
          actual_return_at:
            editForm.actual_return_at || null,
        }
      );
    }

    // INSPECTION
    else if (
      currentStatus === "returned" &&
      (
        nextStatus === "inspection" ||
        nextStatus === "waiting_payment" ||
        nextStatus === "completed"
      )
    ) {

      const hasFine =
        editForm.has_late_fine;

      const hasDamage =
        editForm.damages.length > 0;

      await api.patch(
        `/admin/rentals/${selectedRow.id}/inspect`,
        {
          has_late_fine:
            hasFine,

          late_fine_amount:
            editForm.late_fine_amount
              ? Number(
                  editForm.late_fine_amount
                )
              : 0,

          has_damage:
            hasDamage,

          damages:
            editForm.damages,
        }
      );
    }

    // PAYMENT COMPLETED
    else if (
      currentStatus === "waiting_payment" &&
      nextStatus === "repair_process"
    ) {

      await api.patch(
        `/admin/rentals/${selectedRow.id}/update-status-payment`,
        {
          status:
            "repair_process",

          payment_status:
            "paid",

          payment_method:
            editForm.payment_method,

          payment_type:
            editForm.payment_type,

          amount:
            editForm.amount
              ? Number(editForm.amount)
              : 0,
        }
      );
    }

    // FINAL COMPLETED
    else if (
      currentStatus === "repair_process" &&
      nextStatus === "completed"
    ) {

      await api.patch(
        `/admin/rentals/${selectedRow.id}/update-status-payment`,
        {
          status:
            "completed"
        }
      );
    }

    // GENERAL UPDATE
    else {

      await api.patch(
        `/admin/rentals/${selectedRow.id}/update-status-payment`,
        {
          status:
            editForm.status,

          payment_status:
            editForm.payment_status,

          payment_method:
            editForm.payment_method,

          payment_type:
            editForm.payment_type,

          amount:
            editForm.amount
              ? Number(editForm.amount)
              : 0,

          notes:
            editForm.notes,
        }
      );
    }

    await fetchRentals();

    closeEditModal();

  } catch (err) {

    console.log(err);

    setMsg(
      err.response?.data?.message ||
      "Gagal update rental."
    );

  } finally {

    setSavingEdit(false);
  }
}


async function handleRefund(id) {
  const confirmed = window.confirm(
    "Yakin ingin melakukan refund rental ini?"
  );

  if (!confirmed) return;

  try {

    await api.patch(
      `/admin/rentals/${id}/refund`
    );

    alert("Refund berhasil diproses");

    await fetchRentals();

  } catch (err) {

    console.log("ERROR REFUND:");
    console.log(err.response?.data);

    alert(
      JSON.stringify(
        err.response?.data,
        null,
        2
      )
    );

  }
}

  const filteredRows = rows.filter((row) => {
    const keyword = search.trim().toLowerCase();

    const customerName =
      row.user?.full_name ||
      row.manual_customer?.customer_name ||
      "";

    const customerPhone =
      row.user?.phone_number ||
      row.manual_customer?.phone_number ||
      "";

    const vehicleName = row.vehicle?.name || "";
    const bookingCode = row.booking_code || "";

    const matchesSearch =
      !keyword ||
      [bookingCode, customerName, customerPhone, vehicleName]
        .join(" ")
        .toLowerCase()
        .includes(keyword);

    const matchesStatus =
      !statusFilter || row.status === statusFilter;

    const matchesPayment =
      !paymentStatusFilter || row.payment_status === paymentStatusFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

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
    headerRight={
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="border border-gray-300 px-3 py-2 text-sm"
      >
        <option value="">Semua Status Rental</option>

        {Object.keys(RENTAL_STATUS_OPTIONS).map((key) => (
          <option key={key} value={key}>
            {RENTAL_STATUS_OPTIONS[key]}
          </option>
        ))}
      </select>

      <select
        value={paymentStatusFilter}
        onChange={(e) => setPaymentStatusFilter(e.target.value)}
        className="border border-gray-300 px-3 py-2 text-sm"
      >
        <option value="">Semua Pembayaran</option>

        {Object.keys(PAYMENT_STATUS_OPTIONS).map((key) => (
          <option key={key} value={key}>
            {PAYMENT_STATUS_OPTIONS[key]}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => {
          setSearch("");
          setStatusFilter("");
          setPaymentStatusFilter("");
        }}
        className="border border-gray-300 px-3 py-2 text-sm font-semibold"
      >
        Reset
      </button>
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
                row.manual_customer
                  ?.customer_name ||
                "-"
              );
            }

            if (col.key === "vehicle") {
              return row.vehicle?.name || "-";
            }

            if (col.key === "total_price") {
              return formatCurrency(
                row.total_price
              );
            }

            if (col.key === "status") {
              return (
                <Badge
                  color={getStatusColor(
                    row.status
                  )}
                >
                  {getRentalStatusLabel(
                    row.status
                  )}
                </Badge>
              );
            }

            if (
              col.key === "payment_status"
            ) {
              return (
                <Badge
                  color={getPaymentStatusColor(
                    row.payment_status
                  )}
                >
                  {getPaymentStatusLabel(
                    row.payment_status
                  )}
                </Badge>
              );
            }

            return row[col.key];
          }}

  actionsRender={({ row }) => (
    <div className="flex gap-2">

      <button
        onClick={() =>
          openEditModal(row)
        }
        className="rounded-md bg-indigo-600 px-3 py-1 text-xs text-white"
      >
        Edit
      </button>

      {row.status === "approved" &&
        row.payment_status === "paid" && (
          <button
            onClick={() =>
              handleRefund(row.id)
            }
            className="rounded-md bg-red-600 px-3 py-1 text-xs text-white"
          >
            Refund
          </button>
        )}

    </div>
  )}
          
      />

      <Modal
        open={openEdit}
        size="lg"
        title="Edit Rental"
        onClose={closeEditModal}
      >
        {selectedRow && (
          <form
            onSubmit={handleSaveEdit}
            className="space-y-5"
          >

            <div className="rounded-xl border border-gray-100 p-4 space-y-2">

              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">
                  Kode Booking
                </span>

                <span className="font-medium">
                  {selectedRow.booking_code}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">
                  Penyewa
                </span>

                <span>
                  {selectedRow.user?.full_name ||
                    selectedRow.manual_customer?.customer_name}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">
                  No. Handphone
                </span>
                <span className="text-gray-700">
                  {selectedRow.user?.phone_number ||
                    selectedRow.manual_customer?.phone_number || 
                    "-"}
                </span>
              </div>

              <div className="flex justify-between items-start">
                <span className="text-gray-400 text-sm">
                  Alamat
                </span>
                <span className="text-gray-700 text-right max-w-xs break-words">
                  {selectedRow.user?.address ||
                    selectedRow.manual_customer?.address || 
                    "-"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">
                  Kendaraan
                </span>

                <span>
                  {
                    selectedRow.vehicle
                      ?.name
                  }
                </span>
              </div>

              {/* MENAMPILKAN MASA SEWA (TANGGAL MULAI s/d SELESAI) */}
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">
                  Masa Sewa
                </span>
                <span className="text-gray-700 font-medium">
                  {formatDate(selectedRow.start_date || selectedRow.start_time)} - {formatDate(selectedRow.end_date || selectedRow.end_time)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">
                  Total
                </span>

                <span className="font-semibold">
                  {formatCurrency(
                    selectedRow.total_price
                  )}
                </span>
              </div>

            </div>

            <SectionDivider label="STATUS RENTAL" />

            <div className="grid grid-cols-2 gap-4">

              <div>
                <FieldLabel>
                  Status Rental
                </FieldLabel>

              <select
                name="status"
                value={editForm.status}
                onChange={handleEditChange}
                className={inputCls(false)}
              >
                {Object.keys(RENTAL_STATUS_OPTIONS).map((key) => (
                  <option key={key} value={key}>
                    {RENTAL_STATUS_OPTIONS[key]}
                  </option>
                ))}
              </select>               
              </div>

              <div>
                <FieldLabel>
                  Status Pembayaran
                </FieldLabel>

                <select
                  name="payment_status"
                  value={
                    editForm.payment_status
                  }
                  onChange={
                    handleEditChange
                  }
                  className={inputCls(false)}
                >
                  {Object.keys(PAYMENT_STATUS_OPTIONS).map((key) => (
                    <option key={key} value={key}>
                      {PAYMENT_STATUS_OPTIONS[key]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel>
                  Metode Pembayaran
                </FieldLabel>

                <select
                  name="payment_method"
                  value={
                    editForm.payment_method
                  }
                  onChange={
                    handleEditChange
                  }
                  className={inputCls(false)}
                >
                  <option value="transfer">
                    Transfer
                  </option>

                  <option value="cash">
                    Tunai (Cash)
                  </option>

                </select>
              </div>

              <div>
                <FieldLabel>
                  Nominal Bayar
                </FieldLabel>

                <input
                  type="number"
                  name="amount"
                  value={editForm.amount}
                  onChange={
                    handleEditChange
                  }
                  className={inputCls(false)}
                />
              </div>

              <div className="col-span-2">
                <FieldLabel>
                  Pengembalian Aktual (Actual Return)
                </FieldLabel>

                <input
                  type="datetime-local"
                  name="actual_return_at"
                  value={
                    editForm.actual_return_at
                  }
                  onChange={
                    handleEditChange
                  }
                  className={inputCls(false)}
                />
              </div>

              <div className="col-span-2">
                <FieldLabel>
                  Catatan
                </FieldLabel>

                <textarea
                  rows={3}
                  name="notes"
                  value={editForm.notes}
                  onChange={
                    handleEditChange
                  }
                  className={inputCls(false)}
                />
              </div>

            </div>

            <SectionDivider label="DENDA KETERLAMBATAN" />

            <div className="space-y-3">

              <label className="flex items-center gap-2 text-sm">

                <input
                  type="checkbox"
                  name="has_late_fine"
                  checked={
                    editForm.has_late_fine
                  }
                  onChange={
                    handleEditChange
                  }
                />

                Ada denda keterlambatan

              </label>

              {editForm.has_late_fine && (
                <input
                  type="number"
                  name="late_fine_amount"
                  placeholder="Jumlah denda"
                  value={
                    editForm.late_fine_amount
                  }
                  onChange={
                    handleEditChange
                  }
                  className={inputCls(false)}
                />
              )}

            </div>

            <SectionDivider label="KERUSAKAN" />

            <div className="space-y-3">

              <div className="grid grid-cols-2 gap-3">

                <input
                  type="text"
                  placeholder="Deskripsi kerusakan"
                  value={
                    editForm.damage_name
                  }
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,

                      damage_name:
                        e.target.value,
                    }))
                  }
                  className={inputCls(false)}
                />

                <input
                  type="number"
                  placeholder="Biaya perbaikan"
                  value={
                    editForm.damage_cost
                  }
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,

                      damage_cost:
                        e.target.value,
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

                {editForm.damages.map(
                  (dmg, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2"
                    >

                      <div>

                        <p className="text-sm font-medium">
                          {
                            dmg.description
                          }
                        </p>

                        <p className="text-xs text-gray-400">
                          {formatCurrency(
                            dmg.repair_cost
                          )}
                        </p>

                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeDamage(
                            idx
                          )
                        }
                        className="text-xs text-red-500"
                      >
                        Hapus
                      </button>

                    </div>
                  )
                )}

              </div>

            </div>

            <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">

              <button
                type="button"
                onClick={
                  closeEditModal
                }
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
                  : "Simpan"}
              </button>

            </div>

          </form>
        )}
      </Modal>
    </div>
  );
}