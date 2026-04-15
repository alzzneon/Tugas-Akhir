import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../../Components/Public/Header";
import Footer from "../../Components/Public/Footer";

const IMAGE_BASE = "http://localhost:8000/storage/";

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("id-ID");
}

function diffDays(start, end) {
  if (!start || !end) return 0;

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 0;
  }

  const oneDay = 1000 * 60 * 60 * 24;
  const diff = Math.ceil((endDate - startDate) / oneDay) + 1;

  return diff > 0 ? diff : 0;
}

export default function SewaMobil() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    address: "",
    start_date: "",
    end_date: "",
    notes: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const loadDetail = async () => {
      try {
        setLoading(true);
        setPageError("");

        const res = await fetch("http://localhost:8000/api/public/vehicles?type=MOBIL");

        if (!res.ok) {
          throw new Error("Gagal memuat data mobil");
        }

        const data = await res.json();
        const rows = Array.isArray(data) ? data : data?.data || [];
        const selectedCar = rows.find((item) => String(item.id) === String(id));

        if (!selectedCar) {
          throw new Error("Mobil tidak ditemukan");
        }

        setCar(selectedCar);
      } catch (err) {
        setPageError(err.message || "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [id]);

  const totalDays = useMemo(() => {
    return diffDays(form.start_date, form.end_date);
  }, [form.start_date, form.end_date]);

  const totalPrice = useMemo(() => {
    if (!car) return 0;
    return totalDays * Number(car.daily_rate || 0);
  }, [car, totalDays]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setSubmitError("");
      setSubmitMessage("");

      if (!car) {
        throw new Error("Data mobil belum tersedia");
      }

      if (!form.customer_name.trim()) {
        throw new Error("Nama penyewa wajib diisi");
      }

      if (!form.customer_phone.trim()) {
        throw new Error("Nomor HP wajib diisi");
      }

      if (!form.address.trim()) {
        throw new Error("Alamat wajib diisi");
      }

      if (!form.start_date || !form.end_date) {
        throw new Error("Tanggal sewa wajib diisi");
      }

      if (totalDays <= 0) {
        throw new Error("Rentang tanggal tidak valid");
      }

      const payload = {
        vehicle_id: car.id,
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        address: form.address.trim(),
        start_date: form.start_date,
        end_date: form.end_date,
        notes: form.notes.trim(),
      };

      const res = await fetch("http://localhost:8000/api/public/rentals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || "Gagal membuat booking");
      }

      setSubmitMessage(data?.message || "Booking berhasil dibuat");

      setForm({
        customer_name: "",
        customer_phone: "",
        address: "",
        start_date: "",
        end_date: "",
        notes: "",
      });

      setTimeout(() => {
        navigate("/mobil");
      }, 1500);
    } catch (err) {
      setSubmitError(err.message || "Terjadi kesalahan saat booking");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  if (pageError) {
    return <div className="p-6 text-center text-red-600">{pageError}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="h-80 bg-gray-100">
              <img
                src={car.image ? IMAGE_BASE + car.image : "/placeholder-car.jpg"}
                alt={car.name}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="p-6">
              <h1 className="text-2xl font-bold">{car.name}</h1>

              <p className="text-gray-600 mt-2">
                {car.vehicle_brand_name}
                {car.transmission_name ? ` • ${car.transmission_name}` : ""}
              </p>

              <p className="mt-4 text-indigo-600 text-xl font-bold">
                Rp {formatCurrency(car.daily_rate)} / hari
              </p>

              <div className="mt-6 space-y-2 text-sm text-gray-700">
                <p>
                  <span className="font-semibold">Plat:</span> {car.plate_number || "-"}
                </p>
                <p>
                  <span className="font-semibold">Tahun:</span> {car.year || "-"}
                </p>
                <p>
                  <span className="font-semibold">Warna:</span> {car.color || "-"}
                </p>
                <p>
                  <span className="font-semibold">Deskripsi:</span> {car.description || "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-xl font-bold mb-4">Form Booking</h2>

            {submitError ? (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-600">
                {submitError}
              </div>
            ) : null}

            {submitMessage ? (
              <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-green-700">
                {submitMessage}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nama Penyewa</label>
                <input
                  type="text"
                  name="customer_name"
                  value={form.customer_name}
                  onChange={handleChange}
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Masukkan nama penyewa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nomor HP</label>
                <input
                  type="text"
                  name="customer_phone"
                  value={form.customer_phone}
                  onChange={handleChange}
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Masukkan nomor HP"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Alamat</label>
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  rows="3"
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Masukkan alamat lengkap"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    name="start_date"
                    value={form.start_date}
                    onChange={handleChange}
                    className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Tanggal Selesai</label>
                  <input
                    type="date"
                    name="end_date"
                    value={form.end_date}
                    onChange={handleChange}
                    className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Catatan</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows="4"
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Catatan tambahan"
                />
              </div>

              <div className="rounded-lg bg-gray-50 border p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Harga per hari</span>
                  <span>Rp {formatCurrency(car.daily_rate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total hari</span>
                  <span>{totalDays} hari</span>
                </div>
                <div className="flex justify-between font-bold text-indigo-600">
                  <span>Total bayar</span>
                  <span>Rp {formatCurrency(totalPrice)}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-4 py-2 rounded-lg border border-gray-300"
                >
                  Kembali
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60"
                >
                  {submitting ? "Memproses..." : "Booking Sekarang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}