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
  Settings,
  Wrench,
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
  if (item?.reference_type !== "rental" || !item?.reference_id) {
    return null;
  }
  const type = item?.vehicle_type?.toUpperCase();
  if (type === "MOTOR") return "/admin/penyewaan/motor";
  if (type === "MOBIL") return "/admin/penyewaan/mobil";
  return "/admin/dashboard";
}

function SideItem({ to, icon: Icon, label, collapsed }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cx(
          "flex items-center gap-2.5 px-3 py-2 transition-all duration-150 text-[12.5px] font-medium border-l-[3px]",
          isActive
            ? "border-l-[#C8102E] bg-[#FFF5F5] text-[#C8102E]"
            : "border-l-transparent text-[#444444] hover:bg-[#F5F5F5] hover:text-[#1A1A1A]"
        )
      }
      title={collapsed ? label : undefined}
    >
      <Icon size={15} className="flex-shrink-0" />
      {!collapsed && <span className="tracking-wide">{label}</span>}
    </NavLink>
  );
}

function SubItem({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cx(
          "block px-3 py-1.5 text-[12px] transition-all duration-150 border-l-[3px]",
          isActive
            ? "border-l-[#C8102E] bg-[#FFF5F5] text-[#C8102E] font-semibold"
            : "border-l-transparent text-[#666666] hover:bg-[#F5F5F5] hover:text-[#1A1A1A]"
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
    <p className="px-3 pt-4 pb-1 text-[10px] font-bold tracking-[0.15em] text-[#999999] uppercase border-t border-[#EEEEEE] mt-1">
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
  const isMaintenanceActive = pathname.startsWith("/admin/maintenance");
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
    const interval = setInterval(() => { fetchNotifications(); }, 15000);
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
      if (route) navigate(route);
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
      "w-full flex items-center gap-2.5 px-3 py-2 transition-all duration-150 text-[12.5px] font-medium border-l-[3px]",
      isActive
        ? "border-l-[#C8102E] text-[#C8102E]"
        : "border-l-transparent text-[#444444] hover:bg-[#F5F5F5] hover:text-[#1A1A1A]"
    );

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#F0F0F0", fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif" }}>
      {/* SIDEBAR */}
      <aside
        className={cx(
          "fixed left-0 top-0 h-screen flex flex-col transition-all duration-200 z-20",
          collapsed ? "w-[60px]" : "w-[230px]"
        )}
        style={{
          backgroundColor: "#FFFFFF",
          borderRight: "2px solid #E0E0E0",
        }}
      >
        {/* Logo area */}
        <div
          className="flex items-center justify-between flex-shrink-0"
          style={{
            height: "56px",
            padding: "0 12px",
            backgroundColor: "#C8102E",
            borderBottom: "2px solid #A00D24",
          }}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            {/* Icon: simple car silhouette feel */}
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: "28px",
                height: "28px",
                backgroundColor: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.3)",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="7" width="4" height="6" rx="0" fill="white" />
                <rect x="5" y="4" width="4" height="9" rx="0" fill="white" opacity="0.7" />
                <rect x="9" y="1" width="4" height="12" rx="0" fill="white" opacity="0.45" />
              </svg>
            </div>
            {!collapsed && (
              <div className="leading-tight overflow-hidden">
                <p
                  className="whitespace-nowrap"
                  style={{
                    fontSize: "12px",
                    fontWeight: "800",
                    color: "#FFFFFF",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  AMBRINA RENTAL
                </p>
                <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.7)", letterSpacing: "0.05em" }}>
                  PANEL ADMINISTRASI
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed((v) => !v)}
            aria-label="Toggle sidebar"
            style={{
              width: "22px",
              height: "22px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(255,255,255,0.8)",
              flexShrink: 0,
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            <ChevronLeft
              size={14}
              style={{
                transition: "transform 0.2s",
                transform: collapsed ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </button>
        </div>

        {/* Nav items */}
        <div className="flex-1 overflow-y-auto py-2" style={{ backgroundColor: "#FFFFFF" }}>
          <SideItem
            to="/admin/dashboard"
            icon={LayoutDashboard}
            label="Dashboard"
            collapsed={collapsed}
          />

          <SectionLabel label="Data Master" collapsed={collapsed} />

          <button
            onClick={() => setOpenMaster((v) => !v)}
            className={groupBtnClass(isMasterActive)}
            title={collapsed ? "Master Data" : undefined}
          >
            <Layers size={15} className="flex-shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left tracking-wide">Master Data</span>
                <ChevronDown
                  size={12}
                  style={{
                    color: "#999999",
                    transition: "transform 0.2s",
                    transform: openMaster ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                />
              </>
            )}
          </button>

          {!collapsed && openMaster && (
            <div className="pl-6 pb-1">
              <SubItem to="/admin/master/vehicle-types" label="Jenis Kendaraan" />
              <SubItem to="/admin/master/vehicle-brands" label="Merek Kendaraan" />
              <SubItem to="/admin/master/transmissions" label="Transmisi" />
            </div>
          )}

          <button
            onClick={() => setOpenKendaraan((v) => !v)}
            className={groupBtnClass(isKendaraanActive)}
            title={collapsed ? "Kendaraan" : undefined}
          >
            <Car size={15} className="flex-shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left tracking-wide">Kendaraan</span>
                <ChevronDown
                  size={12}
                  style={{
                    color: "#999999",
                    transition: "transform 0.2s",
                    transform: openKendaraan ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                />
              </>
            )}
          </button>

          {!collapsed && openKendaraan && (
            <div className="pl-6 pb-1">
              <SubItem to="/admin/kendaraan/mobil" label="Mobil" />
              <SubItem to="/admin/kendaraan/motor" label="Motor" />
            </div>
          )}

          <button
            onClick={() => setOpenRent((v) => !v)}
            className={groupBtnClass(isRentActive)}
            title={collapsed ? "Penyewaan" : undefined}
          >
            <CalendarDays size={15} className="flex-shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left tracking-wide">Penyewaan</span>
                <ChevronDown
                  size={12}
                  style={{
                    color: "#999999",
                    transition: "transform 0.2s",
                    transform: openRent ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                />
              </>
            )}
          </button>

          {!collapsed && openRent && (
            <div className="pl-6 pb-1">
              <SubItem to="/admin/penyewaan/mobil" label="Penyewaan Mobil" />
              <SubItem to="/admin/penyewaan/motor" label="Penyewaan Motor" />
            </div>
          )}

          <SideItem
            to="/admin/maintenance"
            icon={Wrench}
            label="Maintenance Kendaraan"
            collapsed={collapsed}
          />

          <SectionLabel label="Sistem" collapsed={collapsed} />

          <SideItem
            to="/admin/admins"
            icon={Users}
            label="Manajemen Admin"
            collapsed={collapsed}
          />

          <SideItem
            to="/admin/company-profile"
            icon={Settings}
            label="Informasi Perusahaan"
            collapsed={collapsed}
          />
        </div>

        {/* Sidebar footer strip */}
        {!collapsed && (
          <div
            style={{
              borderTop: "2px solid #E0E0E0",
              padding: "8px 12px",
              backgroundColor: "#FAFAFA",
            }}
          >
            <p style={{ fontSize: "10px", color: "#BBBBBB", letterSpacing: "0.05em" }}>
              © 2025 AMBRINA RENTAL
            </p>
          </div>
        )}
      </aside>

      {/* MAIN CONTENT */}
      <div
        className={cx("flex-1 flex flex-col transition-all duration-200")}
        style={{ marginLeft: collapsed ? "60px" : "230px" }}
      >
        {/* HEADER */}
        <header
          className="sticky top-0 z-10 flex items-center gap-3 px-5"
          style={{
            height: "56px",
            backgroundColor: "#FFFFFF",
            borderBottom: "2px solid #E0E0E0",
          }}
        >
          {/* Red accent bar on left edge of header */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: "4px",
              height: "100%",
              backgroundColor: "#C8102E",
            }}
          />

          {/* Search */}
          <div className="flex-1 relative" style={{ maxWidth: "320px" }}>
            <Search
              size={13}
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#999999",
              }}
            />
            <input
              placeholder="Cari penyewaan, kendaraan, pelanggan..."
              style={{
                width: "100%",
                paddingLeft: "30px",
                paddingRight: "10px",
                paddingTop: "6px",
                paddingBottom: "6px",
                fontSize: "12px",
                color: "#333333",
                backgroundColor: "#F5F5F5",
                border: "1px solid #DDDDDD",
                outline: "none",
                borderRadius: "0",
                letterSpacing: "0.02em",
              }}
            />
          </div>

          <div style={{ flex: 1 }} />

          {/* Notification bell */}
          <div className="relative" ref={notifMenuRef}>
            <button
              type="button"
              onClick={() => setOpenNotifMenu((v) => !v)}
              style={{
                position: "relative",
                width: "34px",
                height: "34px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#FFFFFF",
                border: "1px solid #DDDDDD",
                cursor: "pointer",
                color: "#555555",
                borderRadius: "0",
              }}
            >
              <Bell size={15} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-6px",
                    right: "-6px",
                    minWidth: "18px",
                    height: "18px",
                    padding: "0 4px",
                    backgroundColor: "#C8102E",
                    color: "#FFFFFF",
                    fontSize: "10px",
                    fontWeight: "700",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "0",
                  }}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {openNotifMenu && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  marginTop: "6px",
                  width: "380px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #DDDDDD",
                  borderTop: "3px solid #C8102E",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                  zIndex: 30,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderBottom: "1px solid #EEEEEE",
                    backgroundColor: "#FAFAFA",
                  }}
                >
                  <p style={{ fontSize: "12px", fontWeight: "700", color: "#1A1A1A", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    Notifikasi
                  </p>
                  <button
                    type="button"
                    onClick={handleReadAll}
                    style={{ fontSize: "11px", color: "#C8102E", background: "none", border: "none", cursor: "pointer", fontWeight: "600" }}
                  >
                    Tandai Semua Dibaca
                  </button>
                </div>

                <div style={{ maxHeight: "380px", overflowY: "auto" }}>
                  {notifLoading ? (
                    <div style={{ padding: "14px", fontSize: "12px", color: "#888888" }}>Memuat notifikasi...</div>
                  ) : notifications.length === 0 ? (
                    <div style={{ padding: "14px", fontSize: "12px", color: "#888888" }}>Belum ada notifikasi.</div>
                  ) : (
                    notifications.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleReadOne(item)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "10px 14px",
                          borderBottom: "1px solid #F0F0F0",
                          backgroundColor: !item.is_read ? "#FFF8F8" : "#FFFFFF",
                          cursor: "pointer",
                          display: "block",
                          border: "none",
                          borderBottom: "1px solid #F0F0F0",
                        }}
                        className="hover:bg-[#F5F5F5] transition-colors"
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: "12px", fontWeight: "700", color: "#1A1A1A" }}>{item.title}</p>
                            <p style={{ marginTop: "3px", fontSize: "11px", color: "#666666", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                              {item.message}
                            </p>
                            <p style={{ marginTop: "5px", fontSize: "10px", color: "#AAAAAA" }}>
                              {formatDateTime(item.created_at)}
                            </p>
                          </div>
                          {!item.is_read && (
                            <span
                              style={{
                                marginTop: "4px",
                                width: "8px",
                                height: "8px",
                                borderRadius: "0",
                                backgroundColor: "#C8102E",
                                flexShrink: 0,
                                display: "block",
                              }}
                            />
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setOpenUserMenu((v) => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "5px 10px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #DDDDDD",
                cursor: "pointer",
                borderRadius: "0",
              }}
            >
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  backgroundColor: "#C8102E",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                  fontWeight: "800",
                  color: "#FFFFFF",
                  letterSpacing: "0.05em",
                  flexShrink: 0,
                  borderRadius: "0",
                }}
              >
                AD
              </div>
              <span
                className="hidden sm:inline"
                style={{ fontSize: "12px", fontWeight: "600", color: "#333333", letterSpacing: "0.03em" }}
              >
                Admin
              </span>
              <ChevronDown
                size={11}
                style={{
                  color: "#888888",
                  transition: "transform 0.2s",
                  transform: openUserMenu ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </button>

            {openUserMenu && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  marginTop: "4px",
                  width: "150px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #DDDDDD",
                  borderTop: "3px solid #C8102E",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  zIndex: 20,
                  overflow: "hidden",
                }}
              >
                <button
                  onClick={goToProfile}
                  style={{
                    width: "100%",
                    padding: "9px 14px",
                    textAlign: "left",
                    fontSize: "12px",
                    color: "#333333",
                    fontWeight: "500",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    borderBottom: "1px solid #EEEEEE",
                    letterSpacing: "0.02em",
                  }}
                  className="hover:bg-[#F5F5F5] transition-colors"
                >
                  Profil Saya
                </button>
                <button
                  onClick={() => { setOpenUserMenu(false); logout(); }}
                  style={{
                    width: "100%",
                    padding: "9px 14px",
                    textAlign: "left",
                    fontSize: "12px",
                    color: "#C8102E",
                    fontWeight: "600",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    letterSpacing: "0.02em",
                  }}
                  className="hover:bg-[#FFF5F5] transition-colors"
                >
                  Keluar
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main style={{ padding: "24px", flex: 1, backgroundColor: "#F0F0F0" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}