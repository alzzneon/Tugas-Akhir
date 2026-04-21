import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  LayoutDashboard,
  Layers,
  CalendarDays,
  ChevronDown,
  Search,
  Bell,
  ChevronLeft,
  Car,
  Users,
} from "lucide-react";

function cx(...cls) {
  return cls.filter(Boolean).join(" ");
}

function formatDateTime(value) {
  if (!value) return "-";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getNotificationRoute(item) {
  if (item?.reference_type === "rental" && item?.reference_id) {
    return "/admin/penyewaan/mobil";
  }

  return null;
}

function SideItem({ to, icon: Icon, label, collapsed }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cx(
          "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 text-sm",
          isActive
            ? "bg-indigo-50 text-indigo-600 font-medium"
            : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
        )
      }
      title={collapsed ? label : undefined}
    >
      <Icon size={16} className="flex-shrink-0" />
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
          "block rounded-md px-3 py-1.5 text-[12.5px] transition-all duration-150",
          isActive
            ? "bg-indigo-50 text-indigo-600 font-medium"
            : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
        )
      }
    >
      {label}
    </NavLink>
  );
}

function SectionLabel({ label, collapsed }) {
  if (collapsed) return null;
  return (
    <p className="px-3 pt-3 pb-1 text-[10px] font-medium tracking-widest text-gray-400 uppercase">
      {label}
    </p>
  );
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [openNotifMenu, setOpenNotifMenu] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);

  const userMenuRef = useRef(null);
  const notifMenuRef = useRef(null);

  const token = localStorage.getItem("token");

  const api = useMemo(() => {
    return axios.create({
      baseURL: "http://localhost:8000/api",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
  }, [token]);

  const isMasterActive = pathname.startsWith("/admin/master/");
  const isKendaraanActive = pathname.startsWith("/admin/kendaraan");
  const isRentActive = pathname.startsWith("/admin/penyewaan");

  const [openMaster, setOpenMaster] = useState(true);
  const [openKendaraan, setOpenKendaraan] = useState(true);
  const [openRent, setOpenRent] = useState(true);

  useEffect(() => {
    if (isMasterActive) setOpenMaster(true);
    if (isKendaraanActive) setOpenKendaraan(true);
    if (isRentActive) setOpenRent(true);
  }, [isMasterActive, isKendaraanActive, isRentActive]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setOpenUserMenu(false);
      }

      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target)) {
        setOpenNotifMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchNotifications() {
    if (!token) return;

    try {
      setNotifLoading(true);

      const [listRes, countRes] = await Promise.all([
        api.get("/notifications"),
        api.get("/notifications/unread-count"),
      ]);

      setNotifications(Array.isArray(listRes.data?.data) ? listRes.data.data : []);
      setUnreadCount(Number(countRes.data?.data?.unread_count || 0));
    } catch (err) {
      console.error("Gagal memuat notifikasi:", err);
    } finally {
      setNotifLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();

    if (!token) return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, 15000);

    return () => clearInterval(interval);
  }, [token]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("admin_user");
    navigate("/admin/login", { replace: true });
  };

  const goToProfile = () => {
    setOpenUserMenu(false);
    navigate("/profile");
  };

  async function handleReadOne(item) {
    try {
      await api.patch(`/notifications/${item.id}/read`);
      await fetchNotifications();

      const route = getNotificationRoute(item);
      if (route) {
        navigate(route);
      }
    } catch (err) {
      console.error("Gagal menandai notifikasi dibaca:", err);
    }
  }

  async function handleReadAll() {
    try {
      await api.patch("/notifications/read-all");
      await fetchNotifications();
    } catch (err) {
      console.error("Gagal menandai semua notifikasi dibaca:", err);
    }
  }

  const groupBtnClass = (isActive) =>
    cx(
      "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 text-sm",
      isActive
        ? "text-indigo-600 font-medium"
        : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
    );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside
        className={cx(
          "fixed left-0 top-0 h-screen bg-white border-r border-gray-100 flex flex-col transition-all duration-200 z-20",
          collapsed ? "w-[68px]" : "w-60"
        )}
      >
        <div className="h-14 px-3.5 flex items-center justify-between border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-lg bg-[#1A1A2E] flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="7" width="4" height="6" rx="1" fill="white" />
                <rect x="5" y="4" width="4" height="9" rx="1" fill="white" opacity="0.7" />
                <rect x="9" y="1" width="4" height="12" rx="1" fill="white" opacity="0.45" />
              </svg>
            </div>
            {!collapsed && (
              <div className="leading-tight overflow-hidden">
                <p className="text-[12.5px] font-semibold text-gray-900 tracking-wide whitespace-nowrap">
                  AMBRINA RENTAL
                </p>
                <p className="text-[10.5px] text-gray-400">Admin Panel</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed((v) => !v)}
            className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            <ChevronLeft
              size={14}
              className={cx("transition-transform", collapsed && "rotate-180")}
            />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
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

          <SectionLabel label="Data" collapsed={collapsed} />

          <button
            onClick={() => setOpenMaster((v) => !v)}
            className={groupBtnClass(isMasterActive)}
            title={collapsed ? "Master Data" : undefined}
          >
            <Layers size={16} className="flex-shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Master Data</span>
                <ChevronDown
                  size={13}
                  className={cx("transition-transform text-gray-400", openMaster && "rotate-180")}
                />
              </>
            )}
          </button>

          {!collapsed && openMaster && (
            <div className="pl-7 space-y-0.5 pb-1">
              <SubItem to="/admin/master/vehicle-types" label="Jenis Kendaraan" />
              <SubItem to="/admin/master/vehicle-brands" label="Merek Kendaraan" />
              <SubItem to="/admin/master/transmissions" label="Transmisi" />
              <SubItem to="/admin/master/rental-statuses" label="Status Rental" />
              <SubItem to="/admin/master/payment-statuses" label="Status Pembayaran" />
            </div>
          )}

          <button
            onClick={() => setOpenKendaraan((v) => !v)}
            className={groupBtnClass(isKendaraanActive)}
            title={collapsed ? "Kendaraan" : undefined}
          >
            <Car size={16} className="flex-shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Kendaraan</span>
                <ChevronDown
                  size={13}
                  className={cx("transition-transform text-gray-400", openKendaraan && "rotate-180")}
                />
              </>
            )}
          </button>

          {!collapsed && openKendaraan && (
            <div className="pl-7 space-y-0.5 pb-1">
              <SubItem to="/admin/kendaraan/mobil" label="Mobil" />
              <SubItem to="/admin/kendaraan/motor" label="Motor" />
            </div>
          )}

          <button
            onClick={() => setOpenRent((v) => !v)}
            className={groupBtnClass(isRentActive)}
            title={collapsed ? "Penyewaan" : undefined}
          >
            <CalendarDays size={16} className="flex-shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Penyewaan</span>
                <ChevronDown
                  size={13}
                  className={cx("transition-transform text-gray-400", openRent && "rotate-180")}
                />
              </>
            )}
          </button>

          {!collapsed && openRent && (
            <div className="pl-7 space-y-0.5 pb-1">
              <SubItem to="/admin/penyewaan/mobil" label="Penyewaan Mobil" />
              <SubItem to="/admin/penyewaan/motor" label="Penyewaan Motor" />
            </div>
          )}
        </div>
      </aside>

      <div
        className={cx(
          "flex-1 flex flex-col transition-all duration-200",
          collapsed ? "ml-[68px]" : "ml-60"
        )}
      >
        <header className="sticky top-0 z-10 bg-white border-b border-gray-100 h-14 flex items-center gap-3 px-5">
          <div className="flex-1 relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              placeholder="Cari penyewaan, kendaraan, pelanggan..."
              className="w-full max-w-xs rounded-lg border border-gray-100 bg-gray-50 pl-8 pr-3 py-1.5 text-[12.5px] text-gray-700 placeholder-gray-400 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition"
            />
          </div>

          <div className="relative" ref={notifMenuRef}>
            <button
              type="button"
              onClick={() => setOpenNotifMenu((v) => !v)}
              className="relative w-8 h-8 rounded-lg border border-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition"
            >
              <Bell size={15} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {openNotifMenu && (
              <div className="absolute right-0 mt-2 w-96 rounded-xl border border-gray-100 bg-white shadow-lg shadow-gray-100/60 overflow-hidden z-30">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-800">Notifikasi</p>
                  <button
                    type="button"
                    onClick={handleReadAll}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    Tandai semua dibaca
                  </button>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {notifLoading ? (
                    <div className="px-4 py-4 text-sm text-gray-500">Memuat notifikasi...</div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-4 text-sm text-gray-500">Belum ada notifikasi.</div>
                  ) : (
                    notifications.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleReadOne(item)}
                        className={cx(
                          "w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition",
                          !item.is_read && "bg-indigo-50/40"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                            <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                              {item.message}
                            </p>
                            <p className="mt-2 text-[11px] text-gray-400">
                              {formatDateTime(item.created_at)}
                            </p>
                          </div>

                          {!item.is_read && (
                            <span className="mt-1 w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setOpenUserMenu((v) => !v)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-gray-100 bg-white hover:bg-gray-50 transition"
            >
              <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-semibold text-indigo-600">
                AD
              </div>
              <span className="hidden sm:inline text-[12.5px] font-medium text-gray-700">
                Admin
              </span>
              <ChevronDown
                size={12}
                className={cx(
                  "text-gray-400 transition-transform",
                  openUserMenu && "rotate-180"
                )}
              />
            </button>

            {openUserMenu && (
              <div className="absolute right-0 mt-1.5 w-40 rounded-xl border border-gray-100 bg-white shadow-lg shadow-gray-100/60 overflow-hidden z-20">
                <button
                  onClick={goToProfile}
                  className="w-full px-4 py-2.5 text-left text-[12.5px] text-gray-700 hover:bg-gray-50 transition"
                >
                  Profile
                </button>
                <div className="border-t border-gray-100" />
                <button
                  onClick={() => {
                    setOpenUserMenu(false);
                    logout();
                  }}
                  className="w-full px-4 py-2.5 text-left text-[12.5px] text-red-500 hover:bg-red-50 transition"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}