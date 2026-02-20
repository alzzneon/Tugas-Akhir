import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import DataTable from "../../../Components/Admin/DataTable";
import Modal from "../../../Components/Admin/Modal";
import FormFields from "../../../Components/Admin/FormFields";
import ConfirmModal from "../../../Components/Admin/ConfirmModal";

import { adminFetch } from "../../../lib/adminFetch";

function Detail({ label, value }) {
  return (
    <div className="rounded-xl border bg-white p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-semibold text-gray-900">{String(value ?? "-")}</div>
    </div>
  );
}

export default function VehiclesPage({ title, typeCode }) {
  const nav = useNavigate();

  const baseEndpoint = "/api/admin/masters/vehicles";
  const listEndpoint = `${baseEndpoint}?type=${typeCode}`;

  const epTypes = "/api/admin/masters/vehicle-types";
  const epBrands = "/api/admin/masters/vehicle-brands";
  const epTrans = "/api/admin/masters/transmissions";

  const columns = [
    { key: "name", label: "Nama" },
    { key: "plate_number", label: "Nomor Polisi" },
    { key: "vehicle_brand_name", label: "Merek" },
    { key: "transmission_name", label: "Transmisi" },
    { key: "daily_rate", label: "Tarif Harian" },
    { key: "is_active", label: "Status" },
  ];

  // ===== State data list =====
  const [rows, setRows] = useState([]);
  const [types, setTypes] = useState([]);
  const [brands, setBrands] = useState([]);
  const [transmissions, setTransmissions] = useState([]);

  // ===== UX =====
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [q, setQ] = useState("");

  // ===== Modal create/edit/view =====
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create"); // create | edit | view
  const [active, setActive] = useState(null);
  const [saving, setSaving] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    vehicle_type_id: "",
    vehicle_brand_id: "",
    transmission_id: "",
    name: "",
    plate_number: "",
    year: "",
    color: "",
    daily_rate: "",
    description: "",
    is_active: true,
    image: null,
  });

  const [preview, setPreview] = useState("");

  const loadAll = async () => {
    try {
      setMsg("");
      setLoading(true);

      const [vehicles, t, b, tr] = await Promise.all([
        adminFetch(listEndpoint),
        adminFetch(epTypes),
        adminFetch(epBrands),
        adminFetch(epTrans),
      ]);

      setRows(Array.isArray(vehicles) ? vehicles : []);
      setTypes(Array.isArray(t) ? t : []);
      setBrands(Array.isArray(b) ? b : []);
      setTransmissions(Array.isArray(tr) ? tr : []);
    } catch (e) {
      if (e.message === "UNAUTHORIZED") {
        nav("/admin/login", { replace: true });
        return;
      }
      setMsg(e.message || "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [typeCode]);

  const fixedType = useMemo(() => {
    const upper = String(typeCode || "").toUpperCase();
    return types.find((x) => String(x.code).toUpperCase() === upper) || null;
  }, [types, typeCode]);

  const typeOptions = useMemo(() => {
    if (!fixedType) return [];
    return [{ value: fixedType.id, label: `${fixedType.name} (${fixedType.code})` }];
  }, [fixedType]);

  const brandOptions = useMemo(
    () => brands.filter((x) => x.is_active).map((x) => ({ value: x.id, label: x.name })),
    [brands]
  );

  const transmissionOptions = useMemo(
    () => transmissions.filter((x) => x.is_active).map((x) => ({ value: x.id, label: x.name })),
    [transmissions]
  );

  const formFields = useMemo(
    () => [
      { key: "image", label: "Foto Kendaraan", type: "file" },
      {
        key: "vehicle_type_id",
        label: "Jenis Kendaraan",
        required: true,
        type: "select",
        placeholder: "Pilih jenis",
        options: typeOptions,
      },
      {
        key: "vehicle_brand_id",
        label: "Merek Kendaraan",
        required: true,
        type: "select",
        placeholder: "Pilih merek",
        options: brandOptions,
      },
      {
        key: "transmission_id",
        label: "Transmisi",
        required: false, 
        type: "select",
        placeholder: "Opsional",
        options: transmissionOptions,
      },
      { key: "name", label: "Nama Kendaraan", required: true },
      { key: "plate_number", label: "Nomor Polisi", required: true },
      { key: "year", label: "Tahun", type: "number" },
      { key: "color", label: "Warna" },
      { key: "daily_rate", label: "Tarif Harian", required: true, type: "number" },
      { key: "description", label: "Deskripsi" },
      { key: "is_active", label: "Aktif", type: "checkbox" },
    ],
    [typeOptions, brandOptions, transmissionOptions]
  );

  const filtered = (rows ?? []).filter((r) => {
    const s = (q || "").toLowerCase();
    return (
      r.name?.toLowerCase().includes(s) ||
      r.plate_number?.toLowerCase().includes(s) ||
      r.vehicle_brand_name?.toLowerCase().includes(s)
    );
  });

  // preview untuk file baru
  useEffect(() => {
    if (!form.image) return;
    const url = URL.createObjectURL(form.image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [form.image]);

  const openCreate = () => {
    setMode("create");
    setActive(null);

    setForm({
      vehicle_type_id: fixedType?.id ?? "",
      vehicle_brand_id: "",
      transmission_id: "",
      name: "",
      plate_number: "",
      year: "",
      color: "",
      daily_rate: "",
      description: "",
      is_active: true,
      image: null,
    });

    setPreview("");
    setOpen(true);
  };

  const openView = (row) => {
    setMode("view");
    setActive(row);
    setPreview(row.image_url || "");
    setOpen(true);
  };

  const openEdit = (row) => {
    setMode("edit");
    setActive(row);

    setForm({
      vehicle_type_id: fixedType?.id ?? row.vehicle_type_id ?? "",
      vehicle_brand_id: row.vehicle_brand_id ?? "",
      transmission_id: row.transmission_id ?? "",
      name: row.name ?? "",
      plate_number: row.plate_number ?? "",
      year: row.year ?? "",
      color: row.color ?? "",
      daily_rate: row.daily_rate ?? "",
      description: row.description ?? "",
      is_active: Boolean(row.is_active),
      image: null,
    });

    setPreview(row.image_url || "");
    setOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!fixedType) {
      setMsg(`Kode jenis kendaraan "${typeCode}" tidak ditemukan.`);
      return;
    }

    // FormData sesuai DB lama
    const fd = new FormData();
    fd.append("vehicle_type_id", String(fixedType.id));
    fd.append("vehicle_brand_id", String(form.vehicle_brand_id || ""));

    // transmission optional
    if (form.transmission_id) fd.append("transmission_id", String(form.transmission_id));

    fd.append("name", String(form.name ?? ""));
    fd.append("plate_number", String(form.plate_number ?? "").trim());

    if (form.year !== "" && form.year !== null && form.year !== undefined) {
      fd.append("year", String(form.year));
    }
    if (form.color) fd.append("color", String(form.color));

    fd.append("daily_rate", String(form.daily_rate ?? "").trim());

    if (form.description) fd.append("description", String(form.description));
    fd.append("is_active", form.is_active ? "1" : "0");

    if (form.image) fd.append("image", form.image);

    try {
      setSaving(true);
      setMsg("");

      if (mode === "create") {
        await adminFetch(baseEndpoint, { method: "POST", body: fd });
      } else {
        fd.append("_method", "PUT");
        await adminFetch(`${baseEndpoint}/${active.id}`, { method: "POST", body: fd });
      }

      setOpen(false);
      await loadAll();
    } catch (err) {
      if (err.message === "UNAUTHORIZED") {
        nav("/admin/login", { replace: true });
        return;
      }
      setMsg(err.message || "Gagal menyimpan data.");
    } finally {
      setSaving(false);
    }
  };

  const remove = (row) => {
    setDeleteTarget(row);
    setConfirmOpen(true);
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await adminFetch(`${baseEndpoint}/${deleteTarget.id}`, { method: "DELETE" });

      setConfirmOpen(false);
      setDeleteTarget(null);
      await loadAll();
    } catch (err) {
      setMsg(err.message || "Gagal menghapus data.");
    } finally {
      setDeleting(false);
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
        title={title}
        searchValue={q}
        onSearchChange={setQ}
        onCreate={openCreate}
        columns={columns}
        rows={filtered}
        loading={loading}
        clickableKey="name"
        onClickCell={openView}
        onEdit={openEdit}
        onDelete={remove}
        renderCell={({ row, col }) => {
          if (col.key === "is_active") return row.is_active ? "Aktif" : "Nonaktif";
          if (col.key === "daily_rate") return String(row.daily_rate ?? "");
          return String(row[col.key] ?? "");
        }}
      />

      <Modal
        open={open}
        size="lg"
        title={
          mode === "create"
            ? `Tambah ${title}`
            : mode === "edit"
            ? `Ubah ${title}`
            : "Detail Kendaraan"
        }
        onClose={() => setOpen(false)}
      >
        {mode === "view" && active && (
          <>
            {preview ? (
              <img
                src={preview}
                className="h-56 w-full object-cover rounded-xl border mb-4"
                alt=""
              />
            ) : (
              <div className="h-56 w-full rounded-xl border mb-4 grid place-items-center text-gray-400">
                Tidak ada foto
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <Detail label="Nama" value={active.name} />
              <Detail label="Nomor Polisi" value={active.plate_number} />
              <Detail label="Merek" value={active.vehicle_brand_name} />
              <Detail label="Transmisi" value={active.transmission_name ?? "-"} />
              <Detail label="Tarif Harian" value={active.daily_rate} />
              <Detail label="Status" value={active.is_active ? "Aktif" : "Tidak Aktif"} />
            </div>
          </>
        )}

        {(mode === "create" || mode === "edit") && (
          <form onSubmit={submit}>
            <FormFields fields={formFields} form={form} setForm={setForm} />

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="border px-4 py-2 rounded-xl"
              >
                Batal
              </button>

              <button
                disabled={saving}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl disabled:opacity-60"
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmModal
        open={confirmOpen}
        title="Konfirmasi Penghapusan"
        message="Apakah Anda yakin ingin menghapus data kendaraan berikut?"
        detail={deleteTarget?.name}
        loading={deleting}
        onCancel={() => {
          if (!deleting) {
            setConfirmOpen(false);
            setDeleteTarget(null);
          }
        }}
        onConfirm={doDelete}
      />
    </div>
  );
}
