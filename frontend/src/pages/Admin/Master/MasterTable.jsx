import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminFetch } from "../../../lib/adminFetch";

export default function MasterTable({ title, endpoint, columns }) {
  const navigate = useNavigate();

  // rows: data dari backend (array of object)
  const [rows, setRows] = useState([]);

  // loading: status ambil data
  const [loading, setLoading] = useState(true);

  // error: pesan error jika gagal
  const [error, setError] = useState("");

  // Ambil data saat halaman dibuka
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        // Panggil API backend
        const data = await adminFetch(endpoint);

        // Simpan data ke state
        setRows(data);
      } catch (e) {
        // Jika token habis / tidak valid → login ulang
        if (e.message === "UNAUTHORIZED") {
          navigate("/admin/login", { replace: true });
          return;
        }
        setError(e.message || "Gagal memuat data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint, navigate]);

  return (
    <div className="p-6">
      {/* Judul halaman */}
      <h1 className="text-2xl font-bold mb-4">{title}</h1>

      {/* Loading */}
      {loading && <p>Loading...</p>}

      {/* Error */}
      {error && <p className="text-red-600">{error}</p>}

      {/* Table */}
      {!loading && !error && (
        <table>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map(row => (
              <tr key={row.id}>
                {columns.map(col => (
                  <td key={col.key}>
                    {String(row[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
