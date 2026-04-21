import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

function formatDateTime(value) {
  if (!value) return "-";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  return d.toLocaleString("id-ID", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getNotificationLink(notification) {
  if (
    notification.reference_type === "rental" &&
    notification.reference_id
  ) {
    return "/profile";
  }

  return "#";
}

export default function NotificationBell() {
  const token = localStorage.getItem("token");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const boxRef = useRef(null);

  const api = useMemo(() => {
    return axios.create({
      baseURL: "http://localhost:8000/api",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
  }, [token]);

  async function fetchNotifications() {
    try {
      const [listRes, countRes] = await Promise.all([
        api.get("/notifications"),
        api.get("/notifications/unread-count"),
      ]);

      setItems(Array.isArray(listRes.data?.data) ? listRes.data.data : []);
      setUnreadCount(Number(countRes.data?.data?.unread_count || 0));
    } catch (err) {
      console.error("Gagal memuat notifikasi:", err);
    }
  }

  async function handleMarkAsRead(id) {
    try {
      await api.patch(`/notifications/${id}/read`);
      await fetchNotifications();
    } catch (err) {
      console.error("Gagal membaca notifikasi:", err);
    }
  }

  async function handleReadAll() {
    try {
      await api.patch("/notifications/read-all");
      await fetchNotifications();
    } catch (err) {
      console.error("Gagal membaca semua notifikasi:", err);
    }
  }

  useEffect(() => {
    if (!token) return;
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 15000);

    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (boxRef.current && !boxRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!token) return null;

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative rounded-full p-2 hover:bg-gray-100"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-gray-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0m6 0H9"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-96 rounded-xl border bg-white shadow-lg">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="font-semibold text-gray-800">Notifikasi</h3>
            <button
              type="button"
              onClick={handleReadAll}
              className="text-sm text-indigo-600 hover:underline"
            >
              Tandai semua dibaca
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">
                Belum ada notifikasi.
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className={`border-b px-4 py-3 ${
                    item.is_read ? "bg-white" : "bg-blue-50"
                  }`}
                >
                  <div className="mb-1 flex items-start justify-between gap-3">
                    <div className="font-medium text-gray-800">{item.title}</div>
                    {!item.is_read && (
                      <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
                    )}
                  </div>

                  <div className="text-sm text-gray-600">{item.message}</div>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-xs text-gray-400">
                      {formatDateTime(item.created_at)}
                    </div>

                    {!item.is_read && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(item.id)}
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        Tandai dibaca
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}