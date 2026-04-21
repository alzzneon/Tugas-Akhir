import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

export default function PembayaranPesanan() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

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
          throw new Error(data?.message || "Gagal memuat data pembayaran");
        }

        setRows(Array.isArray(data?.data) ? data.data : []);
      } catch (err) {
        setMsg(err.message || "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      load();
    }
  }, [token]);

  const item = useMemo(() => {
    return rows.find((row) => String(row.id) === String(id)) || null;
  }, [rows, id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 px-6 py-8">
          <div className="max-w-3xl mx-auto rounded-xl bg-white border border-gray-200 p-8 text-center text-gray-500">
            Memuat halaman pembayaran...
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (msg) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 px-6 py-8">
          <div className="max-w-3xl mx-auto rounded-xl bg-red-50 border border-red-200 p-4 text-red-600">
            {msg}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 px-6 py-8">
          <div className="max-w-3xl mx-auto rounded-xl bg-white border border-gray-200 p-8 text-center text-gray-500">
            Data pembayaran tidak ditemukan.
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const canPay =
    String(item.status).toLowerCase() === "approved" &&
    String(item.payment_status).toLowerCase() === "unpaid";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-5 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Pembayaran Pesanan</h1>
            <button
              type="button"
              onClick={() => navigate(`/pesanan-saya/${item.id}`)}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Kembali
            </button>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">Kode Booking</p>
              <p className="text-2xl font-bold text-gray-900">{item.booking_code}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs text-gray-400">Kendaraan</p>
                <p className="mt-1 font-semibold text-gray-900">{item.vehicle?.name || "-"}</p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs text-gray-400">Total Bayar</p>
                <p className="mt-1 font-semibold text-gray-900">{formatCurrency(item.total_price)}</p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs text-gray-400">Tanggal Mulai</p>
                <p className="mt-1 font-semibold text-gray-900">{formatDateTime(item.start_date)}</p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs text-gray-400">Tanggal Selesai</p>
                <p className="mt-1 font-semibold text-gray-900">{formatDateTime(item.end_date)}</p>
              </div>
            </div>

            {!canPay ? (
              <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-4 text-yellow-700">
                Pesanan ini belum dapat dibayar atau sudah tidak dalam status menunggu pembayaran.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-blue-700">
                  Halaman ini adalah tujuan tombol pembayaran. Tahap berikutnya nanti tinggal kita hubungkan ke upload bukti pembayaran atau payment gateway.
                </div>

                <button
                  type="button"
                  className="rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white hover:bg-red-600"
                >
                  Lanjutkan Pembayaran
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}