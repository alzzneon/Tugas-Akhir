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
  RotateCcw,
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
  return (
    MONTHS.find((item) => Number(item.value) === Number(month))?.label || "-"
  );
}

export default function DashboardAdmin() {
  const now = new Date();

  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();

    return Array.from({ length: 8 }, (_, index) => currentYear - 5 + index);
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
          err.response?.data?.message || err.message || "Terjadi kesalahan"
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [month, year]);

  function resetPeriod() {
    const currentDate = new Date();

    setMonth(currentDate.getMonth() + 1);
    setYear(currentDate.getFullYear());
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-[#C8102E]">
        Error: {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-sm font-medium text-gray-600 shadow-sm">
        Memuat dashboard...
      </div>
    );
  }

  const { stats, recent_rentals, top_vehicles, period } = data;

  const periodLabel = period?.label || `${getMonthLabel(month)} ${year}`;

  const statCards = [
    {
      label: "Total kendaraan",
      value: stats.total_vehicles,
      icon: Car,
      borderClass: "border-t-[#2255CC]",
      iconClass: "text-[#2255CC]",
      sub: "Armada terdaftar",
    },
    {
      label: "Tersedia",
      value: stats.available_vehicles,
      icon: CheckCircle,
      borderClass: "border-t-[#1A7A40]",
      iconClass: "text-[#1A7A40]",
      sub: "Siap disewa",
    },
    {
      label: "Total rental",
      value: stats.total_rentals,
      icon: Calendar,
      borderClass: "border-t-[#1A7A7A]",
      iconClass: "text-[#1A7A7A]",
      sub: `Periode ${periodLabel}`,
    },
    {
      label: "Rental aktif",
      value: stats.active_rentals,
      icon: Clock,
      borderClass: "border-t-[#C8102E]",
      iconClass: "text-[#C8102E]",
      sub: "Sedang berjalan / terlambat",
    },
    {
      label: "Pending",
      value: stats.pending_rentals,
      icon: Hourglass,
      borderClass: "border-t-[#C8A800]",
      iconClass: "text-[#C8A800]",
      sub: "Menunggu konfirmasi",
    },
    {
      label: "Selesai",
      value: stats.completed_rentals,
      icon: CheckCircle,
      borderClass: "border-t-emerald-600",
      iconClass: "text-emerald-600",
      sub: "Rental selesai",
    },
    {
      label: "Pelanggan baru",
      value: stats.new_customers,
      icon: Users,
      borderClass: "border-t-[#7A1A7A]",
      iconClass: "text-[#7A1A7A]",
      sub: `Periode ${periodLabel}`,
    },
    {
      label: "Batal / ditolak",
      value: stats.cancelled_rentals,
      icon: XCircle,
      borderClass: "border-t-red-600",
      iconClass: "text-red-600",
      sub: "Rental tidak diproses",
    },
  ];

  const statusConfig = {
    pending: {
      label: "Pending",
      className: "border-[#E8D870] bg-[#FFFBEA] text-[#9A7B00]",
    },
    approved: {
      label: "Disetujui",
      className: "border-blue-200 bg-blue-50 text-blue-700",
    },
    ongoing: {
      label: "Aktif",
      className: "border-[#AADDBB] bg-[#F0FFF5] text-[#1A7A40]",
    },
    overdue: {
      label: "Terlambat",
      className: "border-[#F5CCCC] bg-[#FFF5F5] text-[#C8102E]",
    },
    returned: {
      label: "Dikembalikan",
      className: "border-gray-300 bg-gray-50 text-gray-700",
    },
    inspection: {
      label: "Inspeksi",
      className: "border-indigo-200 bg-indigo-50 text-indigo-700",
    },
    waiting_payment: {
      label: "Tunggu denda",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    },
    repair_process: {
      label: "Perbaikan",
      className: "border-purple-200 bg-purple-50 text-purple-700",
    },
    completed: {
      label: "Selesai",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    rejected: {
      label: "Ditolak",
      className: "border-red-200 bg-red-50 text-red-600",
    },
    cancelled: {
      label: "Dibatalkan",
      className: "border-red-200 bg-red-50 text-red-600",
    },
  };

  const maxRental = top_vehicles?.[0]?.total || 1;

  return (
    <div className="flex flex-col gap-5 font-sans">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="border-l-4 border-[#C8102E] pl-4">
          <h2 className="m-0 text-[22px] font-bold tracking-tight text-[#111827]">
            Dashboard
          </h2>

          <p className="mt-1 text-[13px] font-normal text-gray-600">
            Berikut ringkasan aktivitas Ambrina Rental untuk periode{" "}
            <span className="font-semibold text-[#C8102E]">{periodLabel}</span>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="h-[40px] rounded-xl border border-gray-300 bg-white px-4 text-sm font-normal text-gray-700 outline-none transition focus:border-[#C8102E]"
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
            className="h-[40px] rounded-xl border border-gray-300 bg-white px-4 text-sm font-normal text-gray-700 outline-none transition focus:border-[#C8102E]"
          >
            {years.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={resetPeriod}
            className="inline-flex h-[40px] items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:border-[#C8102E] hover:text-[#C8102E]"
          >
            <RotateCcw size={14} />
            Bulan ini
          </button>
        </div>
      </div>

      {loading && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
          Memuat data periode {getMonthLabel(month)} {year}...
        </div>
      )}

      {/* Statistik */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
        {statCards.map(
          ({ label, value, icon: Icon, borderClass, iconClass, sub }) => (
            <div
              key={label}
              className={`rounded-xl border border-gray-200 border-t-[3px] bg-white px-4 py-4 shadow-sm transition hover:shadow-md ${borderClass}`}
            >
              <div className="mb-3 flex items-center gap-2 text-[12px] font-medium text-gray-600">
                <Icon size={14} className={iconClass} />
                {label}
              </div>

              <div className="text-[26px] font-bold leading-none tracking-[-0.02em] text-[#111827] tabular-nums">
                {value}
              </div>

              <div className="mt-2 text-[12px] font-normal text-gray-500">
                {sub}
              </div>
            </div>
          )
        )}
      </div>

      {/* Total Pendapatan */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">

            <div>
              <p className="text-[15px] font-semibold text-[#111827]">
                Total pendapatan
              </p>

              <p className="mt-1 text-[12px] font-normal text-gray-500">
                Pendapatan yang masuk pada periode {periodLabel}
              </p>
            </div>
          </div>

          <div className="text-left md:text-right">
            <p className="text-[12px] font-normal text-gray-500">
              Total saat ini
            </p>

            <p className="mt-1 text-[28px] font-bold leading-none tracking-[-0.02em] text-[#C8102E] tabular-nums">
              Rp {formatCurrency(stats.total_revenue)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabel Ringkasan */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Rental Terbaru */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-start gap-3 border-b border-gray-200 bg-[#FAFAFA] px-4 py-4">

            <div>
              <p className="text-[15px] font-semibold text-[#111827]">
                Rental terbaru
              </p>

              <p className="mt-0.5 text-[12px] font-normal text-gray-500">
                Data penyewaan terbaru pada periode {periodLabel}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_1fr_auto] border-b border-gray-200 bg-[#F5F5F5] px-4 py-3">
            {["Pelanggan", "Kendaraan", "Status"].map((h) => (
              <span key={h} className="text-[11px] font-medium text-gray-600">
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
                  label: String(r.status || "-"),
                  className: "border-gray-300 bg-gray-50 text-gray-700",
                };

                return (
                  <div
                    key={`${r.id || i}-${r.status || "status"}`}
                    className="grid grid-cols-[1fr_1fr_auto] items-center border-b border-gray-100 bg-white px-4 py-3 transition hover:bg-[#FAFAFA]"
                  >
                    <span className="truncate pr-2 text-[13px] font-medium text-[#111827]">
                      {r.user?.full_name || r.user?.name || "-"}
                    </span>

                    <span className="truncate pr-2 text-[13px] font-normal text-gray-700">
                      {vname}
                    </span>

                    <span
                      className={`whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-medium ${s.className}`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center text-sm font-normal text-gray-500">
                Tidak ada rental pada periode ini.
              </div>
            )}
          </div>
        </div>

        {/* Kendaraan Terpopuler */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-start gap-3 border-b border-gray-200 bg-[#FAFAFA] px-4 py-4">

            <div>
              <p className="text-[15px] font-semibold text-[#111827]">
                Kendaraan terpopuler
              </p>

              <p className="mt-0.5 text-[12px] font-normal text-gray-500">
                Kendaraan yang paling sering disewa pada periode {periodLabel}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-[32px_1fr_110px_48px] gap-2 border-b border-gray-200 bg-[#F5F5F5] px-4 py-3">
            {["#", "Kendaraan", "Popularitas", "Total"].map((h) => (
              <span key={h} className="text-[11px] font-medium text-gray-600">
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
                    className="grid grid-cols-[32px_1fr_110px_48px] items-center gap-2 border-b border-gray-100 bg-white px-4 py-3 transition hover:bg-[#FAFAFA]"
                  >
                    <span
                      className={`text-[12px] font-semibold tabular-nums ${
                        i === 0 ? "text-[#C8102E]" : "text-gray-500"
                      }`}
                    >
                      {i + 1}
                    </span>

                    <span className="truncate text-[13px] font-medium text-[#111827]">
                      {vname}
                    </span>

                    <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className={`h-full rounded-full ${
                          i === 0 ? "bg-[#C8102E]" : "bg-gray-500"
                        } ${getProgressWidthClass(pct)}`}
                      />
                    </div>

                    <span className="text-right text-[12px] font-semibold text-gray-700 tabular-nums">
                      {t.total}x
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center text-sm font-normal text-gray-500">
                Belum ada data kendaraan terpopuler pada periode ini.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}