import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import DataTable from "../../../Components/Admin/DataTable";
import Modal from "../../../Components/Admin/Modal";
import RentalForm from "./RentalForm";

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
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${styles[color] || styles.gray}`}>
      {children}
    </span>
  );
}

function getStatusColor(status) {
  switch ((status || "").toLowerCase()) {
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
    case "paid_partial":
      return "indigo";
    default:
      return "gray";
  }
}

function getPaymentStatusColor(status) {
  switch ((status || "").toLowerCase()) {
    case "paid":
      return "green";
    case "partial":
      return "indigo";
    case "failed":
    case "expired":
      return "red";
    case "unpaid":
      return "yellow";
    default:
      return "gray";
  }
}

export default function RentalsList({ type = "mobil" }) {
  const token = localStorage.getItem("token");

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [q, setQ] = useState("");

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

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
    { key: "booking_code", label: "Kode" },
    { key: "penyewa", label: "Penyewa" },
    { key: "kendaraan", label: "Kendaraan" },
    { key: "periode", label: "Periode" },
    { key: "total_price", label: "Total" },
    { key: "status", label: "Status Rental" },
    { key: "payment_status", label: "Status Payment" },
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
      console.error("Gagal memuat rentals:", err);
      setMsg(err.response?.data?.message || "Gagal memuat data penyewaan.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRentals();
  }, [type]);

  const filteredRows = rows.filter((row) => {
    const s = q.toLowerCase();

    const penyewaNama =
      row.user?.full_name ||
      row.manual_customer?.customer_name ||
      "";

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

  function openEditModal(row) {
    setSelectedRow(row);
    setEditForm({
      status: row.status || "approved",
      payment_status: row.payment_status || "unpaid",
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
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
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
        payment_type: editForm.payment_type,
        payment_method: editForm.payment_method,
        amount: editForm.amount ? Number(editForm.amount) : 0,
        notes: editForm.notes || null,
      });

      closeEditModal();
      await fetchRentals();
    } catch (err) {
      console.error(err);
      setMsg(err.response?.data?.message || "Gagal memperbarui rental.");
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <div>
      {msg && (
        <div className="mb-4 rounded-xl border p-3 text-sm text-red-600 bg-red-50">
          {msg}
        </div>
      )}

      <DataTable
        title={`Penyewaan ${type === "mobil" ? "Mobil" : "Motor"}`}
        subtitle="Kelola data booking, approve, pembayaran, dan status sewa."
        searchValue={q}
        onSearchChange={setQ}
        onCreate={() => setOpenCreate(true)}
        createLabel="+ Tambah"
        columns={columns}
        rows={filteredRows}
        loading={loading}
        showActions
        renderCell={({ row, col }) => {
          const penyewaNama =
            row.user?.full_name ||
            row.manual_customer?.customer_name ||
            "-";

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
                <div>{row.start_date || "-"}</div>
                <div className="text-xs text-gray-500">
                  sampai {row.end_date || "-"}
                </div>
              </div>
            );
          }

          if (col.key === "total_price") {
            return `Rp ${Number(row.total_price || 0).toLocaleString("id-ID")}`;
          }

          if (col.key === "status") {
            return (
              <Badge color={getStatusColor(row.status)}>
                {row.status || "-"}
              </Badge>
            );
          }

          if (col.key === "payment_status") {
            return (
              <Badge color={getPaymentStatusColor(row.payment_status)}>
                {row.payment_status || "-"}
              </Badge>
            );
          }

          return String(row[col.key] ?? "");
        }}
        actionsRender={({ row }) => (
          <button
            onClick={() => openEditModal(row)}
            className="rounded-lg bg-indigo-600 px-3 py-1 text-white hover:bg-indigo-700"
          >
            Edit
          </button>
        )}
      />

      <Modal
        open={openCreate}
        size="lg"
        title={`Tambah Penyewaan ${type === "mobil" ? "Mobil" : "Motor"}`}
        onClose={() => setOpenCreate(false)}
      >
        <RentalForm
          type={type}
          onCancel={() => setOpenCreate(false)}
          onCreated={async () => {
            setOpenCreate(false);
            await fetchRentals();
          }}
        />
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
              <div><strong>Kode:</strong> {selectedRow.booking_code}</div>
              <div><strong>Penyewa:</strong> {selectedRow.user?.full_name || selectedRow.manual_customer?.customer_name || "-"}</div>
              <div><strong>Kendaraan:</strong> {selectedRow.vehicle?.name || "-"}</div>
              <div><strong>Total:</strong> Rp {Number(selectedRow.total_price || 0).toLocaleString("id-ID")}</div>
              <div><strong>Sudah Dibayar:</strong> Rp {Number(selectedRow.paid_amount || 0).toLocaleString("id-ID")}</div>
              <div><strong>Sisa:</strong> Rp {Number(selectedRow.remaining_amount || 0).toLocaleString("id-ID")}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Status Rental</label>
                <select
                  name="status"
                  value={editForm.status}
                  onChange={handleEditChange}
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm bg-white"
                >
                  <option value="pending">pending</option>
                  <option value="approved">approved</option>
                  <option value="paid_partial">paid_partial</option>
                  <option value="paid">paid</option>
                  <option value="ongoing">ongoing</option>
                  <option value="completed">completed</option>
                  <option value="rejected">rejected</option>
                  <option value="cancelled">cancelled</option>
                  <option value="expired">expired</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Status Payment</label>
                <select
                  name="payment_status"
                  value={editForm.payment_status}
                  onChange={handleEditChange}
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm bg-white"
                >
                  <option value="unpaid">unpaid</option>
                  <option value="partial">partial</option>
                  <option value="paid">paid</option>
                  <option value="failed">failed</option>
                  <option value="expired">expired</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Tipe Payment</label>
                <select
                  name="payment_type"
                  value={editForm.payment_type}
                  onChange={handleEditChange}
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm bg-white"
                >
                  <option value="dp">dp</option>
                  <option value="full">full</option>
                  <option value="settlement">settlement</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Metode Payment</label>
                <select
                  name="payment_method"
                  value={editForm.payment_method}
                  onChange={handleEditChange}
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm bg-white"
                >
                  <option value="transfer">transfer</option>
                  <option value="cash">cash</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Nominal Tambahan</label>
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
                <label className="text-sm font-medium text-gray-700">Catatan</label>
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
                className="rounded-xl bg-indigo-600 px-4 py-2 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60"
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