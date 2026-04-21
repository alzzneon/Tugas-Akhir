import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../Components/Public/Header";
import Footer from "../../Components/Public/Footer";
import VehicleCard from "../../Components/Public/VehicleCard";

const API_URL = "http://localhost:8000/api/public/vehicles?type=MOTOR";
const IMAGE_BASE = "http://localhost:8000/storage/";

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

  const handleCreateOrder = (motor) => {
    navigate(`/motor/${motor.id}/sewa`);
  };

  if (loading) {
    return <div className="p-6 text-center">Memuat motor...</div>;
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
              {filtered.map((motor) => (
                <VehicleCard
                  key={motor.id}
                  item={motor}
                  imageBase={IMAGE_BASE}
                  placeholder="/placeholder-bike.jpg"
                  onActionClick={() => handleCreateOrder(motor)}
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