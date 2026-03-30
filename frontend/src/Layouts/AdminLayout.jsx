import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Layers,
  CalendarDays,
  ChevronDown,
  LogOut,
  Search,
  Bell,
  ChevronLeft,
  Car,
  Users,
} from "lucide-react";

const navBase =
  "flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium text-sm";
const navActive = "bg-indigo-50 text-indigo-600 border border-indigo-100";
const navIdle = "text-gray-600 hover:bg-gray-50 hover:text-gray-900";

function cx(...cls) {
  return cls.filter(Boolean).join(" ");
}

function SideItem({ to, icon: Icon, label, collapsed }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => cx(navBase, isActive ? navActive : navIdle)}
      title={collapsed ? label : undefined}
    >
      <Icon size={18} />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );
}

function SubItem({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cx(
          "block rounded-xl px-3 py-2 text-sm",
          isActive
            ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        )
      }
    >
      {label}
    </NavLink>
  );
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [collapsed, setCollapsed] = useState(false);

  // ✅ active group checks
  const isMasterActive = pathname.startsWith("/admin/master/");
  const isKendaraanActive = pathname.startsWith("/admin/kendaraan");
  const isRentActive = pathname.startsWith("/admin/penyewaan");

  const [openMaster, setOpenMaster] = useState(true);
  const [openKendaraan, setOpenKendaraan] = useState(true);
  const [openRent, setOpenRent] = useState(true);

  // auto open group kalau masuk ke pathnya
  useEffect(() => {
    if (isMasterActive) setOpenMaster(true);
    if (isKendaraanActive) setOpenKendaraan(true);
    if (isRentActive) setOpenRent(true);
  }, [isMasterActive, isKendaraanActive, isRentActive]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin_user");
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={cx(
          "fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-200",
          collapsed ? "w-20" : "w-64"
        )}
      >
        {/* Brand */}
        <div className="h-16 px-4 flex items-center justify-between border-b">
          <div className="flex items-center gap-3">
            {!collapsed && (
              <div className="leading-tight">
                <div className="font-semibold">AMBRINA RENTAL</div>
                <div className="text-xs text-gray-500">Admin Panel</div>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed((v) => !v)}
            className="p-2 rounded-lg hover:bg-gray-100"
            aria-label="Toggle sidebar"
          >
            <ChevronLeft
              size={18}
              className={cx("transition-transform", collapsed && "rotate-180")}
            />
          </button>
        </div>

        {/* Scrollable Menu */}
        <div className="h-[calc(100vh-64px)] overflow-y-auto px-3 py-4">
          <nav className="space-y-2">
            {/* 1) Dashboard */}
            <SideItem
              to="/admin/dashboard"
              icon={LayoutDashboard}
              label="Dashboard"
              collapsed={collapsed}
            />

            <SideItem
              to="/admin/admins"
              icon={Users}
              label="Admin Management"
              collapsed={collapsed}
            />

            {/* 2) Master Data */}
            <button
              onClick={() => setOpenMaster((v) => !v)}
              className={cx(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium text-sm",
                isMasterActive
                  ? "text-indigo-700 bg-indigo-50 border border-indigo-100"
                  : "text-gray-700 hover:bg-gray-50"
              )}
              title={collapsed ? "Master Data" : undefined}
            >
              <Layers size={18} />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">Master Data</span>
                  <ChevronDown
                    size={16}
                    className={cx("transition-transform", openMaster && "rotate-180")}
                  />
                </>
              )}
            </button>

            {!collapsed && openMaster && (
              <div className="ml-9 space-y-1">
                <SubItem to="/admin/master/vehicle-types" label="Jenis Kendaraan" />
                <SubItem to="/admin/master/vehicle-brands" label="Merek Kendaraan" />
                <SubItem to="/admin/master/transmissions" label="Transmisi" />
                <SubItem to="/admin/master/rental-statuses" label="Status Rental" />
                <SubItem
                  to="/admin/master/payment-statuses"
                  label="Status Pembayaran"
                />
              </div>
            )}

            {/* 3) Kendaraan */}
            <button
              onClick={() => setOpenKendaraan((v) => !v)}
              className={cx(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium text-sm",
                isKendaraanActive
                  ? "text-indigo-700 bg-indigo-50 border border-indigo-100"
                  : "text-gray-700 hover:bg-gray-50"
              )}
              title={collapsed ? "Kendaraan" : undefined}
            >
              <Car size={18} />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">Kendaraan</span>
                  <ChevronDown
                    size={16}
                    className={cx("transition-transform", openKendaraan && "rotate-180")}
                  />
                </>
              )}
            </button>

            {!collapsed && openKendaraan && (
              <div className="ml-9 space-y-1">
                {/* ✅ "Semua Kendaraan" DIHILANGKAN */}
                <SubItem to="/admin/kendaraan/mobil" label="Mobil" />
                <SubItem to="/admin/kendaraan/motor" label="Motor" />
              </div>
            )}

            {/* 4) Penyewaan */}
            <button
              onClick={() => setOpenRent((v) => !v)}
              className={cx(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium text-sm",
                isRentActive
                  ? "text-indigo-700 bg-indigo-50 border border-indigo-100"
                  : "text-gray-700 hover:bg-gray-50"
              )}
              title={collapsed ? "Penyewaan" : undefined}
            >
              <CalendarDays size={18} />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">Penyewaan</span>
                  <ChevronDown
                    size={16}
                    className={cx("transition-transform", openRent && "rotate-180")}
                  />
                </>
              )}
            </button>

            {!collapsed && openRent && (
              <div className="ml-9 space-y-1">
                <SubItem to="/admin/penyewaan/mobil" label="Penyewaan Mobil" />
                <SubItem to="/admin/penyewaan/motor" label="Penyewaan Motor" />
              </div>
            )}
          </nav>
        </div>
      </aside>

      {/* Main */}
      <div
        className={cx(
          "flex-1 flex flex-col",
          collapsed ? "ml-20" : "ml-64",
          "transition-all"
        )}
      >
        {/* Topbar */}
        <header className="sticky top-0 z-10 bg-gray-50/80 backdrop-blur border-b border-gray-200">
          <div className="h-16 px-6 flex items-center gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  placeholder="Cari penyewaan/kendaraan/pelanggan..."
                  className="w-full rounded-xl border bg-white pl-10 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>

            {/* Notif */}
            <button className="relative p-2 rounded-xl hover:bg-white">
              <Bell size={20} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
            </button>

            {/* Logout */}
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 font-medium"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
