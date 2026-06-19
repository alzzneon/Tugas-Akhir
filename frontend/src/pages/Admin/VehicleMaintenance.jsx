import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import DataTable from "../../Components/Admin/DataTable";
import Modal from "../../Components/Admin/Modal";

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

function inputClass() {
  return "w-full border border-gray-200 bg-white px-3 py-2 text-[13px] text-gray-800 outline-none transition focus:border-[#C8102E]";
}

function FieldLabel({ children, required = false }) {
  return (
    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
      {children}
      {required && <span className="text-[#C8102E]"> *</span>}
    </label>
  );
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
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

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
      setMessage("Gagal memuat data maintenance.");
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

  function openCreate() {
    resetForm();
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    resetForm();
  }

  function handleEdit(item) {
    setEditingId(item.id);

    setForm({
      vehicle_id: item.vehicle?.id || item.vehicle_id || "",
      maintenance_type_id:
        item.maintenance_type?.id || item.maintenance_type_id || "",
      service_date: item.service_date || "",
      condition_status: item.condition_status || "good",
      description: item.description || "",
      cost: item.cost || "",
      started_at: toDateTimeLocal(item.started_at),
      completed_at: toDateTimeLocal(item.completed_at),
      status: item.status || "planned",
      next_service_date: item.next_service_date || "",
    });

    setOpen(true);
  }

  function updateForm(key, value) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
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
      setMessage("");

      if (editingId) {
        await api.put(`/admin/vehicle-services/${editingId}`, payload);
        setMessage("Data maintenance berhasil diperbarui.");
      } else {
        await api.post("/admin/vehicle-services", payload);
        setMessage("Data maintenance berhasil ditambahkan.");
      }

      closeModal();
      await fetchData();
    } catch (err) {
      console.error("Gagal menyimpan maintenance:", err);
      setMessage("Gagal menyimpan data maintenance.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    if (!confirm("Hapus data maintenance ini?")) return;

    try {
      setMessage("");

      await api.delete(`/admin/vehicle-services/${item.id}`);

      await fetchData();
      setMessage("Data maintenance berhasil dihapus.");
    } catch (err) {
      console.error("Gagal menghapus maintenance:", err);
      setMessage("Gagal menghapus data maintenance.");
    }
  }

  const filteredServices = services.filter((item) => {
    const keyword = search.trim().toLowerCase();

    const vehicleName = item.vehicle?.name || "";
    const plateNumber = item.vehicle?.plate_number || "";
    const maintenanceType =
      item.maintenance_type?.name ||
      item.service_type ||
      "";
    const description = item.description || "";

    return (
      !keyword ||
      [vehicleName, plateNumber, maintenanceType, description]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  });

  return (
    <div className="space-y-4">
      {message && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {message}
        </div>
      )}

      <DataTable
        title="Maintenance Kendaraan"
        subtitle="Kelola riwayat pengecekan, service, dan perbaikan kendaraan"
        rows={filteredServices}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        onCreate={openCreate}
        createLabel="+ Tambah"
        clickableKey="vehicle"
        onClickCell={handleEdit}
        onEdit={handleEdit}
        onDelete={handleDelete}
        columns={[
          {
            key: "service_date",
            label: "Tanggal",
          },
          {
            key: "vehicle",
            label: "Kendaraan",
          },
          {
            key: "maintenance_type",
            label: "Jenis",
          },
          {
            key: "condition_status",
            label: "Kondisi",
          },
          {
            key: "description",
            label: "Catatan",
          },
          {
            key: "cost",
            label: "Biaya",
          },
          {
            key: "status",
            label: "Status",
          },
        ]}
        renderCell={({ row, col }) => {
          if (col.key === "vehicle") {
            return `${row.vehicle?.name || "-"} - ${
              row.vehicle?.plate_number || "-"
            }`;
          }

          if (col.key === "maintenance_type") {
            return row.maintenance_type?.name || row.service_type || "-";
          }

          if (col.key === "condition_status") {
            return conditionLabels[row.condition_status] || "-";
          }

          if (col.key === "cost") {
            return formatRupiah(row.cost);
          }

          if (col.key === "status") {
            return statusLabels[row.status] || "-";
          }

          return row[col.key] || "-";
        }}
      />

      <Modal
        open={open}
        size="lg"
        title={
          editingId
            ? "Edit Maintenance Kendaraan"
            : "Tambah Maintenance Kendaraan"
        }
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <FieldLabel required>Kendaraan</FieldLabel>

              <select
                value={form.vehicle_id}
                onChange={(e) => updateForm("vehicle_id", e.target.value)}
                required
                className={inputClass()}
              >
                <option value="">Pilih kendaraan</option>

                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.name} - {vehicle.plate_number}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <FieldLabel required>Jenis Maintenance</FieldLabel>

              <select
                value={form.maintenance_type_id}
                onChange={(e) =>
                  updateForm("maintenance_type_id", e.target.value)
                }
                required
                className={inputClass()}
              >
                <option value="">Pilih jenis maintenance</option>

                {types.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <FieldLabel required>Tanggal Maintenance</FieldLabel>

              <input
                type="date"
                value={form.service_date}
                onChange={(e) => updateForm("service_date", e.target.value)}
                required
                className={inputClass()}
              />
            </div>

            <div>
              <FieldLabel>Kondisi</FieldLabel>

              <select
                value={form.condition_status}
                onChange={(e) =>
                  updateForm("condition_status", e.target.value)
                }
                className={inputClass()}
              >
                <option value="good">Baik</option>
                <option value="damaged">Ada Kerusakan</option>
              </select>
            </div>

            <div>
              <FieldLabel>Biaya</FieldLabel>

              <input
                type="number"
                value={form.cost}
                onChange={(e) => updateForm("cost", e.target.value)}
                placeholder="Biaya"
                className={inputClass()}
              />
            </div>

            <div>
              <FieldLabel>Status</FieldLabel>

              <select
                value={form.status}
                onChange={(e) => updateForm("status", e.target.value)}
                className={inputClass()}
              >
                <option value="planned">Direncanakan</option>
                <option value="in_progress">Sedang Dikerjakan</option>
                <option value="completed">Selesai</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </div>

            <div>
              <FieldLabel>Mulai Perbaikan</FieldLabel>

              <input
                type="datetime-local"
                value={form.started_at}
                onChange={(e) => updateForm("started_at", e.target.value)}
                className={inputClass()}
              />
            </div>

            <div>
              <FieldLabel>Selesai Perbaikan</FieldLabel>

              <input
                type="datetime-local"
                value={form.completed_at}
                onChange={(e) => updateForm("completed_at", e.target.value)}
                className={inputClass()}
              />
            </div>

            <div className="md:col-span-2">
              <FieldLabel>Catatan Maintenance</FieldLabel>

              <textarea
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                placeholder="Catatan maintenance"
                rows={3}
                className={inputClass()}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="border border-gray-200 px-4 py-2 text-sm font-semibold"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={saving}
              className="bg-[#C8102E] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}