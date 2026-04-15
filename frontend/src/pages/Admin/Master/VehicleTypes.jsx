import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../../../Components/Admin/DataTable";
import Modal from "../../../Components/Admin/Modal";
import FormFields from "../../../Components/Admin/FormFields";
import { adminFetch } from "../../../lib/adminFetch";

export default function VehicleTypes() {
  const nav = useNavigate();
  const endpoint = "/api/admin/masters/vehicle-types";

  const columns = [
    { key: "id", label: "ID" },
    { key: "code", label: "Code" },
    { key: "name", label: "Nama" },
    { key: "late_fee_per_hour", label: "Denda/Jam" },
    { key: "late_fee_threshold_hours", label: "Toleransi Jam" },
    { key: "is_active", label: "Aktif" },
  ];

  const formFields = [
    { key: "code", label: "Code", required: true, placeholder: "MOBIL" },
    { key: "name", label: "Nama", required: true, placeholder: "Mobil" },
    {
      key: "late_fee_per_hour",
      label: "Denda per Jam",
      type: "number",
      placeholder: "0",
    },
    {
      key: "late_fee_threshold_hours",
      label: "Toleransi Keterlambatan (Jam)",
      type: "number",
      placeholder: "0",
    },
    { key: "is_active", label: "Aktif", type: "checkbox" },
  ];

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [active, setActive] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: "",
    name: "",
    late_fee_per_hour: 0,
    late_fee_threshold_hours: 0,
    is_active: true,
  });

  const load = async () => {
    try {
      setMsg("");
      setLoading(true);

      const data = await adminFetch(endpoint);
      setRows(data);
    } catch (e) {
      if (e.message === "UNAUTHORIZED") {
        nav("/admin/login", { replace: true });
        return;
      }
      setMsg(e.message || "Gagal load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = rows.filter((r) => {
    const s = q.toLowerCase();
    return (
      r.code?.toLowerCase().includes(s) ||
      r.name?.toLowerCase().includes(s)
    );
  });

  const openCreate = () => {
    setMode("create");
    setActive(null);
    setForm({
      code: "",
      name: "",
      late_fee_per_hour: 0,
      late_fee_threshold_hours: 0,
      is_active: true,
    });
    setOpen(true);
  };

  const openEdit = (row) => {
    setMode("edit");
    setActive(row);
    setForm({
      code: row.code ?? "",
      name: row.name ?? "",
      late_fee_per_hour: row.late_fee_per_hour ?? 0,
      late_fee_threshold_hours: row.late_fee_threshold_hours ?? 0,
      is_active: Boolean(row.is_active),
    });
    setOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setMsg("");

      const payload = {
        ...form,
        late_fee_per_hour:
          form.late_fee_per_hour === "" ? 0 : Number(form.late_fee_per_hour),
        late_fee_threshold_hours:
          form.late_fee_threshold_hours === ""
            ? 0
            : Number(form.late_fee_threshold_hours),
      };

      if (mode === "create") {
        await adminFetch(endpoint, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } else {
        await adminFetch(`${endpoint}/${active.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      }

      setOpen(false);
      await load();
    } catch (e) {
      if (e.message === "UNAUTHORIZED") {
        nav("/admin/login", { replace: true });
        return;
      }
      setMsg(e.message || "Gagal simpan");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!confirm(`Hapus ${row.code}?`)) return;

    try {
      setMsg("");
      await adminFetch(`${endpoint}/${row.id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setMsg(e.message || "Gagal hapus");
    }
  };

  return (
    <div>
      {msg && (
        <div className="mb-4 rounded-xl border p-3 text-sm text-red-600 bg-red-50">
          {msg}
        </div>
      )}

      <DataTable
        title="Master Jenis Kendaraan"
        searchValue={q}
        onSearchChange={setQ}
        onCreate={openCreate}
        columns={columns}
        rows={filtered}
        loading={loading}
        clickableKey="code"
        onClickCell={openEdit}
        onEdit={openEdit}
        onDelete={remove}
        renderCell={({ row, col }) => {
          if (col.key === "is_active") return row.is_active ? "Aktif" : "Nonaktif";
          if (col.key === "late_fee_per_hour") return Number(row.late_fee_per_hour ?? 0).toFixed(2);
          if (col.key === "late_fee_threshold_hours") return String(row.late_fee_threshold_hours ?? 0);
          return String(row[col.key] ?? "");
        }}
      />

      <Modal
        open={open}
        size="md"
        title={mode === "create" ? "Tambah Jenis Kendaraan" : "Edit Jenis Kendaraan"}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={submit} className="space-y-4">
          <FormFields fields={formFields} form={form} setForm={setForm} />

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border px-4 py-2 font-semibold hover:bg-gray-50"
            >
              Batal
            </button>

            <button
              disabled={saving}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}