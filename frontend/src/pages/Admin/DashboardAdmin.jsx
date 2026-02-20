export default function DashboardAdmin() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500">Selamat datang, {user?.name || "Admin"}</p>
      </div>
    </div>
  );
}
