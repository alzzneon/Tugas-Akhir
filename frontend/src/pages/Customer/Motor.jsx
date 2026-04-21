import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../Components/Public/Header";
import Footer from "../../Components/Public/Footer";

const API_URL = "http://localhost:8000/api/public/vehicles?type=MOTOR";
const IMAGE_BASE = "http://localhost:8000/storage/";

function rupiah(n) {
  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(n || 0));
  } catch {
    return `Rp ${Number(n || 0).toLocaleString("id-ID")}`;
  }
}

export default function Motor() {
  const navigate = useNavigate();

  const [motors, setMotors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(API_URL);
        if (!res.ok) {
          throw new Error("Gagal memuat data motor");
        }

        const data = await res.json();
        const rows = Array.isArray(data) ? data : data?.data || [];

        setMotors(rows);
      } catch (e) {
        setError(e.message || "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filtered = useMemo(() => {
    const key = q.trim().toLowerCase();

    return motors.filter((v) => {
      if (!key) return true;

      return (
        String(v.name || "").toLowerCase().includes(key) ||
        String(v.vehicle_brand_name || "").toLowerCase().includes(key) ||
        String(v.transmission_name || "").toLowerCase().includes(key)
      );
    });
  }, [motors, q]);

  const handleRentNow = (motor) => {
    navigate(`/motor/${motor.id}/sewa`);
  };

  const handleDetail = (motor) => {
    navigate(`/motor/${motor.id}/sewa`);
  };

  if (loading) {
    return <div className="p-6 text-center">Loading motors...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <section className="bg-white border-b border-gray-200 px-12 py-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900">Daftar Motor</h1>
          <p className="text-gray-600 mt-2">
            Pilih motor favoritmu untuk perjalanan yang praktis dan hemat.
          </p>

          <div className="mt-6">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari motor (nama/merek/transmisi)..."
              className="w-full md:w-[520px] rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-200"
            />
          </div>
        </div>
      </section>

      <main className="px-12 py-10 flex-1">
        <div className="max-w-7xl mx-auto">
          {filtered.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-600">
              Tidak ada motor yang cocok dengan pencarianmu.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filtered.map((v) => {
                const isActive = Boolean(v.is_active);

                return (
                  <div
                    key={v.id}
                    className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
                  >
                    <div className="h-44 bg-gray-100">
                      <img
                        src={v.image ? IMAGE_BASE + v.image : "/placeholder-bike.jpg"}
                        alt={v.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {v.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {v.vehicle_brand_name || "-"}
                          </p>
                        </div>

                        <span
                          className={`text-xs px-2 py-1 rounded-full border ${
                            isActive
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          {isActive ? "Tersedia" : "Tidak tersedia"}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                        <div className="rounded-xl bg-gray-50 border border-gray-200 px-3 py-2">
                          <div className="text-gray-500">Transmisi</div>
                          <div className="font-medium text-gray-900">
                            {v.transmission_name || "-"}
                          </div>
                        </div>

                        <div className="rounded-xl bg-gray-50 border border-gray-200 px-3 py-2">
                          <div className="text-gray-500">Tahun</div>
                          <div className="font-medium text-gray-900">
                            {v.year || "-"}
                          </div>
                        </div>

                        <div className="rounded-xl bg-gray-50 border border-gray-200 px-3 py-2">
                          <div className="text-gray-500">Harga/Hari</div>
                          <div className="font-medium text-gray-900">
                            {rupiah(v.daily_rate)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 flex gap-3">
                        <button
                          type="button"
                          className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium hover:bg-gray-50"
                          onClick={() => handleDetail(v)}
                        >
                          Detail
                        </button>

                        <button
                          type="button"
                          className="flex-1 rounded-xl bg-red-500 text-white px-4 py-2.5 text-sm font-semibold hover:bg-red-600 disabled:opacity-60"
                          disabled={!isActive}
                          onClick={() => handleRentNow(v)}
                        >
                          Sewa
                        </button>
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