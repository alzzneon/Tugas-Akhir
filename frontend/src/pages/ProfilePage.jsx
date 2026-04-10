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
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>

      <div className="relative">
        {Icon && (
          <Icon
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
        )}

        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 disabled:bg-gray-50 disabled:text-gray-500"
          style={Icon ? { paddingLeft: "2.6rem" } : undefined}
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
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>

      <div className="relative">
        {Icon && (
          <Icon
            size={18}
            className="pointer-events-none absolute left-3 top-4 text-gray-400"
          />
        )}

        <textarea
          name={name}
          value={value}
          onChange={onChange}
          rows={rows}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 disabled:bg-gray-50 disabled:text-gray-500"
          style={Icon ? { paddingLeft: "2.6rem" } : undefined}
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
      setErrorMessage("");

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
        localStorage.removeItem("token");
        localStorage.removeItem("admin_user");
        navigate("/admin/login", { replace: true });
        return;
      }

      setErrorMessage(error.message || "Gagal memuat profile");
    } finally {
      setLoading(false);
    }
  }

  function handleProfileChange(e) {
    const { name, value } = e.target;
    setProfileMessage("");
    setErrorMessage("");

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handlePasswordChange(e) {
    const { name, value } = e.target;
    setPasswordMessage("");
    setErrorMessage("");

    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleProfileSubmit(e) {
    e.preventDefault();

    try {
      setSavingProfile(true);
      setProfileMessage("");
      setErrorMessage("");

      await adminFetch("/api/profile", {
        method: "PUT",
        body: JSON.stringify({
          full_name: form.full_name,
          email: form.email,
          phone_number: form.phone_number,
          address: form.address,
          birth_place: form.birth_place,
          birth_date: form.birth_date || null,
        }),
      });

      setProfileMessage("Profile berhasil diperbarui.");
      fetchProfile();
    } catch (error) {
      setErrorMessage(error.message || "Gagal memperbarui profile");
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
      setPasswordMessage("");
      setErrorMessage("");

      await adminFetch("/api/profile/password", {
        method: "PUT",
        body: JSON.stringify({
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password,
          new_password_confirmation: passwordForm.new_password_confirmation,
        }),
      });

      setPasswordMessage("Password berhasil diperbarui.");
      setPasswordForm({
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
      });
    } catch (error) {
      setErrorMessage(error.message || "Gagal memperbarui password");
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
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 px-4 py-8 md:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-48 rounded bg-gray-200" />
              <div className="h-4 w-72 rounded bg-gray-100" />
              <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="h-14 rounded-2xl bg-gray-100" />
                <div className="h-14 rounded-2xl bg-gray-100" />
                <div className="h-14 rounded-2xl bg-gray-100" />
                <div className="h-14 rounded-2xl bg-gray-100" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 px-4 py-8 md:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="h-24 bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500" />

          <div className="px-6 pb-6">
            <div className="-mt-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl border-4 border-white bg-white shadow-md">
                  <User size={34} className="text-indigo-600" />
                </div>

                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    Profile
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Kelola data akun dan ubah password Anda
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <ArrowLeft size={18} />
                  Kembali
                </button>

                <div className="inline-flex items-center gap-2 rounded-2xl bg-indigo-50 px-4 py-2.5 text-sm font-medium capitalize text-indigo-700">
                  <ShieldCheck size={18} />
                  {roleLabel}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {profileMessage && (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {profileMessage}
          </div>
        )}

        {passwordMessage && (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {passwordMessage}
          </div>
        )}

        {/* Profile Form */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
              <User size={20} />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Edit Profile
              </h2>
              <p className="text-sm text-gray-500">
                Perbarui informasi pribadi Anda di bawah ini.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleProfileSubmit}
            className="grid grid-cols-1 gap-5 md:grid-cols-2"
          >
            <div className="md:col-span-2">
              <InputField
                label="Nama Lengkap"
                name="full_name"
                value={form.full_name}
                onChange={handleProfileChange}
                placeholder="Masukkan nama lengkap"
                icon={User}
              />
            </div>

            <InputField
              label="Email"
              name="email"
              value={form.email}
              onChange={handleProfileChange}
              type="email"
              placeholder="Masukkan email"
              icon={Mail}
            />

            <InputField
              label="Nomor Telepon"
              name="phone_number"
              value={form.phone_number}
              onChange={handleProfileChange}
              placeholder="Masukkan nomor telepon"
              icon={Phone}
            />

            <InputField
              label="Tempat Lahir"
              name="birth_place"
              value={form.birth_place}
              onChange={handleProfileChange}
              placeholder="Masukkan tempat lahir"
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

            <div className="md:col-span-2">
              <TextareaField
                label="Alamat"
                name="address"
                value={form.address}
                onChange={handleProfileChange}
                placeholder="Masukkan alamat lengkap"
                icon={MapPin}
                rows={4}
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={18} />
                {savingProfile ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </div>

        {/* Password Form */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-gray-100 p-3 text-gray-700">
              <KeyRound size={20} />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Ubah Password
              </h2>
              <p className="text-sm text-gray-500">
                Gunakan password yang kuat dan mudah Anda ingat.
              </p>
            </div>
          </div>

          <form
            onSubmit={handlePasswordSubmit}
            className="grid grid-cols-1 gap-5 md:grid-cols-3"
          >
            <InputField
              label="Password Saat Ini"
              name="current_password"
              value={passwordForm.current_password}
              onChange={handlePasswordChange}
              type="password"
              placeholder="Masukkan password saat ini"
            />

            <InputField
              label="Password Baru"
              name="new_password"
              value={passwordForm.new_password}
              onChange={handlePasswordChange}
              type="password"
              placeholder="Masukkan password baru"
            />

            <InputField
              label="Konfirmasi Password Baru"
              name="new_password_confirmation"
              value={passwordForm.new_password_confirmation}
              onChange={handlePasswordChange}
              type="password"
              placeholder="Ulangi password baru"
            />

            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={savingPassword}
                className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                <KeyRound size={18} />
                {savingPassword ? "Menyimpan..." : "Ubah Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}