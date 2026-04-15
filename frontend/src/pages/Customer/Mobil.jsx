import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../Components/Public/Header";
import Footer from "../../Components/Public/Footer";

const API_URL = "http://localhost:8000/api/public/vehicles?type=MOBIL";
const IMAGE_BASE = "http://localhost:8000/storage/";

export default function Mobil() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Failed to load vehicles");
        const data = await res.json();
        setCars(data);
      } catch (e) {
        setError(e.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleRentNow = (car) => {
    navigate(`/mobil/${car.id}/sewa`);
  };

  if (loading) {
    return <div className="p-6 text-center">Loading cars...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">{error}</div>;
  }

  if (cars.length === 0) {
    return <div className="p-6 text-center text-gray-500">No cars available.</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="p-6 flex-1">
        <h1 className="text-2xl font-bold mb-6">Mobil</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map((car) => (
            <div
              key={car.id}
              className="rounded-xl border bg-white overflow-hidden hover:shadow-lg transition"
            >
              <div className="h-48 bg-gray-100 overflow-hidden">
                <img
                  src={car.image ? IMAGE_BASE + car.image : "/placeholder-car.jpg"}
                  alt={car.name}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-lg">{car.name}</h3>

                <div className="text-sm text-gray-500 mt-1">
                  {car.vehicle_brand_name}
                  {car.transmission_name ? ` • ${car.transmission_name}` : ""}
                </div>

                <div className="mt-3 text-indigo-600 font-bold">
                  Rp {Number(car.daily_rate).toLocaleString("id-ID")} / day
                </div>

                <button
                  type="button"
                  onClick={() => handleRentNow(car)}
                  className="mt-4 w-full rounded-lg bg-indigo-600 text-white py-2 font-semibold hover:bg-indigo-700 transition cursor-pointer"
                >
                  Rent Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}