import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import DataTable from "../../../Components/Admin/DataTable";
import Modal from "../../../Components/Admin/Modal";

// ─── Badge ────────────────────────────────────────────────────────────────────

const BADGE_STYLES = {
  gray:   "bg-gray-100 text-gray-600",
  yellow: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60",
  green:  "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60",
  red:    "bg-red-50 text-red-600 ring-1 ring-red-200/60",
  blue:   "bg-blue-50 text-blue-700 ring-1 ring-blue-200/60",
  indigo: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/60",
};

function Badge({ children, color = "gray" }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium tracking-wide ${BADGE_STYLES[color] || BADGE_STYLES.gray}`}>
      {children}
    </span>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusColor(s) {
  switch (String(s||"").toLowerCase()) {
    case "pending":  return "yellow";
    case "approved": return "blue";
    case "paid": case "completed": return "green";
    case "rejected": case "cancelled": case "expired": return "red";
    case "ongoing":  case "overdue": return "indigo";
    default: return "gray";
  }
}
function getPaymentStatusColor(s) {
  switch (String(s||"").toLowerCase()) {
    case "paid": return "green"; case "failed": case "expired": return "red"; case "unpaid": return "yellow"; default: return "gray";
  }
}
function getRentalStatusLabel(s) {
  return ({pending:"Menunggu Persetujuan",approved:"Disetujui",paid:"Lunas",ongoing:"Sedang Berjalan",completed:"Selesai",overdue:"Terlambat",rejected:"Ditolak",cancelled:"Dibatalkan",expired:"Kedaluwarsa"})[String(s||"").toLowerCase()] || s || "-";
}
function getPaymentStatusLabel(s) {
  return ({unpaid:"Belum Bayar",paid:"Sudah Bayar",failed:"Gagal",expired:"Kedaluwarsa"})[String(s||"").toLowerCase()] || s || "-";
}
function getPickupMethodLabel(v) {
  return ({pickup:"Diambil sendiri",delivery:"Diantar"})[String(v||"").toLowerCase()] || "-";
}
function formatDateTime(v) {
  if (!v) return "-"; const d=new Date(v); if (isNaN(d)) return v;
  return d.toLocaleString("id-ID",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"});
}
function formatCurrency(v) { return `Rp ${Number(v||0).toLocaleString("id-ID")}`; }
function normalizeDateTimeLocal(v) { return v ? String(v).slice(0,16) : ""; }

function getAllowedStatusOptions(row) {
  const s=String(row?.status||"").toLowerCase();
  return ({pending:["pending","approved","rejected","cancelled"],approved:["approved","paid","rejected","cancelled","expired"],paid:["paid","ongoing","completed"],ongoing:["ongoing","completed","overdue"],overdue:["overdue","completed"],completed:["completed"],rejected:["rejected"],cancelled:["cancelled"],expired:["expired"]})[s]||[s];
}
function getAllowedPaymentStatusOptions(row) {
  return ["paid","completed","ongoing","overdue"].includes(String(row?.status||"").toLowerCase()) ? ["paid"] : ["unpaid","paid","failed","expired"];
}

// ─── UI primitives ────────────────────────────────────────────────────────────

function FieldLabel({ children, required }) {
  return (
    <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
      {children}{required && <span className="ml-0.5 text-red-400">*</span>}
    </label>
  );
}
const inputCls = (err) =>
  `w-full rounded-lg border text-[13px] px-3 py-2 outline-none transition bg-white text-gray-800 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-50 disabled:text-gray-400 ${err?"border-red-300 focus:border-red-400 focus:ring-red-100":"border-gray-200"}`;

function FieldError({ msg }) { return msg ? <p className="mt-1 text-[11px] text-red-500">{msg}</p> : null; }

function SectionDivider({ label }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</span>
      <div className="flex-1 border-t border-gray-100" />
    </div>
  );
}
function ActionBtn({ onClick, variant="default", children, disabled }) {
  const v={default:"bg-indigo-600 text-white hover:bg-indigo-700",blue:"bg-blue-600 text-white hover:bg-blue-700",green:"bg-emerald-600 text-white hover:bg-emerald-700"};
  return <button onClick={onClick} disabled={disabled} className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium transition disabled:opacity-50 ${v[variant]}`}>{children}</button>;
}

const Ico = {
  user:  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 0115 0"/></svg>,
  phone: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/></svg>,
  map:   <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>,
  car:   <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg>,
  hash:  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5"/></svg>,
  box:   <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"/></svg>,
  money: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75"/></svg>,
};

function InfoRow({ icon, label, children }) {
  return (
    <div className="flex items-start gap-3 px-4 py-2.5 border-b border-gray-50 last:border-0">
      <span className="mt-0.5 flex-shrink-0 text-gray-400">{icon}</span>
      <span className="w-36 flex-shrink-0 text-[11.5px] text-gray-400 leading-relaxed pt-px">{label}</span>
      <div className="text-[12.5px] text-gray-800 font-medium leading-relaxed">{children}</div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RentalsList({ type = "mobil" }) {
  const token = localStorage.getItem("token");

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [q, setQ] = useState("");
  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [customerMode, setCustomerMode] = useState("registered");
  const [createErrors, setCreateErrors] = useState({});
  const [createForm, setCreateForm] = useState({ user_id:"", customer_name:"", customer_phone:"", customer_email:"", vehicle_id:"", start_date:"", end_date:"", pickup_method:"pickup", delivery_address:"", notes:"", direct_approve:true, payment_deadline_hours:2 });
  const [savingCreate, setSavingCreate] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({ status:"", payment_status:"", payment_type:"full", payment_method:"transfer", amount:"", notes:"" });

  const api = useMemo(() => axios.create({ baseURL:"http://localhost:8000/api", headers:{ Authorization:`Bearer ${token}`, Accept:"application/json" } }), [token]);

  const columns = [
    { key:"booking_code", label:"Kode Booking" }, { key:"penyewa", label:"Penyewa" },
    { key:"kendaraan", label:"Kendaraan" }, { key:"periode", label:"Periode" },
    { key:"pickup_method", label:"Pengambilan" }, { key:"total_price", label:"Total" },
    { key:"status", label:"Status" }, { key:"payment_status", label:"Pembayaran" },
  ];

  async function fetchRentals() {
    try { setMsg(""); setLoading(true); const res=await api.get("/admin/rentals"); const data=Array.isArray(res.data?.data)?res.data.data:[];
      setRows(data.filter(i=>String(i?.vehicle?.vehicle_type?.code||"").toLowerCase()===String(type).toLowerCase()));
    } catch(err) { setMsg(err.response?.data?.message||"Gagal memuat data."); setRows([]); } finally { setLoading(false); }
  }
  async function fetchUsers() { try { setLoadingUsers(true); const r=await api.get("/admin/users-for-rental"); setUsers(Array.isArray(r.data?.data)?r.data.data:[]); } catch { setUsers([]); } finally { setLoadingUsers(false); } }
  async function fetchVehicles() { try { setLoadingVehicles(true); const r=await api.get("/admin/masters/vehicles",{params:{type_code:type}}); setVehicles(Array.isArray(r.data?.data)?r.data.data:[]); } catch { setVehicles([]); } finally { setLoadingVehicles(false); } }

  useEffect(() => { fetchRentals(); fetchUsers(); fetchVehicles(); }, [type]);

  const filteredRows = rows.filter(row => {
    const s=q.toLowerCase(), name=row.user?.full_name||row.manual_customer?.customer_name||"";
    return name.toLowerCase().includes(s)||(row.vehicle?.name||"").toLowerCase().includes(s)||(row.booking_code||"").toLowerCase().includes(s)||(row.vehicle?.plate_number||"").toLowerCase().includes(s);
  });

  function resetCreateForm() { setCustomerMode("registered"); setCreateErrors({}); setCreateForm({ user_id:"", customer_name:"", customer_phone:"", customer_email:"", vehicle_id:"", start_date:"", end_date:"", pickup_method:"pickup", delivery_address:"", notes:"", direct_approve:true, payment_deadline_hours:2 }); }
  function handleCreateChange(e) {
    const {name,value,type:t,checked}=e.target;
    setCreateForm(prev=>({...prev,[name]:t==="checkbox"?checked:value,...(name==="pickup_method"&&value==="pickup"?{delivery_address:""}:{})}));
    setCreateErrors(prev=>({...prev,[name]:""})); setMsg("");
  }
  function handleCustomerModeChange(mode) { setCustomerMode(mode); setMsg(""); setCreateErrors({}); setCreateForm(prev=>({...prev,user_id:"",customer_name:"",customer_phone:"",customer_email:""})); }
  function validateCreateForm() {
    const e={};
    if (customerMode==="registered"&&!createForm.user_id) e.user_id="User wajib dipilih.";
    if (customerMode==="manual") { if (!createForm.customer_name?.trim()) e.customer_name="Nama wajib diisi."; if (!createForm.customer_phone?.trim()) e.customer_phone="Telepon wajib diisi."; }
    if (!createForm.vehicle_id) e.vehicle_id="Kendaraan wajib dipilih.";
    if (!createForm.start_date) e.start_date="Wajib diisi.";
    if (!createForm.end_date) e.end_date="Wajib diisi.";
    if (createForm.start_date&&createForm.end_date&&new Date(createForm.end_date)<=new Date(createForm.start_date)) e.end_date="Harus lebih besar dari tanggal mulai.";
    if (!createForm.pickup_method) e.pickup_method="Wajib dipilih.";
    if (createForm.pickup_method==="delivery"&&!createForm.delivery_address?.trim()) e.delivery_address="Alamat wajib diisi.";
    if (Number(createForm.payment_deadline_hours)<1) e.payment_deadline_hours="Minimal 1 jam.";
    setCreateErrors(e); return Object.keys(e).length===0;
  }
  async function handleSubmitCreate(ev) {
    ev.preventDefault(); if (!validateCreateForm()) return;
    try {
      setSavingCreate(true); setMsg("");
      const payload={ vehicle_id:Number(createForm.vehicle_id), start_date:createForm.start_date, end_date:createForm.end_date, pickup_method:createForm.pickup_method, delivery_address:createForm.pickup_method==="delivery"?createForm.delivery_address.trim():null, notes:createForm.notes?.trim()||null, direct_approve:!!createForm.direct_approve, payment_deadline_hours:Number(createForm.payment_deadline_hours) };
      if (customerMode==="registered") payload.user_id=createForm.user_id;
      else { payload.customer_name=createForm.customer_name.trim(); payload.customer_phone=createForm.customer_phone.trim(); payload.customer_email=createForm.customer_email?.trim()||null; }
      await api.post("/admin/rentals",payload);
      setOpenCreate(false); resetCreateForm(); await fetchRentals();
    } catch(err) {
      if (err.response?.status===422) { const m={}; Object.keys(err.response.data?.errors||{}).forEach(k=>{m[k]=Array.isArray(err.response.data.errors[k])?err.response.data.errors[k][0]:err.response.data.errors[k];}); setCreateErrors(m); }
      setMsg(err.response?.data?.message||"Terjadi kesalahan.");
    } finally { setSavingCreate(false); }
  }
  function openEditModal(row) {
    const so=getAllowedStatusOptions(row), po=getAllowedPaymentStatusOptions(row);
    setSelectedRow(row); setEditForm({ status:so.includes(row.status)?row.status:so[0], payment_status:po.includes(row.payment_status)?row.payment_status:po[0], payment_type:"full", payment_method:"transfer", amount:"", notes:"" }); setOpenEdit(true);
  }
  function closeEditModal() { setOpenEdit(false); setSelectedRow(null); setEditForm({ status:"", payment_status:"", payment_type:"full", payment_method:"transfer", amount:"", notes:"" }); }
  function handleEditChange(e) { const {name,value}=e.target; setEditForm(prev=>({...prev,[name]:value,...(name==="status"&&value==="paid"?{payment_status:"paid"}:{})})); }
  async function handleSaveEdit(ev) {
    ev.preventDefault(); if (!selectedRow) return;
    try { setSavingEdit(true); setMsg(""); await api.patch(`/admin/rentals/${selectedRow.id}/update-status-payment`,{ status:editForm.status, payment_status:editForm.payment_status, payment_type:"full", payment_method:editForm.payment_method, amount:editForm.amount?Number(editForm.amount):0, notes:editForm.notes||null }); closeEditModal(); await fetchRentals(); }
    catch(err) { setMsg(err.response?.data?.message||"Gagal memperbarui rental."); } finally { setSavingEdit(false); }
  }
  async function handleMarkOngoing(row) { try { setMsg(""); await api.patch(`/admin/rentals/${row.id}/mark-ongoing`); await fetchRentals(); } catch(err) { setMsg(err.response?.data?.message||"Gagal."); } }
  async function handleComplete(row) { try { setMsg(""); await api.patch(`/admin/rentals/${row.id}/complete`); await fetchRentals(); } catch(err) { setMsg(err.response?.data?.message||"Gagal."); } }

  return (
    <div className="space-y-4">
      {msg && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p className="text-[13px] text-red-600">{msg}</p>
        </div>
      )}

      <DataTable
        title={`Penyewaan ${type==="mobil"?"Mobil":"Motor"}`}
        subtitle="Kelola booking, pembayaran, dan status penyewaan."
        searchValue={q} onSearchChange={setQ}
        onCreate={() => { resetCreateForm(); setOpenCreate(true); }}
        createLabel="+ Tambah" columns={columns} rows={filteredRows} loading={loading} showActions
        renderCell={({ row, col }) => {
          const nm=row.user?.full_name||row.manual_customer?.customer_name||"-";
          const kt=row.user?.email||row.user?.phone_number||row.manual_customer?.customer_phone||row.manual_customer?.customer_email||"-";
          if (col.key==="penyewa") return <div><p className="text-[13px] font-medium text-gray-800">{nm}</p><p className="text-[11.5px] text-gray-400">{kt}</p></div>;
          if (col.key==="kendaraan") return <div><p className="text-[13px] font-medium text-gray-800">{row.vehicle?.name||"-"}</p><p className="text-[11.5px] text-gray-400">{row.vehicle?.plate_number||"-"}</p></div>;
          if (col.key==="periode") return <div><p className="text-[12.5px] text-gray-700">{formatDateTime(row.start_date)}</p><p className="text-[11.5px] text-gray-400">s/d {formatDateTime(row.end_date)}</p></div>;
          if (col.key==="pickup_method") return <div><p className="text-[12.5px] font-medium text-gray-700">{getPickupMethodLabel(row.pickup_method)}</p>{row.pickup_method==="delivery"&&row.delivery_address&&<p className="text-[11.5px] text-gray-400 truncate max-w-[140px]">{row.delivery_address}</p>}</div>;
          if (col.key==="total_price") return <span className="text-[12.5px] font-medium text-gray-800">{formatCurrency(row.total_price)}</span>;
          if (col.key==="status") return <Badge color={getStatusColor(row.status)}>{getRentalStatusLabel(row.status)}</Badge>;
          if (col.key==="payment_status") return <Badge color={getPaymentStatusColor(row.payment_status)}>{getPaymentStatusLabel(row.payment_status)}</Badge>;
          return <span className="text-[12.5px] text-gray-700">{String(row[col.key]??"")}</span>;
        }}
        actionsRender={({ row }) => (
          <div className="flex flex-wrap gap-1.5">
            <ActionBtn onClick={() => openEditModal(row)}>Edit</ActionBtn>
            {["paid"].includes(String(row.status||"").toLowerCase()) && <ActionBtn onClick={() => handleMarkOngoing(row)} variant="blue">Mulai</ActionBtn>}
            {["ongoing","overdue"].includes(String(row.status||"").toLowerCase()) && <ActionBtn onClick={() => handleComplete(row)} variant="green">Selesaikan</ActionBtn>}
          </div>
        )}
      />

      {/* ── Modal Tambah ─────────────────────────────────────────────── */}
      <Modal open={openCreate} size="lg" title={`Tambah Penyewaan ${type==="mobil"?"Mobil":"Motor"}`} onClose={() => { setOpenCreate(false); resetCreateForm(); }}>
        <form onSubmit={handleSubmitCreate} className="space-y-5">
          <div>
            <FieldLabel>Mode Penyewa</FieldLabel>
            <div className="flex gap-2">
              {["registered","manual"].map(m => (
                <button key={m} type="button" onClick={() => handleCustomerModeChange(m)}
                  className={`rounded-lg border px-3.5 py-1.5 text-[12.5px] font-medium transition ${customerMode===m?"border-indigo-500 bg-indigo-600 text-white":"border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}>
                  {m==="registered"?"User Terdaftar":"Input Manual"}
                </button>
              ))}
            </div>
          </div>
          <SectionDivider label="Informasi Penyewa" />
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            {customerMode==="registered" ? (
              <div className="md:col-span-2"><FieldLabel required>Pilih User</FieldLabel>
                <select name="user_id" value={createForm.user_id} onChange={handleCreateChange} disabled={loadingUsers||savingCreate} className={inputCls(!!createErrors.user_id)}>
                  <option value="">{loadingUsers?"Memuat...":"— Pilih User —"}</option>
                  {users.map(u=><option key={u.id} value={u.id}>{u.full_name} — {u.email||u.phone_number}</option>)}
                </select><FieldError msg={createErrors.user_id} /></div>
            ) : (<>
              <div><FieldLabel required>Nama Penyewa</FieldLabel><input type="text" name="customer_name" value={createForm.customer_name} onChange={handleCreateChange} placeholder="Masukkan nama" disabled={savingCreate} className={inputCls(!!createErrors.customer_name)} /><FieldError msg={createErrors.customer_name} /></div>
              <div><FieldLabel required>Nomor Telepon</FieldLabel><input type="text" name="customer_phone" value={createForm.customer_phone} onChange={handleCreateChange} placeholder="08xxxxxxxxxx" disabled={savingCreate} className={inputCls(!!createErrors.customer_phone)} /><FieldError msg={createErrors.customer_phone} /></div>
              <div className="md:col-span-2"><FieldLabel>Email</FieldLabel><input type="email" name="customer_email" value={createForm.customer_email} onChange={handleCreateChange} placeholder="email@contoh.com" disabled={savingCreate} className={inputCls(!!createErrors.customer_email)} /><FieldError msg={createErrors.customer_email} /></div>
            </>)}
          </div>
          <SectionDivider label="Kendaraan & Waktu" />
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            <div className="md:col-span-2"><FieldLabel required>Pilih Kendaraan</FieldLabel>
              <select name="vehicle_id" value={createForm.vehicle_id} onChange={handleCreateChange} disabled={loadingVehicles||savingCreate} className={inputCls(!!createErrors.vehicle_id)}>
                <option value="">{loadingVehicles?"Memuat...":"— Pilih Kendaraan —"}</option>
                {vehicles.map(v=><option key={v.id} value={v.id}>{v.name} — {v.plate_number} — Rp {Number(v.daily_rate||0).toLocaleString("id-ID")}/hari</option>)}
              </select><FieldError msg={createErrors.vehicle_id} /></div>
            <div><FieldLabel required>Mulai Sewa</FieldLabel><input type="datetime-local" name="start_date" value={normalizeDateTimeLocal(createForm.start_date)} onChange={handleCreateChange} disabled={savingCreate} className={inputCls(!!createErrors.start_date)} /><FieldError msg={createErrors.start_date} /></div>
            <div><FieldLabel required>Selesai Sewa</FieldLabel><input type="datetime-local" name="end_date" value={normalizeDateTimeLocal(createForm.end_date)} onChange={handleCreateChange} disabled={savingCreate} className={inputCls(!!createErrors.end_date)} /><FieldError msg={createErrors.end_date} /></div>
          </div>
          <SectionDivider label="Pengambilan & Pembayaran" />
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            <div><FieldLabel required>Metode Pengambilan</FieldLabel>
              <select name="pickup_method" value={createForm.pickup_method} onChange={handleCreateChange} disabled={savingCreate} className={inputCls(!!createErrors.pickup_method)}>
                <option value="pickup">Diambil sendiri</option><option value="delivery">Diantar</option>
              </select><FieldError msg={createErrors.pickup_method} /></div>
            <div><FieldLabel required>Batas Pembayaran (jam)</FieldLabel><input type="number" min="1" name="payment_deadline_hours" value={createForm.payment_deadline_hours} onChange={handleCreateChange} disabled={savingCreate} className={inputCls(!!createErrors.payment_deadline_hours)} /><FieldError msg={createErrors.payment_deadline_hours} /></div>
            {createForm.pickup_method==="delivery" && <div className="md:col-span-2"><FieldLabel required>Alamat Pengantaran</FieldLabel><textarea name="delivery_address" value={createForm.delivery_address} onChange={handleCreateChange} rows={3} placeholder="Alamat lengkap pengantaran" disabled={savingCreate} className={inputCls(!!createErrors.delivery_address)} /><FieldError msg={createErrors.delivery_address} /></div>}
            <div className="md:col-span-2"><FieldLabel>Catatan</FieldLabel><textarea name="notes" value={createForm.notes} onChange={handleCreateChange} rows={3} placeholder="Catatan tambahan (opsional)" disabled={savingCreate} className={inputCls(false)} /></div>
            <div className="md:col-span-2">
              <label className="inline-flex cursor-pointer items-center gap-2.5">
                <div className="relative flex-shrink-0" style={{width:32,height:18}}>
                  <input type="checkbox" name="direct_approve" checked={createForm.direct_approve} onChange={handleCreateChange} disabled={savingCreate} className="sr-only peer" />
                  <div className="absolute inset-0 rounded-full bg-gray-300 transition peer-checked:bg-indigo-500" />
                  <div className="absolute top-0.5 left-0.5 rounded-full bg-white transition-transform" style={{width:14,height:14,transform:createForm.direct_approve?"translateX(14px)":"translateX(0)"}} />
                </div>
                <span className="text-[12.5px] text-gray-600">Langsung setujui saat dibuat admin</span>
              </label>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
            <button type="button" onClick={() => { setOpenCreate(false); resetCreateForm(); }} className="rounded-lg border border-gray-200 px-4 py-2 text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition">Batal</button>
            <button type="submit" disabled={savingCreate} className="rounded-lg bg-indigo-600 px-5 py-2 text-[13px] font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition">{savingCreate?"Menyimpan...":"Simpan Penyewaan"}</button>
          </div>
        </form>
      </Modal>

      {/* ── Modal Edit ───────────────────────────────────────────────── */}
      <Modal open={openEdit} size="md" title="Edit Status Rental & Pembayaran" onClose={closeEditModal}>
        {selectedRow && (
          <form onSubmit={handleSaveEdit} className="space-y-4">

            {/* ── Redesigned info card ── */}
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              {/* Card header */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Informasi Penyewaan</p>
                <span className="text-[11px] font-mono font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  {selectedRow.booking_code}
                </span>
              </div>

              {/* Info rows */}
              <div className="bg-white divide-y divide-gray-50">
                <InfoRow icon={Ico.user} label="Penyewa">
                  {selectedRow.user?.full_name || selectedRow.manual_customer?.customer_name || "-"}
                </InfoRow>

                <InfoRow icon={Ico.phone} label="Nomor HP">
                  {selectedRow.user?.phone_number || selectedRow.manual_customer?.customer_phone || "-"}
                </InfoRow>

                {selectedRow.user?.address && (
                  <InfoRow icon={Ico.map} label="Alamat Penyewa">
                    {selectedRow.user.address}
                  </InfoRow>
                )}

                <InfoRow icon={Ico.car} label="Kendaraan">
                  {selectedRow.vehicle?.name || "-"}
                </InfoRow>

                <InfoRow icon={Ico.box} label="Pengambilan">
                  <span>{getPickupMethodLabel(selectedRow.pickup_method)}</span>
                  {selectedRow.pickup_method==="delivery" && selectedRow.delivery_address && (
                    <p className="text-[11.5px] text-gray-400 mt-0.5 font-normal">{selectedRow.delivery_address}</p>
                  )}
                </InfoRow>

                <InfoRow icon={Ico.money} label="Total Tagihan">
                  <span className="text-[13px] font-semibold text-gray-900">{formatCurrency(selectedRow.total_price)}</span>
                </InfoRow>

                {/* Status pills row */}
                <div className="flex items-center gap-3 px-4 py-2.5">
                  <span className="w-3.5 flex-shrink-0 text-gray-400">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </span>
                  <span className="w-36 flex-shrink-0 text-[11.5px] text-gray-400">Status Saat Ini</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge color={getStatusColor(selectedRow.status)}>{getRentalStatusLabel(selectedRow.status)}</Badge>
                    <span className="text-gray-300">·</span>
                    <Badge color={getPaymentStatusColor(selectedRow.payment_status)}>{getPaymentStatusLabel(selectedRow.payment_status)}</Badge>
                  </div>
                </div>
              </div>
            </div>

            <SectionDivider label="Ubah Status & Pembayaran" />

            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
              <div><FieldLabel>Status Rental</FieldLabel>
                <select name="status" value={editForm.status} onChange={handleEditChange} className={inputCls(false)}>
                  {getAllowedStatusOptions(selectedRow).map(s=><option key={s} value={s}>{getRentalStatusLabel(s)}</option>)}
                </select></div>
              <div><FieldLabel>Status Pembayaran</FieldLabel>
                <select name="payment_status" value={editForm.payment_status} onChange={handleEditChange} className={inputCls(false)}>
                  {getAllowedPaymentStatusOptions(selectedRow).map(s=><option key={s} value={s}>{getPaymentStatusLabel(s)}</option>)}
                </select></div>
              <div><FieldLabel>Tipe Pembayaran</FieldLabel>
                <select name="payment_type" value={editForm.payment_type} onChange={handleEditChange} className={inputCls(false)}><option value="full">Full</option></select></div>
              <div><FieldLabel>Metode Pembayaran</FieldLabel>
                <select name="payment_method" value={editForm.payment_method} onChange={handleEditChange} className={inputCls(false)}>
                  <option value="transfer">Transfer</option><option value="cash">Cash</option>
                </select></div>
              <div><FieldLabel>Nominal Pembayaran</FieldLabel>
                <input type="number" name="amount" min="0" value={editForm.amount} onChange={handleEditChange} placeholder="0" className={inputCls(false)} /></div>
              <div className="md:col-span-2"><FieldLabel>Catatan Perubahan</FieldLabel>
                <textarea name="notes" rows={3} value={editForm.notes} onChange={handleEditChange} placeholder="Catatan perubahan status / pembayaran (opsional)" className={inputCls(false)} /></div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
              <button type="button" onClick={closeEditModal} className="rounded-lg border border-gray-200 px-4 py-2 text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition">Batal</button>
              <button type="submit" disabled={savingEdit} className="rounded-lg bg-indigo-600 px-5 py-2 text-[13px] font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition">{savingEdit?"Menyimpan...":"Simpan Perubahan"}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}