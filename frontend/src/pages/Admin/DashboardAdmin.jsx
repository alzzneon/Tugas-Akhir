import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Banknote,
  Calendar,
  Car,
  CheckCircle,
  Clock,
  Hourglass,
  ListOrdered,
  Medal,
  Users,
  XCircle,
} from "lucide-react";

const MONTHS = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
];

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("id-ID");
}

function getProgressWidthClass(percent) {
  if (percent >= 100) return "w-full";
  if (percent >= 83) return "w-5/6";
  if (percent >= 75) return "w-3/4";
  if (percent >= 67) return "w-2/3";
  if (percent >= 50) return "w-1/2";
  if (percent >= 33) return "w-1/3";
  if (percent >= 25) return "w-1/4";
  if (percent >= 17) return "w-1/6";
  if (percent >= 8) return "w-1/12";

  return "w-0";
}

function getMonthLabel(month) {
  return MONTHS.find((item) => Number(item.value) === Number(month))?.label || "-";
}

export default function DashboardAdmin() {
  const now = new Date();

  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const [time, setTime] = useState(new Date());

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();

    return Array.from({ length: 8 }, (_, index) => currentYear - 5 + index);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");

    setLoading(true);
    setError(null);

    axios
      .get("http://localhost:8000/api/admin/dashboard-stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          month,
          year,
        },
      })
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Terjadi kesalahan"
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [month, year]);

  const resetPeriod = () => {
    const currentDate = new Date();

    setMonth(currentDate.getMonth() + 1);
    setYear(currentDate.getFullYear());
  };

  if (error) {
    return (
      <div className="p-4 text-xs font-semibold text-[#C8102E]">
        Error: {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-xs tracking-wide text-gray-400">
        Memuat dashboard...
      </div>
    );
  }

  const { stats, recent_rentals, top_vehicles, period } = data;

  const periodLabel = period?.label || `${getMonthLabel(month)} ${year}`;

  const statCards = [
    {
      label: "Total Kendaraan",
      value: stats.total_vehicles,
      icon: Car,
      borderClass: "border-t-[#2255CC]",
      iconClass: "text-[#2255CC]",
      sub: "armada terdaftar",
    },
    {
      label: "Tersedia",
      value: stats.available_vehicles,
      icon: CheckCircle,
      borderClass: "border-t-[#1A7A40]",
      iconClass: "text-[#1A7A40]",
      sub: "siap disewa",
    },
    {
      label: "Total Rental",
      value: stats.total_rentals,
      icon: Calendar,
      borderClass: "border-t-[#1A7A7A]",
      iconClass: "text-[#1A7A7A]",
      sub: `periode ${periodLabel}`,
    },
    {
      label: "Rental Aktif",
      value: stats.active_rentals,
      icon: Clock,
      borderClass: "border-t-[#C8102E]",
      iconClass: "text-[#C8102E]",
      sub: "ongoing / overdue",
    },
    {
      label: "Pending",
      value: stats.pending_rentals,
      icon: Hourglass,
      borderClass: "border-t-[#C8A800]",
      iconClass: "text-[#C8A800]",
      sub: "menunggu konfirmasi",
    },
    {
      label: "Selesai",
      value: stats.completed_rentals,
      icon: CheckCircle,
      borderClass: "border-t-emerald-600",
      iconClass: "text-emerald-600",
      sub: "rental selesai",
    },
    {
      label: "Pelanggan Baru",
      value: stats.new_customers,
      icon: Users,
      borderClass: "border-t-[#7A1A7A]",
      iconClass: "text-[#7A1A7A]",
      sub: `periode ${periodLabel}`,
    },
    {
      label: "Batal / Ditolak",
      value: stats.cancelled_rentals,
      icon: XCircle,
      borderClass: "border-t-red-600",
      iconClass: "text-red-600",
      sub: "rental tidak diproses",
    },
  ];

  const statusConfig = {
    pending: {
      label: "PENDING",
      className: "border-[#E8D870] bg-[#FFFBEA] text-[#C8A800]",
    },
    approved: {
      label: "DISETUJUI",
      className: "border-blue-200 bg-blue-50 text-blue-700",
    },
    ongoing: {
      label: "AKTIF",
      className: "border-[#AADDBB] bg-[#F0FFF5] text-[#1A7A40]",
    },
    overdue: {
      label: "TERLAMBAT",
      className: "border-[#F5CCCC] bg-[#FFF5F5] text-[#C8102E]",
    },
    returned: {
      label: "DIKEMBALIKAN",
      className: "border-gray-200 bg-gray-50 text-gray-600",
    },
    inspection: {
      label: "INSPEKSI",
      className: "border-indigo-200 bg-indigo-50 text-indigo-700",
    },
    waiting_payment: {
      label: "TUNGGU DENDA",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    },
    repair_process: {
      label: "PERBAIKAN",
      className: "border-purple-200 bg-purple-50 text-purple-700",
    },
    completed: {
      label: "SELESAI",
      className: "border-[#AACCDD] bg-[#F0F8FF] text-[#1A5C7A]",
    },
    rejected: {
      label: "DITOLAK",
      className: "border-red-200 bg-red-50 text-red-600",
    },
    cancelled: {
      label: "DIBATALKAN",
      className: "border-red-200 bg-red-50 text-red-600",
    },
  };

  const maxRental = top_vehicles?.[0]?.total || 1;

  return (
    <div className="flex flex-col gap-[18px] font-sans">
      <div className="flex flex-col gap-4 border-b-2 border-gray-200 pb-[14px] xl:flex-row xl:items-center xl:justify-between">
        <div className="border-l-4 border-[#C8102E] pl-3">
          <h2 className="m-0 text-[15px] font-extrabold uppercase tracking-[0.08em] text-[#1A1A1A]">
            Dashboard
          </h2>

          <p className="mt-0.5 text-[11px] tracking-[0.03em] text-gray-400">
            Ringkasan operasional PT Ambrina Rental periode {periodLabel}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 outline-none"
          >
            {MONTHS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 outline-none"
          >
            {years.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <div className="bg-[#1A1A1A] px-[14px] py-[9px] text-[11px] font-bold tracking-[0.1em] text-white tabular-nums">
            {time.toLocaleTimeString("id-ID")} WIB
          </div>
        </div>
      </div>

      {loading && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-medium text-blue-700">
          Memuat data periode {getMonthLabel(month)} {year}...
        </div>
      )}

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
        {statCards.map(
          ({ label, value, icon: Icon, borderClass, iconClass, sub }) => (
            <div
              key={label}
              className={`border border-gray-200 border-t-[3px] bg-white px-[14px] pb-3 pt-[14px] ${borderClass}`}
            >
              <div className="mb-2 flex items-center gap-[5px] text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400">
                <Icon size={11} className={iconClass} />
                {label}
              </div>

              <div className="text-[26px] font-extrabold leading-none tracking-[-0.02em] text-[#1A1A1A] tabular-nums">
                {value}
              </div>

              <div className="mt-[5px] text-[10px] tracking-[0.02em] text-gray-400">
                {sub}
              </div>
            </div>
          )
        )}
      </div>

      <div className="flex flex-col gap-3 border-l-[5px] border-[#C8102E] bg-[#1A1A1A] px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500">
          <Banknote size={13} className="text-gray-500" />
          Total Pendapatan Periode {periodLabel}
        </div>

        <div className="text-[22px] font-extrabold tracking-[-0.01em] text-white tabular-nums">
          Rp {formatCurrency(stats.total_revenue)}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-[14px] xl:grid-cols-2">
        <div className="overflow-hidden border border-gray-200 border-t-[3px] border-t-[#C8102E] bg-white">
          <div className="flex items-center gap-2 border-b border-gray-100 bg-[#FAFAFA] px-[14px] py-[11px]">
            <ListOrdered size={12} className="text-[#C8102E]" />

            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#1A1A1A]">
              Rental Terbaru Periode {periodLabel}
            </span>
          </div>

          <div className="grid grid-cols-[1fr_1fr_auto] border-b border-gray-200 bg-[#F5F5F5] px-[14px] py-[7px]">
            {["Pelanggan", "Kendaraan", "Status"].map((h) => (
              <span
                key={h}
                className="text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400"
              >
                {h}
              </span>
            ))}
          </div>

          <div>
            {recent_rentals?.length > 0 ? (
              recent_rentals.slice(0, 5).map((r, i) => {
                const vehicleBrandModel =
                  `${r.vehicle?.brand || ""} ${r.vehicle?.model || ""}`.trim();

                const vname = r.vehicle?.name || vehicleBrandModel || "-";

                const s = statusConfig[r.status] || {
                  label: String(r.status || "-").toUpperCase(),
                  className: "border-gray-200 bg-gray-50 text-gray-600",
                };

                return (
                  <div
                    key={`${r.id || i}-${r.status || "status"}`}
                    className="grid grid-cols-[1fr_1fr_auto] items-center border-b border-gray-100 bg-white px-[14px] py-[9px] hover:bg-[#FAFAFA]"
                  >
                    <span className="truncate pr-2 text-xs font-semibold text-[#1A1A1A]">
                      {r.user?.full_name || r.user?.name || "-"}
                    </span>

                    <span className="truncate pr-2 text-[11px] text-gray-500">
                      {vname}
                    </span>

                    <span
                      className={`whitespace-nowrap border px-2 py-[3px] text-[9px] font-bold tracking-[0.08em] ${s.className}`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="px-[14px] py-6 text-center text-xs text-gray-400">
                Tidak ada rental pada periode ini.
              </div>
            )}
          </div>
        </div>

        <div className="overflow-hidden border border-gray-200 border-t-[3px] border-t-[#1A1A1A] bg-white">
          <div className="flex items-center gap-2 border-b border-gray-100 bg-[#FAFAFA] px-[14px] py-[11px]">
            <Medal size={12} className="text-gray-700" />

            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#1A1A1A]">
              Kendaraan Terpopuler Periode {periodLabel}
            </span>
          </div>

          <div className="grid grid-cols-[24px_1fr_80px_40px] gap-2 border-b border-gray-200 bg-[#F5F5F5] px-[14px] py-[7px]">
            {["#", "Kendaraan", "Popularitas", "Total"].map((h) => (
              <span
                key={h}
                className="text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400"
              >
                {h}
              </span>
            ))}
          </div>

          <div>
            {top_vehicles?.length > 0 ? (
              top_vehicles.slice(0, 5).map((t, i) => {
                const vehicleBrandModel =
                  `${t.vehicle?.brand || ""} ${t.vehicle?.model || ""}`.trim();

                const vname = t.vehicle?.name || vehicleBrandModel || "-";

                const pct = Math.round(
                  (Number(t.total || 0) / maxRental) * 100
                );

                return (
                  <div
                    key={`${t.vehicle?.id || i}-${vname}`}
                    className="grid grid-cols-[24px_1fr_80px_40px] items-center gap-2 border-b border-gray-100 bg-white px-[14px] py-[9px] hover:bg-[#FAFAFA]"
                  >
                    <span
                      className={`text-[11px] font-bold tabular-nums ${
                        i === 0 ? "text-[#C8102E]" : "text-gray-300"
                      }`}
                    >
                      {i + 1}
                    </span>

                    <span className="truncate text-xs font-semibold text-[#1A1A1A]">
                      {vname}
                    </span>

                    <div className="h-1 overflow-hidden bg-gray-200">
                      <div
                        className={`h-full ${
                          i === 0 ? "bg-[#C8102E]" : "bg-gray-400"
                        } ${getProgressWidthClass(pct)}`}
                      />
                    </div>

                    <span className="text-right text-[11px] font-bold text-gray-600 tabular-nums">
                      {t.total}x
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="px-[14px] py-6 text-center text-xs text-gray-400">
                Belum ada data kendaraan terpopuler pada periode ini.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}