import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../Components/Public/Header";
import Footer from "../../Components/Public/Footer";
import VehicleCard from "../../Components/Public/VehicleCard";

const API_URL = "http://localhost:8000/api/public/vehicles?type=MOBIL";
const IMAGE_BASE = "http://localhost:8000/storage/";

export default function Mobil() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Gagal memuat data mobil");

        const data = await res.json();
        const rows = Array.isArray(data) ? data : data?.data || [];
        setCars(rows);
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

    return cars.filter((v) => {
      if (!key) return true;

      return (
        String(v.name || "").toLowerCase().includes(key) ||
        String(v.vehicle_brand_name || "").toLowerCase().includes(key) ||
        String(v.transmission_name || "").toLowerCase().includes(key)
      );
    });
  }, [cars, q]);

  const handleCreateOrder = (car) => {
    navigate(`/mobil/${car.id}/sewa`);
  };

  if (loading) {
    return <div className="p-6 text-center">Memuat mobil...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <section className="bg-white border-b border-gray-200 px-12 py-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900">Daftar Mobil</h1>
          <p className="text-gray-600 mt-2">
            Pilih mobil favoritmu untuk perjalanan yang nyaman dan aman.
          </p>

          <div className="mt-6">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari mobil (nama/merek/transmisi)..."
              className="w-full md:w-[520px] rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-200"
            />
          </div>
        </div>
      </section>

      <main className="px-12 py-10 flex-1">
        <div className="max-w-7xl mx-auto">
          {filtered.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-600">
              Tidak ada mobil yang cocok dengan pencarianmu.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filtered.map((car) => (
                <VehicleCard
                  key={car.id}
                  item={car}
                  imageBase={IMAGE_BASE}
                  placeholder="/placeholder-car.jpg"
                  onActionClick={() => handleCreateOrder(car)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}