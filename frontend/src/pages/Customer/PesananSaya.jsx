import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../Components/Public/Header";
import Footer from "../../Components/Public/Footer";

function formatCurrency(value) {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
}

function formatDateTime(value) {
  if (!value) return "-";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getRentalStatusLabel(status) {
  switch (String(status || "").toLowerCase()) {
    case "pending":
      return "Menunggu Persetujuan";
    case "approved":
      return "Disetujui";
    case "paid":
      return "Sudah Dibayar";
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

function getRentalStatusClass(status) {
  switch (String(status || "").toLowerCase()) {
    case "pending":
      return "bg-yellow-100 text-yellow-700";
    case "approved":
      return "bg-blue-100 text-blue-700";
    case "paid":
      return "bg-green-100 text-green-700";
    case "ongoing":
    case "overdue":
      return "bg-indigo-100 text-indigo-700";
    case "completed":
      return "bg-emerald-100 text-emerald-700";
    case "rejected":
    case "cancelled":
    case "expired":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
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

function getPaymentStatusClass(status) {
  switch (String(status || "").toLowerCase()) {
    case "paid":
      return "bg-green-100 text-green-700";
    case "unpaid":
      return "bg-yellow-100 text-yellow-700";
    case "failed":
    case "expired":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getFilterTabs() {
  return [
    { key: "all", label: "Semua" },
    { key: "pending", label: "Menunggu" },
    { key: "waiting_payment", label: "Menunggu Pembayaran" },
    { key: "ongoing", label: "Sedang Berjalan" },
    { key: "completed", label: "Selesai" },
    { key: "rejected", label: "Ditolak" },
  ];
}

export default function PesananSaya() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setMsg("");

        const res = await fetch("http://localhost:8000/api/my-rentals", {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(data?.message || "Gagal memuat pesanan");
        }

        const items = Array.isArray(data?.data) ? data.data : [];
        setRows(items);
      } catch (err) {
        setMsg(err.message || "Terjadi kesalahan saat memuat pesanan");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      load();
    }
  }, [token]);

  const filteredRows = useMemo(() => {
    if (activeTab === "all") return rows;

    if (activeTab === "pending") {
      return rows.filter((item) => String(item.status).toLowerCase() === "pending");
    }

    if (activeTab === "waiting_payment") {
      return rows.filter(
        (item) =>
          String(item.status).toLowerCase() === "approved" &&
          String(item.payment_status).toLowerCase() === "unpaid"
      );
    }

    if (activeTab === "ongoing") {
      return rows.filter((item) =>
        ["ongoing", "paid", "overdue"].includes(String(item.status).toLowerCase())
      );
    }

    if (activeTab === "completed") {
      return rows.filter((item) => String(item.status).toLowerCase() === "completed");
    }

    if (activeTab === "rejected") {
      return rows.filter((item) =>
        ["rejected", "cancelled", "expired"].includes(String(item.status).toLowerCase())
      );
    }

    return rows;
  }, [rows, activeTab]);

  const goToDetail = (itemId) => {
    navigate(`/pesanan-saya/${itemId}`);
  };

  const goToPayment = (e, itemId) => {
    e.stopPropagation();
    navigate(`/pesanan-saya/${itemId}/pembayaran`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Pesanan Saya</h1>
            <p className="mt-1 text-sm text-gray-600">
              Lihat semua pesanan, status persetujuan, dan status pembayaran Anda.
            </p>
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            {getFilterTabs().map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab.key
                    ? "bg-red-500 text-white"
                    : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="rounded-xl bg-white border border-gray-200 p-8 text-center text-gray-500">
              Memuat pesanan...
            </div>
          ) : msg ? (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-600">
              {msg}
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="rounded-xl bg-white border border-gray-200 p-8 text-center text-gray-500">
              Belum ada pesanan.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRows.map((item) => {
                const vehicle = item.vehicle || {};
                const canPay =
                  String(item.status).toLowerCase() === "approved" &&
                  String(item.payment_status).toLowerCase() === "unpaid";

                return (
                  <div
                    key={item.id}
                    onClick={() => goToDetail(item.id)}
                    className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-red-200"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-400">
                            Kode Booking
                          </p>
                          <p className="text-lg font-bold text-gray-900">
                            {item.booking_code || "-"}
                          </p>
                        </div>

                        <div>
                          <p className="font-semibold text-gray-900">
                            {vehicle.name || "-"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {vehicle.plate_number || "-"}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div>
                            <p className="text-xs text-gray-400">Tanggal Mulai</p>
                            <p className="text-sm font-medium text-gray-700">
                              {formatDateTime(item.start_date)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-400">Tanggal Selesai</p>
                            <p className="text-sm font-medium text-gray-700">
                              {formatDateTime(item.end_date)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-400">Total Bayar</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {formatCurrency(item.total_price)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getRentalStatusClass(
                              item.status
                            )}`}
                          >
                            {getRentalStatusLabel(item.status)}
                          </span>

                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getPaymentStatusClass(
                              item.payment_status
                            )}`}
                          >
                            {getPaymentStatusLabel(item.payment_status)}
                          </span>
                        </div>

                        {String(item.status).toLowerCase() === "pending" && (
                          <p className="text-sm text-yellow-700">
                            Pesanan Anda sedang menunggu persetujuan admin.
                          </p>
                        )}

                        {canPay && (
                          <p className="text-sm text-blue-700">
                            Pesanan Anda sudah disetujui. Silakan lanjutkan pembayaran.
                          </p>
                        )}

                        {String(item.status).toLowerCase() === "rejected" && (
                          <p className="text-sm text-red-600">
                            Pesanan Anda ditolak oleh admin.
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 lg:min-w-[220px]">
                        {canPay ? (
                          <button
                            type="button"
                            onClick={(e) => goToPayment(e, item.id)}
                            className="rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600"
                          >
                            Bayar Sekarang
                          </button>
                        ) : (
                          <div className="text-xs text-gray-400 text-right">
                            Klik kartu untuk lihat detail pesanan
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}