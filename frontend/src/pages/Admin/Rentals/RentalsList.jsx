// C:\laragon\www\rentcare\frontend\src\pages\Admin\Rentals\RentalsList.jsx

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
      return "indigo";
    default:
      return "gray";
  }
}

function getPaymentStatusColor(s) {
  switch (String(s || "").toLowerCase()) {
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

function getRentalStatusLabel(s) {
  return (
    {
      pending: "Menunggu Persetujuan",
      approved: "Disetujui",
      paid: "Lunas",
      ongoing: "Sedang Berjalan",
      completed: "Selesai",
      overdue: "Terlambat",
      rejected: "Ditolak",
      cancelled: "Dibatalkan",
      expired: "Kedaluwarsa",
    }[String(s || "").toLowerCase()] || s
  );
}

function getPaymentStatusLabel(s) {
  return (
    {
      unpaid: "Belum Bayar",
      paid: "Sudah Bayar",
      failed: "Gagal",
      expired: "Kedaluwarsa",
    }[String(s || "").toLowerCase()] || s
  );
}

function formatCurrency(v) {
  return `Rp ${Number(v || 0).toLocaleString("id-ID")}`;
}

function formatDateTime(v) {
  if (!v) return "-";

  const d = new Date(v);

  return d.toLocaleString("id-ID", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
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

export default function RentalsList({ type = "mobil" }) {
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
  const [loading, setLoading] = useState(true);

  const [openEdit, setOpenEdit] = useState(false);

  const [selectedRow, setSelectedRow] = useState(null);

  const [savingEdit, setSavingEdit] = useState(false);

  const [msg, setMsg] = useState("");

  const [editForm, setEditForm] = useState({
    status: "",
    payment_status: "",
    payment_type: "full",
    payment_method: "transfer",
    amount: "",
    notes: "",

    returned_at: "",

    damages: [],

    damage_name: "",
    damage_cost: "",
  });

  async function fetchRentals() {
    try {
      setLoading(true);

      const res = await api.get("/admin/rentals");

      setRows(res.data?.data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRentals();
  }, []);

  function handleEditChange(e) {
    const { name, value } = e.target;

    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function addDamageItem() {
    if (!editForm.damage_name || !editForm.damage_cost) return;

    setEditForm((prev) => ({
      ...prev,

      damages: [
        ...prev.damages,

        {
          item_name: prev.damage_name,
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

      damages: prev.damages.filter((_, i) => i !== index),
    }));
  }

  function openEditModal(row) {
    setSelectedRow(row);

    setEditForm({
      status: row.status || "",
      payment_status: row.payment_status || "",
      payment_type: "full",
      payment_method: "transfer",
      amount: "",
      notes: "",

      returned_at: "",

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

  async function handleSaveEdit(e) {
    e.preventDefault();

    try {
      setSavingEdit(true);

      await api.patch(
        `/admin/rentals/${selectedRow.id}/update-status-payment`,
        {
          status: editForm.status,

          payment_status: editForm.payment_status,

          payment_type: editForm.payment_type,

          payment_method: editForm.payment_method,

          amount: editForm.amount
            ? Number(editForm.amount)
            : 0,

          notes: editForm.notes,

          returned_at: editForm.returned_at || null,

          damages: editForm.damages,
        }
      );

      await fetchRentals();

      closeEditModal();
    } catch (err) {
      setMsg(
        err.response?.data?.message ||
          "Gagal update rental."
      );
    } finally {
      setSavingEdit(false);
    }
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

        columns={[
          { key: "booking_code", label: "Kode" },
          { key: "customer", label: "Penyewa" },
          { key: "vehicle", label: "Kendaraan" },
          { key: "total_price", label: "Total" },
          { key: "status", label: "Status" },
          { key: "payment_status", label: "Pembayaran" },
        ]}

        rows={rows}

        loading={loading}

        showActions

        renderCell={({ row, col }) => {

          if (col.key === "customer") {
            return (
              <div>
                {row.user?.full_name ||
                  row.manual_customer?.customer_name ||
                  "-"}
              </div>
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
          <button
            onClick={() => openEditModal(row)}
            className="rounded-md bg-indigo-600 px-3 py-1 text-xs text-white"
          >
            Edit
          </button>
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
                  Booking Code
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
                    selectedRow.manual_customer
                      ?.customer_name}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">
                  Kendaraan
                </span>

                <span>
                  {selectedRow.vehicle?.name}
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
                <FieldLabel>Status Rental</FieldLabel>

                <select
                  name="status"
                  value={editForm.status}
                  onChange={handleEditChange}
                  className={inputCls(false)}
                >
                  <option value="pending">
                    Pending
                  </option>

                  <option value="approved">
                    Approved
                  </option>

                  <option value="paid">
                    Paid
                  </option>

                  <option value="ongoing">
                    Ongoing
                  </option>

                  <option value="completed">
                    Completed
                  </option>

                  <option value="overdue">
                    Overdue
                  </option>

                  <option value="cancelled">
                    Cancelled
                  </option>
                </select>
              </div>

              <div>
                <FieldLabel>Status Pembayaran</FieldLabel>

                <select
                  name="payment_status"
                  value={editForm.payment_status}
                  onChange={handleEditChange}
                  className={inputCls(false)}
                >
                  <option value="unpaid">
                    Unpaid
                  </option>

                  <option value="paid">
                    Paid
                  </option>

                  <option value="failed">
                    Failed
                  </option>

                  <option value="expired">
                    Expired
                  </option>
                </select>
              </div>

              <div>
                <FieldLabel>Metode Pembayaran</FieldLabel>

                <select
                  name="payment_method"
                  value={editForm.payment_method}
                  onChange={handleEditChange}
                  className={inputCls(false)}
                >
                  <option value="transfer">
                    Transfer
                  </option>

                  <option value="cash">
                    Cash
                  </option>
                </select>
              </div>

              <div>
                <FieldLabel>Nominal Bayar</FieldLabel>

                <input
                  type="number"
                  name="amount"
                  value={editForm.amount}
                  onChange={handleEditChange}
                  className={inputCls(false)}
                />
              </div>

              <div className="col-span-2">
                <FieldLabel>
                  Tanggal Pengembalian
                </FieldLabel>

                <input
                  type="datetime-local"
                  name="returned_at"
                  value={editForm.returned_at}
                  onChange={handleEditChange}
                  className={inputCls(false)}
                />
              </div>

              <div className="col-span-2">
                <FieldLabel>Catatan</FieldLabel>

                <textarea
                  name="notes"
                  rows={3}
                  value={editForm.notes}
                  onChange={handleEditChange}
                  className={inputCls(false)}
                />
              </div>

            </div>

            <SectionDivider label="KERUSAKAN" />

            <div className="space-y-3">

              <div className="grid grid-cols-2 gap-3">

                <input
                  type="text"
                  placeholder="Nama kerusakan"
                  value={editForm.damage_name}
                  onChange={(e)=>
                    setEditForm(prev => ({
                      ...prev,
                      damage_name:e.target.value
                    }))
                  }
                  className={inputCls(false)}
                />

                <input
                  type="number"
                  placeholder="Biaya perbaikan"
                  value={editForm.damage_cost}
                  onChange={(e)=>
                    setEditForm(prev => ({
                      ...prev,
                      damage_cost:e.target.value
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

                {editForm.damages.map((dmg, idx)=>(
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2"
                  >

                    <div>
                      <p className="text-sm font-medium">
                        {dmg.item_name}
                      </p>

                      <p className="text-xs text-gray-400">
                        {formatCurrency(
                          dmg.repair_cost
                        )}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={()=>
                        removeDamage(idx)
                      }
                      className="text-xs text-red-500"
                    >
                      Hapus
                    </button>
                  </div>
                ))}
              </div>
            </div>

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
                  : "Simpan"}
              </button>
            </div>

          </form>
        )}
      </Modal>
    </div>
  );
}