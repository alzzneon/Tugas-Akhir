import { useEffect, useState } from "react";
import axios from "axios";

export default function DashboardAdmin() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get(
        "http://localhost:8000/api/admin/dashboard-stats",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then((res) => {
        console.log("SUCCESS:", res.data);
        setData(res.data);
      })
      .catch((err) => {
        console.error("ERROR RESPONSE:", err.response);
        console.error("ERROR DATA:", err.response?.data);
        console.error("ERROR MESSAGE:", err.message);

        setError(
          err.response?.data?.message ||
          err.message ||
          "Terjadi kesalahan"
        );
      });
  }, []);

  if (error) {
    return (
      <div className="p-4 text-red-600">
        Error: {error}
      </div>
    );
  }

  if (!data) {
    return <div>Loading...</div>;
  }

  const stats = data.stats;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">
        Dashboard Admin
      </h2>

      <div className="grid grid-cols-4 gap-4">
        <Card
          title="Total Kendaraan"
          value={stats.total_vehicles}
        />

        <Card
          title="Kendaraan Tersedia"
          value={stats.available_vehicles}
        />

        <Card
          title="Rental Aktif"
          value={stats.active_rentals}
        />

        <Card
          title="Pendapatan"
          value={`Rp ${Number(
            stats.total_revenue
          ).toLocaleString("id-ID")}`}
        />
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow border">
      <div className="text-sm text-gray-500">
        {title}
      </div>

      <div className="text-3xl font-bold mt-2">
        {value}
      </div>
    </div>
  );
}