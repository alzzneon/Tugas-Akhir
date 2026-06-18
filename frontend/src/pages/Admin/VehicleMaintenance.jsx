import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const conditionLabels = {
  good: "Baik",
  damaged: "Ada Kerusakan",
};

const statusLabels = {
  planned: "Direncanakan",
  in_progress: "Sedang Dikerjakan",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

const emptyForm = {
  vehicle_id: "",
  maintenance_type_id: "",
  service_date: "",
  condition_status: "good",
  description: "",
  cost: "",
  started_at: "",
  completed_at: "",
  status: "completed",
  next_service_date: "",
};

function formatRupiah(value) {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
}

function toDateTimeLocal(value) {
  if (!value) return "";
  return value.slice(0, 16);
}

function normalizeData(response) {
  return Array.isArray(response?.data?.data)
    ? response.data.data
    : Array.isArray(response?.data)
      ? response.data
      : [];
}

export default function VehicleMaintenance() {
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

  const [services, setServices] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [types, setTypes] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function fetchData() {
    try {
      setLoading(true);

      const [servicesRes, vehiclesRes, typesRes] = await Promise.all([
        api.get("/admin/vehicle-services"),
        api.get("/admin/masters/vehicles"),
        api.get("/admin/maintenance-types"),
      ]);

      setServices(normalizeData(servicesRes));
      setVehicles(normalizeData(vehiclesRes));
      setTypes(normalizeData(typesRes));
    } catch (err) {
      console.error("Gagal memuat data maintenance:", err);
      alert("Gagal memuat data maintenance.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function handleEdit(item) {
    setEditingId(item.id);
    setForm({
      vehicle_id: item.vehicle?.id || "",
      maintenance_type_id: item.maintenance_type?.id || "",
      service_date: item.service_date || "",
      condition_status: item.condition_status || "good",
      description: item.description || "",
      cost: item.cost || "",
      started_at: toDateTimeLocal(item.started_at),
      completed_at: toDateTimeLocal(item.completed_at),
      status: item.status || "planned",
      next_service_date: item.next_service_date || "",
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const payload = {
      vehicle_id: Number(form.vehicle_id),
      maintenance_type_id: Number(form.maintenance_type_id),
      service_date: form.service_date,
      condition_status: form.condition_status,
      description: form.description || null,
      cost: Number(form.cost || 0),
      started_at: form.started_at || null,
      completed_at: form.completed_at || null,
      status: form.status,
      next_service_date: form.next_service_date || null,
    };

    try {
      setSaving(true);

      if (editingId) {
        await api.put(`/admin/vehicle-services/${editingId}`, payload);
      } else {
        await api.post("/admin/vehicle-services", payload);
      }

      resetForm();
      await fetchData();
      alert(editingId ? "Data maintenance berhasil diperbarui." : "Data maintenance berhasil ditambahkan.");
    } catch (err) {
      console.error("Gagal menyimpan maintenance:", err);
      alert("Gagal menyimpan data maintenance.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Hapus data maintenance ini?")) return;

    try {
      await api.delete(`/admin/vehicle-services/${id}`);
      await fetchData();
      alert("Data maintenance berhasil dihapus.");
    } catch (err) {
      console.error("Gagal menghapus maintenance:", err);
      alert("Gagal menghapus data maintenance.");
    }
  }

  return (
    <div style={{ padding: "28px 32px" }}>
      <div
        style={{
          borderLeft: "4px solid #C8102E",
          paddingLeft: "14px",
          marginBottom: "22px",
        }}
      >
        <h1 style={{ fontSize: "20px", fontWeight: "800", color: "#111827", margin: 0 }}>
          MAINTENANCE KENDARAAN
        </h1>
        <p style={{ fontSize: "13px", color: "#9CA3AF", marginTop: "6px" }}>
          Kelola riwayat pengecekan, service, dan perbaikan kendaraan.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: "#FFFFFF",
          borderTop: "3px solid #C8102E",
          border: "1px solid #E5E7EB",
          padding: "18px",
          marginBottom: "22px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "14px",
          }}
        >
          <select
            value={form.vehicle_id}
            onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
            required
            style={{ padding: "10px", border: "1px solid #D1D5DB" }}
          >
            <option value="">Pilih kendaraan</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.name} - {vehicle.plate_number}
              </option>
            ))}
          </select>

          <select
            value={form.maintenance_type_id}
            onChange={(e) => setForm({ ...form, maintenance_type_id: e.target.value })}
            required
            style={{ padding: "10px", border: "1px solid #D1D5DB" }}
          >
            <option value="">Pilih jenis maintenance</option>
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={form.service_date}
            onChange={(e) => setForm({ ...form, service_date: e.target.value })}
            required
            style={{ padding: "10px", border: "1px solid #D1D5DB" }}
          />

          <select
            value={form.condition_status}
            onChange={(e) => setForm({ ...form, condition_status: e.target.value })}
            style={{ padding: "10px", border: "1px solid #D1D5DB" }}
          >
            <option value="good">Baik</option>
            <option value="damaged">Ada Kerusakan</option>
          </select>

          <input
            type="number"
            value={form.cost}
            onChange={(e) => setForm({ ...form, cost: e.target.value })}
            placeholder="Biaya"
            style={{ padding: "10px", border: "1px solid #D1D5DB" }}
          />

          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            style={{ padding: "10px", border: "1px solid #D1D5DB" }}
          >
            <option value="planned">Direncanakan</option>
            <option value="in_progress">Sedang Dikerjakan</option>
            <option value="completed">Selesai</option>
            <option value="cancelled">Dibatalkan</option>
          </select>

          <input
            type="datetime-local"
            value={form.started_at}
            onChange={(e) => setForm({ ...form, started_at: e.target.value })}
            style={{ padding: "10px", border: "1px solid #D1D5DB" }}
          />

          <input
            type="datetime-local"
            value={form.completed_at}
            onChange={(e) => setForm({ ...form, completed_at: e.target.value })}
            style={{ padding: "10px", border: "1px solid #D1D5DB" }}
          />

          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Catatan maintenance"
            rows={3}
            style={{
              gridColumn: "1 / -1",
              padding: "10px",
              border: "1px solid #D1D5DB",
              resize: "vertical",
            }}
          />
        </div>

        <div style={{ marginTop: "14px", display: "flex", gap: "10px" }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              backgroundColor: "#C8102E",
              color: "#FFFFFF",
              border: "none",
              padding: "10px 16px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            {saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "+ Tambah Maintenance"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              style={{
                backgroundColor: "#FFFFFF",
                color: "#374151",
                border: "1px solid #D1D5DB",
                padding: "10px 16px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              Batal Edit
            </button>
          )}
        </div>
      </form>

      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderTop: "3px solid #C8102E",
          border: "1px solid #E5E7EB",
          overflowX: "auto",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "980px" }}>
          <thead>
            <tr style={{ backgroundColor: "#F8F8F8", borderBottom: "2px solid #E5E7EB" }}>
              {["NO", "TANGGAL", "KENDARAAN", "JENIS", "KONDISI", "CATATAN", "BIAYA", "STATUS", "AKSI"].map((head) => (
                <th
                  key={head}
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    fontSize: "11px",
                    letterSpacing: "0.14em",
                    color: "#777777",
                  }}
                >
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ padding: "18px", textAlign: "center", color: "#777777" }}>
                  Memuat data...
                </td>
              </tr>
            ) : services.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: "18px", textAlign: "center", color: "#777777" }}>
                  Belum ada data maintenance.
                </td>
              </tr>
            ) : (
              services.map((item, index) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #EEEEEE" }}>
                  <td style={{ padding: "12px" }}>{index + 1}</td>
                  <td style={{ padding: "12px" }}>{item.service_date}</td>
                  <td style={{ padding: "12px" }}>
                    {item.vehicle?.name} - {item.vehicle?.plate_number}
                  </td>
                  <td style={{ padding: "12px" }}>{item.maintenance_type?.name || item.service_type}</td>
                  <td style={{ padding: "12px" }}>{conditionLabels[item.condition_status]}</td>
                  <td style={{ padding: "12px", maxWidth: "240px" }}>{item.description || "-"}</td>
                  <td style={{ padding: "12px" }}>{formatRupiah(item.cost)}</td>
                  <td style={{ padding: "12px" }}>{statusLabels[item.status]}</td>
                  <td style={{ padding: "12px", display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      style={{
                        border: "1px solid #D1D5DB",
                        backgroundColor: "#FFFFFF",
                        padding: "7px 12px",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                    >
                      EDIT
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      style={{
                        border: "1px solid #FCA5A5",
                        backgroundColor: "#FFFFFF",
                        color: "#C8102E",
                        padding: "7px 12px",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                    >
                      HAPUS
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}