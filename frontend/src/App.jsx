import { Navigate, Route, Routes } from "react-router-dom";

// ADMIN
import LoginAdmin from "./pages/Admin/LoginAdmin";
import Dashboard from "./pages/Admin/DashboardAdmin";
import Kendaraan from "./pages/Admin/Kendaraan";
import AdminLayout from "./Layouts/AdminLayout";

import VehicleTypes from "./pages/Admin/Master/VehicleTypes";
import VehicleBrands from "./pages/Admin/Master/VehicleBrands";
import Transmissions from "./pages/Admin/Master/Transmissions";
import RentalStatuses from "./pages/Admin/Master/RentalStatuses";
import PaymentStatuses from "./pages/Admin/Master/PaymentStatuses";

import Cars from "./pages/Admin/Vehicles/Cars";
import Motorcycles from "./pages/Admin/Vehicles/Motorcycles";

// CUSTOMER
import Home from "./pages/Customer/Home";
import Mobil from "./pages/Customer/Mobil";
import Motor from "./pages/Customer/Motor";

function AdminProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      {/* CUSTOMER */}
      <Route path="/" element={<Home />} />
      <Route path="/mobil" element={<Mobil />} />
      <Route path="/motor" element={<Motor />} />

      {/* ADMIN LOGIN */}
      <Route path="/admin/login" element={<LoginAdmin />} />

      {/* ADMIN AREA */}
      <Route
        path="/admin"
        element={
          <AdminProtectedRoute>
            <AdminLayout />
          </AdminProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />

        <Route path="dashboard" element={<Dashboard />} />
        <Route path="kendaraan" element={<Kendaraan />} />

        {/* MASTER */}
        <Route path="master/vehicle-types" element={<VehicleTypes />} />
        <Route path="master/vehicle-brands" element={<VehicleBrands />} />
        <Route path="master/transmissions" element={<Transmissions />} />
        <Route path="master/rental-statuses" element={<RentalStatuses />} />
        <Route path="master/payment-statuses" element={<PaymentStatuses />} />

        {/* VEHICLES */}
        <Route path="kendaraan/mobil" element={<Cars />} />
        <Route path="kendaraan/motor" element={<Motorcycles />} />

        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}