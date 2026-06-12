import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  Save,
  User,
  CalendarDays,
  MapPinned,
  ShieldCheck,
} from "lucide-react";
import { adminFetch } from "../lib/adminFetch";

function InputField({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder = "",
  icon: Icon,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label
        style={{
          fontSize: "10px",
          fontWeight: "700",
          color: "#888888",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
        }}
      >
        {label}
      </label>
      <div style={{ position: "relative" }}>
        {Icon && (
          <Icon
            size={15}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#AAAAAA",
              pointerEvents: "none",
            }}
          />
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={{
            width: "100%",
            paddingTop: "9px",
            paddingBottom: "9px",
            paddingLeft: Icon ? "36px" : "12px",
            paddingRight: "12px",
            fontSize: "13px",
            color: "#1A1A1A",
            backgroundColor: "#FAFAFA",
            border: "1px solid #DDDDDD",
            borderRadius: "0",
            outline: "none",
            boxSizing: "border-box",
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#C8102E";
            e.target.style.backgroundColor = "#FFFFFF";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#DDDDDD";
            e.target.style.backgroundColor = "#FAFAFA";
          }}
        />
      </div>
    </div>
  );
}

function TextareaField({
  label,
  name,
  value,
  onChange,
  rows = 4,
  placeholder = "",
  icon: Icon,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label
        style={{
          fontSize: "10px",
          fontWeight: "700",
          color: "#888888",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
        }}
      >
        {label}
      </label>
      <div style={{ position: "relative" }}>
        {Icon && (
          <Icon
            size={15}
            style={{
              position: "absolute",
              left: "12px",
              top: "12px",
              color: "#AAAAAA",
              pointerEvents: "none",
            }}
          />
        )}
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          rows={rows}
          placeholder={placeholder}
          style={{
            width: "100%",
            paddingTop: "9px",
            paddingBottom: "9px",
            paddingLeft: Icon ? "36px" : "12px",
            paddingRight: "12px",
            fontSize: "13px",
            color: "#1A1A1A",
            backgroundColor: "#FAFAFA",
            border: "1px solid #DDDDDD",
            borderRadius: "0",
            outline: "none",
            resize: "vertical",
            boxSizing: "border-box",
            fontFamily: "inherit",
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#C8102E";
            e.target.style.backgroundColor = "#FFFFFF";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#DDDDDD";
            e.target.style.backgroundColor = "#FAFAFA";
          }}
        />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    address: "",
    birth_place: "",
    birth_date: "",
    role: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      setLoading(true);
      const data = await adminFetch("/api/profile");
      setForm({
        full_name: data.full_name || "",
        email: data.email || "",
        phone_number: data.phone_number || "",
        address: data.address || "",
        birth_place: data.birth_place || "",
        birth_date: data.birth_date ? String(data.birth_date).slice(0, 10) : "",
        role: data.role || "",
      });
    } catch (error) {
      if (error.message === "UNAUTHORIZED") {
        navigate("/admin/login", { replace: true });
        return;
      }
      setErrorMessage("Gagal memuat profil.");
    } finally {
      setLoading(false);
    }
  }

  function handleProfileChange(e) {
    const { name, value } = e.target;
    setProfileMessage("");
    setErrorMessage("");
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handlePasswordChange(e) {
    const { name, value } = e.target;
    setPasswordMessage("");
    setErrorMessage("");
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleProfileSubmit(e) {
    e.preventDefault();
    try {
      setSavingProfile(true);
      await adminFetch("/api/profile", {
        method: "PUT",
        body: JSON.stringify(form),
      });
      setProfileMessage("Profil berhasil diperbarui.");
    } catch (error) {
      setErrorMessage(error.message || "Gagal memperbarui profil.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      setErrorMessage("Konfirmasi password baru tidak cocok.");
      return;
    }
    try {
      setSavingPassword(true);
      await adminFetch("/api/profile/password", {
        method: "PUT",
        body: JSON.stringify(passwordForm),
      });
      setPasswordMessage("Password berhasil diperbarui.");
      setPasswordForm({ current_password: "", new_password: "", new_password_confirmation: "" });
      setShowPasswordForm(false);
    } catch (error) {
      setErrorMessage(error.message || "Gagal memperbarui password.");
    } finally {
      setSavingPassword(false);
    }
  }

  const roleLabel = useMemo(() => {
    if (!form.role) return "User";
    return form.role.replaceAll("_", " ").toUpperCase();
  }, [form.role]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#F0F0F0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            border: "3px solid #DDDDDD",
            borderTopColor: "#C8102E",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F0F0F0",
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        paddingBottom: "48px",
      }}
    >
      {/* Page header bar */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderBottom: "2px solid #E0E0E0",
          borderLeft: "4px solid #C8102E",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "56px",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              backgroundColor: "#C8102E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <User size={15} color="#FFFFFF" />
          </div>
          <div>
            <p
              style={{
                fontSize: "13px",
                fontWeight: "700",
                color: "#1A1A1A",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                lineHeight: 1.2,
              }}
            >
              Pengaturan Profil
            </p>
            <p style={{ fontSize: "11px", color: "#999999", marginTop: "1px" }}>
              Kelola data personal dan keamanan akun
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Role badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              backgroundColor: "#FFF5F5",
              border: "1px solid #F5CCCC",
              fontSize: "10px",
              fontWeight: "700",
              color: "#C8102E",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            <ShieldCheck size={11} />
            {roleLabel}
          </div>

          <button
            onClick={() => navigate(-1)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #DDDDDD",
              fontSize: "12px",
              fontWeight: "600",
              color: "#444444",
              cursor: "pointer",
              letterSpacing: "0.03em",
            }}
          >
            <ArrowLeft size={13} />
            Kembali
          </button>
        </div>
      </div>

      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "0 24px",
        }}
      >
        {/* Notifications */}
        {(errorMessage || profileMessage || passwordMessage) && (
          <div
            style={{
              marginBottom: "20px",
              padding: "10px 16px",
              fontSize: "12px",
              fontWeight: "600",
              border: "1px solid",
              borderLeft: "4px solid",
              letterSpacing: "0.02em",
              ...(errorMessage
                ? {
                    backgroundColor: "#FFF5F5",
                    borderColor: "#F5CCCC",
                    borderLeftColor: "#C8102E",
                    color: "#C8102E",
                  }
                : {
                    backgroundColor: "#F5FFF8",
                    borderColor: "#BBDDCC",
                    borderLeftColor: "#1A7A40",
                    color: "#1A7A40",
                  }),
            }}
          >
            {errorMessage || profileMessage || passwordMessage}
          </div>
        )}

        {/* Two-column layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 340px",
            gap: "20px",
            alignItems: "start",
          }}
        >
          {/* LEFT — Personal Info */}
          <section
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E0E0E0",
              borderTop: "3px solid #C8102E",
            }}
          >
            {/* Section header */}
            <div
              style={{
                padding: "14px 20px",
                borderBottom: "1px solid #EEEEEE",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                backgroundColor: "#FAFAFA",
              }}
            >
              <User size={14} color="#C8102E" />
              <p
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  color: "#1A1A1A",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Informasi Pribadi
              </p>
            </div>

            <form onSubmit={handleProfileSubmit} style={{ padding: "20px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                }}
              >
                {/* Full name spans both columns */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <InputField
                    label="Nama Lengkap"
                    name="full_name"
                    value={form.full_name}
                    onChange={handleProfileChange}
                    icon={User}
                  />
                </div>

                <InputField
                  label="Email"
                  name="email"
                  value={form.email}
                  onChange={handleProfileChange}
                  type="email"
                  icon={Mail}
                />
                <InputField
                  label="Nomor Telepon"
                  name="phone_number"
                  value={form.phone_number}
                  onChange={handleProfileChange}
                  icon={Phone}
                />
                <InputField
                  label="Tempat Lahir"
                  name="birth_place"
                  value={form.birth_place}
                  onChange={handleProfileChange}
                  icon={MapPinned}
                />
                <InputField
                  label="Tanggal Lahir"
                  name="birth_date"
                  value={form.birth_date}
                  onChange={handleProfileChange}
                  type="date"
                  icon={CalendarDays}
                />

                <div style={{ gridColumn: "1 / -1" }}>
                  <TextareaField
                    label="Alamat Lengkap"
                    name="address"
                    value={form.address}
                    onChange={handleProfileChange}
                    icon={MapPin}
                    rows={3}
                  />
                </div>
              </div>

              <div
                style={{
                  marginTop: "20px",
                  paddingTop: "16px",
                  borderTop: "1px solid #EEEEEE",
                }}
              >
                <button
                  type="submit"
                  disabled={savingProfile}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    padding: "9px 20px",
                    backgroundColor: savingProfile ? "#E88888" : "#C8102E",
                    color: "#FFFFFF",
                    fontSize: "12px",
                    fontWeight: "700",
                    border: "none",
                    cursor: savingProfile ? "not-allowed" : "pointer",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  <Save size={14} />
                  {savingProfile ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </section>

          {/* RIGHT — Security */}
          <section
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E0E0E0",
              borderTop: "3px solid #1A1A1A",
              position: "sticky",
              top: "24px",
            }}
          >
            {/* Section header */}
            <div
              style={{
                padding: "14px 20px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                backgroundColor: "#FAFAFA",
                borderBottom: showPasswordForm ? "1px solid #EEEEEE" : "none",
              }}
            >
              <KeyRound size={14} color="#444444" />
              <p
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  color: "#1A1A1A",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  flex: 1,
                }}
              >
                Keamanan Akun
              </p>
            </div>

            {/* Trigger button — always visible */}
            {!showPasswordForm && (
              <div style={{ padding: "20px" }}>
                <p style={{ fontSize: "12px", color: "#888888", marginBottom: "14px", lineHeight: 1.6 }}>
                  Untuk menjaga keamanan akun, disarankan mengganti password secara berkala.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(true);
                    setPasswordMessage("");
                    setErrorMessage("");
                  }}
                  style={{
                    width: "100%",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "7px",
                    padding: "9px 20px",
                    backgroundColor: "#1A1A1A",
                    color: "#FFFFFF",
                    fontSize: "12px",
                    fontWeight: "700",
                    border: "none",
                    cursor: "pointer",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  <KeyRound size={14} />
                  Ubah Password
                </button>
              </div>
            )}

            {/* Password form — revealed on click */}
            {showPasswordForm && (
              <form
                onSubmit={handlePasswordSubmit}
                style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}
              >
                <InputField
                  label="Password Saat Ini"
                  name="current_password"
                  type="password"
                  value={passwordForm.current_password}
                  onChange={handlePasswordChange}
                  icon={KeyRound}
                />
                <InputField
                  label="Password Baru"
                  name="new_password"
                  type="password"
                  value={passwordForm.new_password}
                  onChange={handlePasswordChange}
                  icon={KeyRound}
                />
                <InputField
                  label="Konfirmasi Password Baru"
                  name="new_password_confirmation"
                  type="password"
                  value={passwordForm.new_password_confirmation}
                  onChange={handlePasswordChange}
                  icon={KeyRound}
                />

                <div
                  style={{
                    paddingTop: "12px",
                    borderTop: "1px solid #EEEEEE",
                    display: "flex",
                    gap: "8px",
                  }}
                >
                  <button
                    type="submit"
                    disabled={savingPassword}
                    style={{
                      flex: 1,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "7px",
                      padding: "9px 14px",
                      backgroundColor: savingPassword ? "#444444" : "#1A1A1A",
                      color: "#FFFFFF",
                      fontSize: "12px",
                      fontWeight: "700",
                      border: "none",
                      cursor: savingPassword ? "not-allowed" : "pointer",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    <KeyRound size={13} />
                    {savingPassword ? "Memperbarui..." : "Simpan"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordForm({ current_password: "", new_password: "", new_password_confirmation: "" });
                      setPasswordMessage("");
                      setErrorMessage("");
                    }}
                    style={{
                      padding: "9px 14px",
                      backgroundColor: "#FFFFFF",
                      color: "#666666",
                      fontSize: "12px",
                      fontWeight: "600",
                      border: "1px solid #DDDDDD",
                      cursor: "pointer",
                      letterSpacing: "0.03em",
                      textTransform: "uppercase",
                    }}
                  >
                    Batal
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}