import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../../Components/Public/Header";
import Footer from "../../Components/Public/Footer";

const IMAGE_BASE = "http://localhost:8000/storage/";

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("id-ID");
}

function diffDaysInclusive(start, end) {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 0;
  const oneDay = 1000 * 60 * 60 * 24;
  const diff = Math.floor((endDate - startDate) / oneDay) + 1;
  return diff > 0 ? diff : 0;
}

function getAuthUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

const inputStyle = {
  width: "100%",
  padding: "8px 12px",
  fontSize: "13px",
  color: "#1A1A1A",
  backgroundColor: "#FAFAFA",
  border: "1px solid #DDDDDD",
  borderRadius: "0",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const labelStyle = {
  display: "block",
  fontSize: "10px",
  fontWeight: "700",
  color: "#888888",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  marginBottom: "5px",
};

export default function SewaMobil() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [form, setForm] = useState({
    start_date: "",
    end_date: "",
    pickup_method: "pickup",
    delivery_address: "",
    notes: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");

  const authUser = getAuthUser();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const loadDetail = async () => {
      try {
        setLoading(true);
        setPageError("");
        const res = await fetch("http://localhost:8000/api/public/vehicles?type=MOBIL");
        if (!res.ok) throw new Error("Gagal memuat data mobil");
        const data = await res.json();
        const rows = Array.isArray(data) ? data : data?.data || [];
        const selectedCar = rows.find((item) => String(item.id) === String(id));
        if (!selectedCar) throw new Error("Mobil tidak ditemukan");
        setCar(selectedCar);
      } catch (err) {
        setPageError(err.message || "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };
    loadDetail();
  }, [id]);

  const totalDays = useMemo(() => diffDaysInclusive(form.start_date, form.end_date), [form.start_date, form.end_date]);
  const totalPrice = useMemo(() => {
    if (!car) return 0;
    return totalDays * Number(car.daily_rate || 0);
  }, [car, totalDays]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "pickup_method" && value === "pickup" ? { delivery_address: "" } : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setSubmitError("");
      setSubmitMessage("");
      if (!token) throw new Error("Silakan login terlebih dahulu");
      if (!authUser || authUser.role !== "customer") throw new Error("Akun customer tidak ditemukan");
      if (!car) throw new Error("Data mobil belum tersedia");
      if (!form.start_date || !form.end_date) throw new Error("Tanggal sewa wajib diisi");
      if (totalDays <= 0) throw new Error("Rentang tanggal tidak valid");
      if (form.pickup_method === "delivery" && !form.delivery_address.trim())
        throw new Error("Alamat pengantaran wajib diisi");

      const payload = {
        vehicle_id: car.id,
        start_date: form.start_date,
        end_date: form.end_date,
        pickup_method: form.pickup_method,
        delivery_address: form.pickup_method === "delivery" ? form.delivery_address.trim() : null,
        notes: form.notes.trim(),
      };

      const res = await fetch("http://localhost:8000/api/my-rentals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Gagal mengajukan sewa");

      setSubmitMessage(data?.message || "Pengajuan sewa berhasil dibuat");
      setForm({ start_date: "", end_date: "", pickup_method: "pickup", delivery_address: "", notes: "" });
      setTimeout(() => navigate("/mobil"), 1200);
    } catch (err) {
      setSubmitError(err.message || "Terjadi kesalahan saat mengajukan sewa");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Header />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: "13px", color: "#888888", letterSpacing: "0.05em" }}>Memuat data...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (pageError) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Header />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: "13px", color: "#C8102E", fontWeight: "600" }}>{pageError}</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#F0F0F0",
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      <Header />

      <main style={{ flex: 1, padding: "28px 20px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

          {/* Page breadcrumb/title */}
          <div
            style={{
              borderLeft: "4px solid #C8102E",
              paddingLeft: "12px",
              marginBottom: "20px",
            }}
          >
            <p style={{ fontSize: "11px", color: "#AAAAAA", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "2px" }}>
              Sewa Kendaraan
            </p>
            <h1 style={{ fontSize: "16px", fontWeight: "700", color: "#1A1A1A", letterSpacing: "0.04em", textTransform: "uppercase", margin: 0 }}>
              Formulir Pengajuan Sewa Mobil
            </h1>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

            {/* LEFT — Vehicle detail */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E0E0E0",
                borderTop: "3px solid #1A1A1A",
                overflow: "hidden",
              }}
            >
              {/* Image */}
              <div style={{ height: "260px", backgroundColor: "#EEEEEE", overflow: "hidden" }}>
                <img
                  src={car.image ? IMAGE_BASE + car.image : "/placeholder-car.jpg"}
                  alt={car.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>

              {/* Info */}
              <div style={{ padding: "20px" }}>
                <h2
                  style={{
                    fontSize: "16px",
                    fontWeight: "800",
                    color: "#1A1A1A",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    margin: "0 0 4px 0",
                  }}
                >
                  {car.name}
                </h2>
                <p style={{ fontSize: "12px", color: "#888888", margin: "0 0 14px 0" }}>
                  {car.vehicle_brand_name}
                  {car.transmission_name ? ` · ${car.transmission_name}` : ""}
                </p>

                {/* Price highlight */}
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "baseline",
                    gap: "4px",
                    padding: "6px 14px",
                    backgroundColor: "#C8102E",
                    marginBottom: "16px",
                  }}
                >
                  <span style={{ fontSize: "16px", fontWeight: "800", color: "#FFFFFF" }}>
                    Rp {formatCurrency(car.daily_rate)}
                  </span>
                  <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.75)", fontWeight: "500" }}>/ hari</span>
                </div>

                {/* Specs */}
                <div
                  style={{
                    borderTop: "1px solid #EEEEEE",
                    paddingTop: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {[
                    { label: "Nomor Plat", value: car.plate_number || "-" },
                    { label: "Tahun", value: car.year || "-" },
                    { label: "Warna", value: car.color || "-" },
                  ].map((spec) => (
                    <div key={spec.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "11px", color: "#999999", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: "600" }}>
                        {spec.label}
                      </span>
                      <span style={{ fontSize: "12px", color: "#1A1A1A", fontWeight: "600" }}>
                        {spec.value}
                      </span>
                    </div>
                  ))}

                  {car.description && (
                    <div style={{ marginTop: "4px", paddingTop: "10px", borderTop: "1px solid #F0F0F0" }}>
                      <p style={{ fontSize: "11px", color: "#888888", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: "600", marginBottom: "4px" }}>
                        Deskripsi
                      </p>
                      <p style={{ fontSize: "12px", color: "#555555", lineHeight: "1.6" }}>{car.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT — Booking form */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E0E0E0",
                borderTop: "3px solid #C8102E",
              }}
            >
              {/* Form header */}
              <div
                style={{
                  padding: "14px 20px",
                  borderBottom: "1px solid #EEEEEE",
                  backgroundColor: "#FAFAFA",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    width: "6px",
                    height: "6px",
                    backgroundColor: "#C8102E",
                    flexShrink: 0,
                  }}
                />
                <p style={{ fontSize: "11px", fontWeight: "700", color: "#1A1A1A", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
                  Ajukan Sewa
                </p>
              </div>

              <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>

                {/* Customer info */}
                <div
                  style={{
                    backgroundColor: "#F5F5F5",
                    border: "1px solid #E8E8E8",
                    borderLeft: "3px solid #888888",
                    padding: "10px 14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <p style={{ fontSize: "10px", fontWeight: "700", color: "#888888", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>
                    Data Penyewa
                  </p>
                  {[
                    { label: "Nama", value: authUser?.full_name || "-" },
                    { label: "Nomor HP", value: authUser?.phone_number || "-" },
                    { label: "Email", value: authUser?.email || "-" },
                  ].map((item) => (
                    <div key={item.label} style={{ display: "flex", gap: "8px", fontSize: "12px" }}>
                      <span style={{ color: "#999999", minWidth: "70px", fontWeight: "600" }}>{item.label}</span>
                      <span style={{ color: "#1A1A1A" }}>{item.value}</span>
                    </div>
                  ))}
                </div>

                {/* Error / Success */}
                {submitError && (
                  <div
                    style={{
                      padding: "9px 14px",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#C8102E",
                      backgroundColor: "#FFF5F5",
                      border: "1px solid #F5CCCC",
                      borderLeft: "4px solid #C8102E",
                    }}
                  >
                    {submitError}
                  </div>
                )}
                {submitMessage && (
                  <div
                    style={{
                      padding: "9px 14px",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#1A7A40",
                      backgroundColor: "#F5FFF8",
                      border: "1px solid #BBDDCC",
                      borderLeft: "4px solid #1A7A40",
                    }}
                  >
                    {submitMessage}
                  </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

                  {/* Date row */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={labelStyle}>Tanggal Mulai</label>
                      <input
                        type="date"
                        name="start_date"
                        value={form.start_date}
                        onChange={handleChange}
                        style={inputStyle}
                        onFocus={(e) => { e.target.style.borderColor = "#C8102E"; e.target.style.backgroundColor = "#FFFFFF"; }}
                        onBlur={(e) => { e.target.style.borderColor = "#DDDDDD"; e.target.style.backgroundColor = "#FAFAFA"; }}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Tanggal Selesai</label>
                      <input
                        type="date"
                        name="end_date"
                        value={form.end_date}
                        onChange={handleChange}
                        style={inputStyle}
                        onFocus={(e) => { e.target.style.borderColor = "#C8102E"; e.target.style.backgroundColor = "#FFFFFF"; }}
                        onBlur={(e) => { e.target.style.borderColor = "#DDDDDD"; e.target.style.backgroundColor = "#FAFAFA"; }}
                      />
                    </div>
                  </div>

                  {/* Pickup method */}
                  <div>
                    <label style={labelStyle}>Metode Pengambilan</label>
                    <select
                      name="pickup_method"
                      value={form.pickup_method}
                      onChange={handleChange}
                      style={{ ...inputStyle, cursor: "pointer" }}
                      onFocus={(e) => { e.target.style.borderColor = "#C8102E"; }}
                      onBlur={(e) => { e.target.style.borderColor = "#DDDDDD"; }}
                    >
                      <option value="pickup">Diambil Sendiri</option>
                      <option value="delivery">Diantar ke Lokasi</option>
                    </select>
                  </div>

                  {/* Delivery address */}
                  {form.pickup_method === "delivery" && (
                    <div>
                      <label style={labelStyle}>Alamat Pengantaran</label>
                      <textarea
                        name="delivery_address"
                        value={form.delivery_address}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Masukkan alamat pengantaran lengkap"
                        style={{ ...inputStyle, resize: "vertical" }}
                        onFocus={(e) => { e.target.style.borderColor = "#C8102E"; e.target.style.backgroundColor = "#FFFFFF"; }}
                        onBlur={(e) => { e.target.style.borderColor = "#DDDDDD"; e.target.style.backgroundColor = "#FAFAFA"; }}
                      />
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label style={labelStyle}>Catatan Tambahan</label>
                    <textarea
                      name="notes"
                      value={form.notes}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Catatan untuk admin (opsional)"
                      style={{ ...inputStyle, resize: "vertical" }}
                      onFocus={(e) => { e.target.style.borderColor = "#C8102E"; e.target.style.backgroundColor = "#FFFFFF"; }}
                      onBlur={(e) => { e.target.style.borderColor = "#DDDDDD"; e.target.style.backgroundColor = "#FAFAFA"; }}
                    />
                  </div>

                  {/* Price summary */}
                  <div
                    style={{
                      border: "1px solid #E0E0E0",
                      borderTop: "2px solid #1A1A1A",
                      backgroundColor: "#FAFAFA",
                    }}
                  >
                    <div style={{ borderBottom: "1px solid #EEEEEE" }}>
                      {[
                        { label: "Harga per hari", value: `Rp ${formatCurrency(car.daily_rate)}` },
                        { label: "Total hari", value: `${totalDays} hari` },
                      ].map((row) => (
                        <div
                          key={row.label}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "8px 14px",
                            fontSize: "12px",
                            color: "#555555",
                            borderBottom: "1px solid #F0F0F0",
                          }}
                        >
                          <span>{row.label}</span>
                          <span style={{ fontWeight: "600", color: "#1A1A1A" }}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 14px",
                        backgroundColor: "#1A1A1A",
                      }}
                    >
                      <span style={{ fontSize: "11px", fontWeight: "700", color: "#AAAAAA", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        Estimasi Total
                      </span>
                      <span style={{ fontSize: "15px", fontWeight: "800", color: "#FFFFFF" }}>
                        Rp {formatCurrency(totalPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Info notice */}
                  <div
                    style={{
                      padding: "10px 14px",
                      fontSize: "11px",
                      color: "#7A6500",
                      backgroundColor: "#FFFBEA",
                      border: "1px solid #E8D870",
                      borderLeft: "4px solid #C8A800",
                      lineHeight: "1.6",
                    }}
                  >
                    Setelah pengajuan dikirim, admin akan meninjau terlebih dahulu. Pembayaran dilakukan setelah pengajuan disetujui.
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: "8px", paddingTop: "4px" }}>
                    <button
                      type="button"
                      onClick={() => navigate(-1)}
                      style={{
                        padding: "9px 18px",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#555555",
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #CCCCCC",
                        cursor: "pointer",
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                      }}
                    >
                      ← Kembali
                    </button>

                    <button
                      type="submit"
                      disabled={submitting}
                      style={{
                        flex: 1,
                        padding: "9px 18px",
                        fontSize: "12px",
                        fontWeight: "700",
                        color: "#FFFFFF",
                        backgroundColor: submitting ? "#999999" : "#C8102E",
                        border: "none",
                        cursor: submitting ? "not-allowed" : "pointer",
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                      }}
                    >
                      {submitting ? "Memproses..." : "Ajukan Sewa"}
                    </button>
                  </div>
                </form>
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}