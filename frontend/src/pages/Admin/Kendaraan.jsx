"use client";

import { useEffect, useMemo, useState } from "react";
import { crud } from "../../lib/crud";

import Button from "../../Components/Admin/Button";
import Card from "../../Components/Admin/Card";
import Input from "../../Components/Admin/Input";
import StatusBadge from "../../Components/Admin/StatusBadge";
import AdminTable from "../../Components/Admin/Table";

const endpoint = "mt-kendaraan";

const JENIS_OPTIONS = [
  { label: "Motor", value: "motor" },
  { label: "Mobil", value: "mobil" },
];

const STATUS_OPTIONS = [
  { label: "Tersedia", value: "available" },
  { label: "Disewa", value: "rented" },
  { label: "Maintenance", value: "maintenance" },
];

const emptyForm = {
  jenis: "motor",
  nama: "",
  merk: "",
  plat_nomor: "",
  harga_per_hari: "",
  status: "available",
  kapasitas_penumpang: "",
  tahun: "",
};

function Field({ label, required, hint, error, children }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>{label}</span>
        {required && <span style={{ color: "#ef4444", fontSize: 12 }}>*</span>}
      </div>
      {children}
      {hint && <div style={{ fontSize: 12, color: "#64748b" }}>{hint}</div>}
      {error && <div style={{ fontSize: 12, color: "#ef4444" }}>{error}</div>}
    </div>
  );
}

function Select({ value, onChange, children, disabled }) {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid #e5e7eb",
        background: disabled ? "#f3f4f6" : "white",
        color: disabled ? "#9ca3af" : "#0f172a",
        outline: "none",
      }}
    >
      {children}
    </select>
  );
}

export default function Kendaraan() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const isMotor = form.jenis === "motor";

  const headers = useMemo(
    () => [
      { name: "id", label: "ID", width: "70px" },
      { name: "jenis", label: "Jenis", width: "110px" },
      { name: "nama", label: "Nama", width: "auto" },
      { name: "merk", label: "Merk", width: "160px" },
      { name: "plat_nomor", label: "Plat", width: "140px" },
      { name: "harga_per_hari", label: "Harga/Hari", align: "right", width: "130px" },
      { name: "status", label: "Status", type: "status", width: "140px" },
      { name: "kapasitas_penumpang", label: "Kapasitas", align: "right", width: "110px" },
      { name: "tahun", label: "Tahun", align: "right", width: "90px" },
    ],
    []
  );

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await crud.list(endpoint);
      setRows(res.data.data);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Gagal load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onChange = (key) => (e) => {
    const value = e.target.value;

    if (key === "jenis") {
      setForm((p) => ({
        ...p,
        jenis: value,
        kapasitas_penumpang: value === "motor" ? "" : p.kapasitas_penumpang,
      }));
      return;
    }

    setForm((p) => ({ ...p, [key]: value }));
  };

  const startEdit = (row) => {
    setEditId(row.id);
    setError("");
    setForm({
      jenis: row.jenis ?? "motor",
      nama: row.nama ?? "",
      merk: row.merk ?? "",
      plat_nomor: row.plat_nomor ?? "",
      harga_per_hari: row.harga_per_hari ?? "",
      status: row.status ?? "available",
      kapasitas_penumpang: row.kapasitas_penumpang ?? "",
      tahun: row.tahun ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditId(null);
    setForm(emptyForm);
    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const kapasitas =
      form.jenis === "motor"
        ? null
        : form.kapasitas_penumpang === ""
        ? null
        : Number(form.kapasitas_penumpang);

    const payload = {
      ...form,
      harga_per_hari: form.harga_per_hari === "" ? null : Number(form.harga_per_hari),
      kapasitas_penumpang: kapasitas,
      tahun: form.tahun === "" ? null : Number(form.tahun),
    };

    if (payload.jenis === "mobil" && payload.kapasitas_penumpang == null) {
      setError("Kapasitas penumpang wajib diisi jika jenis = mobil.");
      setSaving(false);
      return;
    }

    try {
      if (editId) await crud.update(endpoint, editId, payload);
      else await crud.create(endpoint, payload);

      cancelEdit();
      await loadData();
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        (err?.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(" | ")
          : "Gagal simpan data");
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Yakin hapus data ini?")) return;
    setError("");
    try {
      await crud.remove(endpoint, id);
      await loadData();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Gagal hapus data");
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Kendaraan</div>
          <div style={{ fontSize: 13, color: "#64748b" }}>Kelola data kendaraan (motor & mobil)</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {editId && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, color: "#64748b" }}>Mode:</span>
              <StatusBadge status="maintenance" />
              <span style={{ fontSize: 12, color: "#64748b" }}>Edit ID #{editId}</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <Card style={{ borderColor: "#fecaca", background: "#fff1f2" }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Error</div>
          <div style={{ color: "#991b1b", fontSize: 13 }}>{error}</div>
        </Card>
      )}

      {/* FORM */}
      <Card>
        <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>
              {editId ? "Edit Kendaraan" : "Tambah Kendaraan"}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <Button type="submit" loading={saving}>
                {editId ? "Update" : "Tambah"}
              </Button>
              {editId && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Batal
                </Button>
              )}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
            }}
          >
            <Field label="Jenis" required>
              <Select value={form.jenis} onChange={onChange("jenis")}>
                {JENIS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Status" required>
              <Select value={form.status} onChange={onChange("status")}>
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Nama" required>
              <Input value={form.nama} onChange={onChange("nama")} placeholder="Avanza / Vario" />
            </Field>

            <Field label="Merk" required>
              <Input value={form.merk} onChange={onChange("merk")} placeholder="Toyota / Honda" />
            </Field>

            <Field label="Plat Nomor" required>
              <Input value={form.plat_nomor} onChange={onChange("plat_nomor")} placeholder="B 1234 CD" />
            </Field>

            <Field label="Harga / Hari" required>
              <Input
                type="number"
                min="0"
                value={form.harga_per_hari}
                onChange={onChange("harga_per_hari")}
                placeholder="300000"
              />
            </Field>

            <Field
              label="Kapasitas Penumpang"
              required={!isMotor}
              hint={isMotor ? "Motor: harus kosong (NULL)" : "Mobil: wajib isi"}
            >
              <Input
                type="number"
                min="1"
                disabled={isMotor}
                value={form.kapasitas_penumpang}
                onChange={onChange("kapasitas_penumpang")}
                placeholder={isMotor ? "Untuk motor harus kosong" : "6"}
              />
            </Field>

            <Field label="Tahun">
              <Input type="number" min="1900" value={form.tahun} onChange={onChange("tahun")} placeholder="2021" />
            </Field>
          </div>
        </form>
      </Card>

      {/* TABLE */}
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>Daftar Kendaraan</div>
          <div style={{ fontSize: 13, color: "#64748b" }}>
            {loading ? "Memuat data..." : `${rows.length} data`}
          </div>
        </div>

        <AdminTable
          headers={headers}
          data={rows.map((r) => ({
            ...r,
            harga_per_hari: r.harga_per_hari ?? "-",
            kapasitas_penumpang: r.kapasitas_penumpang ?? "-",
            tahun: r.tahun ?? "-",
          }))}
          onEdit={startEdit}
          onDelete={remove}
          // override render status agar pakai StatusBadge yang sudah kamu punya
          renderCell={(h, row) => {
            if (h.type === "status") return <StatusBadge status={row.status} />;
            return row[h.name] ?? "-";
          }}
        />
      </div>
    </div>
  );
}
