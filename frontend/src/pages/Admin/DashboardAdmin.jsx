import { useEffect, useState } from "react";
import axios from "axios";
import { Car, Clock, Users, CheckCircle, Hourglass, Calendar, Banknote, Medal, ListOrdered } from "lucide-react";

export default function DashboardAdmin() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get("http://localhost:8000/api/admin/dashboard-stats", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setData(res.data))
      .catch((err) =>
        setError(err.response?.data?.message || err.message || "Terjadi kesalahan")
      );
  }, []);

  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!data) return <div className="p-8 text-gray-400 animate-pulse">Memuat dashboard...</div>;

  const { stats, recent_rentals, top_vehicles } = data;

  const statCards = [
    { label: "Total Kendaraan", value: stats.total_vehicles, icon: Car, accent: "border-l-blue-500", sub: "armada terdaftar" },
    { label: "Tersedia", value: stats.available_vehicles, icon: CheckCircle, accent: "border-l-green-500", sub: "siap disewa" },
    { label: "Rental Aktif", value: stats.active_rentals, icon: Clock, accent: "border-l-red-500", sub: "sedang berjalan" },
    { label: "Pending", value: stats.pending_rentals, icon: Hourglass, accent: "border-l-amber-500", sub: "menunggu konfirmasi" },
    { label: "Hari Ini", value: stats.today_rentals, icon: Calendar, accent: "border-l-teal-500", sub: "transaksi masuk" },
    { label: "Pelanggan", value: stats.total_customers, icon: Users, accent: "border-l-purple-500", sub: "total terdaftar" },
  ];

  const statusConfig = {
    ongoing: { label: "Aktif", cls: "bg-green-100 text-green-800" },
    overdue: { label: "Terlambat", cls: "bg-red-100 text-red-800" },
    pending: { label: "Pending", cls: "bg-amber-100 text-amber-800" },
    done: { label: "Selesai", cls: "bg-teal-100 text-teal-800" },
    completed: { label: "Selesai", cls: "bg-teal-100 text-teal-800" },
  };

  const maxRental = top_vehicles?.[0]?.total ?? 1;

  return (
    <div className="space-y-5 p-1 font-['Syne',sans-serif]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <h2 className="text-xl font-bold tracking-tight text-gray-900">Dashboard Admin</h2>
        <span className="font-mono text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-lg">
          {time.toLocaleTimeString("id-ID")} WIB
        </span>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map(({ label, value, icon: Icon, accent, sub }) => (
          <div key={label} className={`bg-gray-50 rounded-xl p-4 border-l-[3px] ${accent}`}>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">
              <Icon size={12} />
              {label}
            </div>
            <div className="font-mono text-2xl font-medium text-gray-900">{value}</div>
            <div className="text-[11px] text-gray-400 mt-1">{sub}</div>
          </div>
        ))}
      </div>

      {/* Revenue Banner */}
      <div className="bg-gray-50 rounded-xl p-4 border-l-[3px] border-l-red-500 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">
            <Banknote size={12} /> Total Pendapatan
          </div>
          <div className="font-mono text-3xl font-medium text-gray-900">
            Rp {Number(stats.total_revenue).toLocaleString("id-ID")}
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Rentals */}
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-4">
            <ListOrdered size={13} /> Rental Terbaru
          </div>
          <div className="space-y-0">
            {recent_rentals?.slice(0, 5).map((r, i) => {
              const initials = r.user?.name?.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() ?? "?";
              const vname = r.vehicle?.name ?? `${r.vehicle?.brand} ${r.vehicle?.model}`;
              const s = statusConfig[r.status] ?? { label: r.status, cls: "bg-gray-100 text-gray-600" };
              return (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-gray-800 truncate">{r.user?.name}</div>
                    <div className="text-[11px] text-gray-400 truncate">{vname}</div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${s.cls}`}>{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Vehicles */}
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-4">
            <Medal size={13} /> Kendaraan Terpopuler
          </div>
          <div className="space-y-0">
            {top_vehicles?.slice(0, 5).map((t, i) => {
              const vname = t.vehicle?.name ?? `${t.vehicle?.brand} ${t.vehicle?.model}`;
              const pct = Math.round((t.total / maxRental) * 100);
              return (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                  <span className="font-mono text-xs text-gray-300 w-4 flex-shrink-0">{i + 1}</span>
                  <span className="text-xs font-medium text-gray-800 flex-1 min-w-0 truncate">{vname}</span>
                  <div className="w-16 bg-gray-100 rounded-full h-1.5 flex-shrink-0">
                    <div className="h-1.5 rounded-full bg-red-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="font-mono text-[11px] text-gray-400 w-7 text-right flex-shrink-0">{t.total}x</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}