import { useEffect, useMemo, useState } from "react";
import axios from "axios";
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
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

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
    fetchRentals();
  }, [type]);

  async function fetchRentals() {
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await api.get("/admin/rentals");
      const data = Array.isArray(res.data?.data) ? res.data.data : [];

      // normalisasi lowercase supaya MOBIL cocok dengan mobil
      const filtered = data.filter((item) => {
        const vehicleTypeCode = String(
          item?.vehicle?.vehicle_type?.code || ""
        ).toLowerCase();

        return vehicleTypeCode === String(type).toLowerCase();
      });

      setRows(filtered);
    } catch (err) {
      console.error("Gagal memuat rentals:", err);
      setErrorMessage(
        err.response?.data?.message || "Gagal memuat data penyewaan."
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  async function approveRental(id) {
    setActionLoadingId(id);
    try {
      await api.patch(`/admin/rentals/${id}/approve`, {
        payment_deadline_hours: 2,
      });
      await fetchRentals();
    } catch (err) {
      console.error("Approve gagal:", err);
      alert(err.response?.data?.message || "Gagal approve rental.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function rejectRental(id) {
    const reason = window.prompt("Masukkan alasan penolakan:");
    if (!reason) return;

    setActionLoadingId(id);
    try {
      await api.patch(`/admin/rentals/${id}/reject`, { reason });
      await fetchRentals();
    } catch (err) {
      console.error("Reject gagal:", err);
      alert(err.response?.data?.message || "Gagal reject rental.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function markOngoing(id) {
    setActionLoadingId(id);
    try {
      await api.patch(`/admin/rentals/${id}/mark-ongoing`);
      await fetchRentals();
    } catch (err) {
      console.error("Mark ongoing gagal:", err);
      alert(
        err.response?.data?.message ||
          "Gagal mengubah status menjadi ongoing."
      );
    } finally {
      setActionLoadingId(null);
    }
  }

  async function completeRental(id) {
    setActionLoadingId(id);
    try {
      await api.patch(`/admin/rentals/${id}/complete`, {});
      await fetchRentals();
    } catch (err) {
      console.error("Complete gagal:", err);
      alert(err.response?.data?.message || "Gagal menyelesaikan rental.");
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Penyewaan {type === "mobil" ? "Mobil" : "Motor"}
        </h1>
        <p className="text-sm text-gray-500">
          Kelola data booking, approve, pembayaran, dan status sewa.
        </p>
      </div>

      <RentalForm type={type} onCreated={fetchRentals} />

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold">Daftar Penyewaan</h2>
          <button
            onClick={fetchRentals}
            className="px-3 py-2 rounded-xl border border-gray-300 text-sm hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-5 text-sm text-gray-500">Memuat data...</div>
        ) : errorMessage ? (
          <div className="p-5 text-sm text-red-600">{errorMessage}</div>
        ) : rows.length === 0 ? (
          <div className="p-5 text-sm text-gray-500">
            Belum ada data penyewaan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">Kode</th>
                  <th className="px-4 py-3 text-left">Penyewa</th>
                  <th className="px-4 py-3 text-left">Kendaraan</th>
                  <th className="px-4 py-3 text-left">Periode</th>
                  <th className="px-4 py-3 text-left">Total</th>
                  <th className="px-4 py-3 text-left">Status Rental</th>
                  <th className="px-4 py-3 text-left">Status Payment</th>
                  <th className="px-4 py-3 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const busy = actionLoadingId === row.id;

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

                  return (
                    <tr
                      key={row.id}
                      className="border-t border-gray-100 align-top"
                    >
                      <td className="px-4 py-3 font-medium">
                        {row.booking_code}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium">{penyewaNama}</div>
                        <div className="text-xs text-gray-500">
                          {penyewaKontak}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {row.vehicle?.name || "-"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {row.vehicle?.plate_number || "-"}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div>{row.start_date || "-"}</div>
                        <div className="text-xs text-gray-500">
                          sampai {row.end_date || "-"}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        Rp{" "}
                        {Number(row.total_price || 0).toLocaleString("id-ID")}
                      </td>

                      <td className="px-4 py-3">
                        <Badge color={getStatusColor(row.status)}>
                          {row.status || "-"}
                        </Badge>
                      </td>

                      <td className="px-4 py-3">
                        <Badge color={getPaymentStatusColor(row.payment_status)}>
                          {row.payment_status || "-"}
                        </Badge>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {String(row.status).toLowerCase() === "pending" && (
                            <>
                              <button
                                onClick={() => approveRental(row.id)}
                                disabled={busy}
                                className="px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => rejectRental(row.id)}
                                disabled={busy}
                                className="px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {["paid", "paid_partial"].includes(
                            String(row.status).toLowerCase()
                          ) && (
                            <button
                              onClick={() => markOngoing(row.id)}
                              disabled={busy}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                            >
                              Mulai Sewa
                            </button>
                          )}

                          {["ongoing", "overdue"].includes(
                            String(row.status).toLowerCase()
                          ) && (
                            <button
                              onClick={() => completeRental(row.id)}
                              disabled={busy}
                              className="px-3 py-1.5 rounded-lg bg-gray-800 text-white hover:bg-black disabled:opacity-60"
                            >
                              Selesaikan
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}