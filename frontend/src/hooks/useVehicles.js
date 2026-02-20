import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../lib/api";

export function useVehicles(type, search = "") {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (type) p.set("type", type);       // "mobil" / "motor"
    if (search) p.set("search", search);
    return p.toString();
  }, [type, search]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");

    apiGet(`/api/public/vehicles?${query}`)
      .then((res) => {
        const items = Array.isArray(res) ? res : res?.data ?? [];
        if (mounted) setData(items);
      })
      .catch((e) => {
        if (mounted) setError(e.message || "Gagal ambil data");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [query]);

  return { data, loading, error };
}
