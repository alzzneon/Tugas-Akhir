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
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
        {label}
      </label>
      <div className="relative group">
        {Icon && (
          <Icon
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-600 transition-colors"
          />
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition-all focus:bg-white focus:border-red-600 focus:ring-4 focus:ring-red-600/5 disabled:bg-slate-100 disabled:text-slate-400"
          style={Icon ? { paddingLeft: "3rem" } : undefined}
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
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
        {label}
      </label>
      <div className="relative group">
        {Icon && (
          <Icon
            size={18}
            className="absolute left-4 top-4 text-slate-400 group-focus-within:text-red-600 transition-colors"
          />
        )}
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          rows={rows}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition-all focus:bg-white focus:border-red-600 focus:ring-4 focus:ring-red-600/5"
          style={Icon ? { paddingLeft: "3rem" } : undefined}
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
    } catch (error) {
      setErrorMessage(error.message || "Gagal memperbarui password.");
    } finally {
      setSavingPassword(false);
    }
  }

  const roleLabel = useMemo(() => {
    if (!form.role) return "User";
    return form.role.replaceAll("_", " ");
  }, [form.role]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      {/* Dynamic Header */}
      <div className="bg-slate-900 text-white pt-16 pb-24 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
              <User size={38} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Pengaturan Profil</h1>
              <p className="text-slate-400 mt-1">Kelola data personal dan keamanan akun Anda</p>
            </div>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 transition-all text-sm font-medium border border-white/10 self-start md:self-center"
          >
            <ArrowLeft size={18} /> Kembali
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-12 space-y-8">
        {/* Role Badge */}
        <div className="flex justify-end">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100 text-slate-700 text-xs font-bold uppercase tracking-widest">
            <ShieldCheck size={14} className="text-red-600" />
            Akses: <span className="text-red-600">{roleLabel}</span>
          </div>
        </div>

        {/* Notifications */}
        {(errorMessage || profileMessage || passwordMessage) && (
          <div className={`p-4 rounded-2xl text-sm font-medium border animate-in fade-in slide-in-from-top-2 ${
            errorMessage ? "bg-red-50 border-red-100 text-red-600" : "bg-green-50 border-green-100 text-green-700"
          }`}>
            {errorMessage || profileMessage || passwordMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-50">
                <div className="p-2 bg-red-50 rounded-xl text-red-600">
                  <User size={20} />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Informasi Pribadi</h2>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <InputField label="Nama Lengkap" name="full_name" value={form.full_name} onChange={handleProfileChange} icon={User} />
                  </div>
                  <InputField label="Email Address" name="email" value={form.email} onChange={handleProfileChange} type="email" icon={Mail} />
                  <InputField label="Nomor Telepon" name="phone_number" value={form.phone_number} onChange={handleProfileChange} icon={Phone} />
                  <InputField label="Tempat Lahir" name="birth_place" value={form.birth_place} onChange={handleProfileChange} icon={MapPinned} />
                  <InputField label="Tanggal Lahir" name="birth_date" value={form.birth_date} onChange={handleProfileChange} type="date" icon={CalendarDays} />
                  <div className="md:col-span-2">
                    <TextareaField label="Alamat Lengkap" name="address" value={form.address} onChange={handleProfileChange} icon={MapPin} />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-8 py-4 text-sm font-bold text-white transition-all hover:bg-slate-900 shadow-lg shadow-red-100 disabled:opacity-50"
                  >
                    <Save size={18} />
                    {savingProfile ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            </section>
          </div>

          {/* Sidebar - Password */}
          <div className="lg:col-span-1">
            <section className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 sticky top-8">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-50">
                <div className="p-2 bg-slate-50 rounded-xl text-slate-600">
                  <KeyRound size={20} />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Keamanan</h2>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <InputField label="Password Saat Ini" name="current_password" type="password" value={passwordForm.current_password} onChange={handlePasswordChange} />
                <InputField label="Password Baru" name="new_password" type="password" value={passwordForm.new_password} onChange={handlePasswordChange} />
                <InputField label="Konfirmasi Baru" name="new_password_confirmation" type="password" value={passwordForm.new_password_confirmation} onChange={handlePasswordChange} />

                <button
                  type="submit"
                  disabled={savingPassword}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-4 text-sm font-bold text-white transition-all hover:bg-red-600 disabled:opacity-50 mt-4"
                >
                  <KeyRound size={18} />
                  {savingPassword ? "Updating..." : "Ubah Password"}
                </button>
              </form>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}