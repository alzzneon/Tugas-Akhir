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
import AdminUsers from "./pages/Admin/AdminUsers";
import RentalsList from "./pages/Admin/Rentals/RentalsList";

// PROFILE
import ProfilePage from "./pages/ProfilePage";

// CUSTOMER
import Home from "./pages/Customer/Home";
import Mobil from "./pages/Customer/Mobil";
import Motor from "./pages/Customer/Motor";
import Login from "./pages/Customer/Login";
import Register from "./pages/Customer/Register";
import ForgotPassword from "./pages/Customer/ForgotPassword";
import SewaMobil from "./pages/Customer/SewaMobil";
import SewaMotor from "./pages/Customer/SewaMotor";
import PesananSaya from "./pages/Customer/PesananSaya";
import DetailPesanan from "./pages/Customer/DetailPesanan";
import PembayaranPesanan from "./pages/Customer/PembayaranPesanan";

import TentangPerusahaan from "./pages/Customer/Informasi/TentangPerusahaan";
import SyaratKetentuan from "./pages/Customer/Informasi/SyaratKetentuan";
import KebijakanPrivasi from "./pages/Customer/Informasi/KebijakanPrivasi";
import FAQ from "./pages/Customer/Informasi/FAQ";

function getAuthUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function ProtectedAdminRoute({ children }) {
  const token = localStorage.getItem("token");
  const user = getAuthUser();

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!user || !["admin", "super_admin"].includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function ProtectedCustomerRoute({ children }) {
  const token = localStorage.getItem("token");
  const user = getAuthUser();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!user || user.role !== "customer") {
    return <Navigate to="/" replace />;
  }

  return children;
}

function ProtectedAnyAuthRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
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

      <Route
        path="/mobil/:id/sewa"
        element={
          <ProtectedCustomerRoute>
            <SewaMobil />
          </ProtectedCustomerRoute>
        }
      />
      
      <Route
        path="/motor/:id/sewa"
        element={
          <ProtectedCustomerRoute>
            <SewaMotor />
          </ProtectedCustomerRoute>
        }
      />

      <Route
        path="/pesanan-saya"
        element={
          <ProtectedCustomerRoute>
            <PesananSaya />
          </ProtectedCustomerRoute>
        }
      />
      <Route
        path="/pesanan-saya/:id"
        element={
          <ProtectedCustomerRoute>
            <DetailPesanan />
          </ProtectedCustomerRoute>
        }
      />

      <Route
        path="/pesanan-saya/:id/pembayaran"
        element={
          <ProtectedCustomerRoute>
            <PembayaranPesanan />
          </ProtectedCustomerRoute>
        }
      />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route path="/tentang" element={<TentangPerusahaan />} />
      <Route path="/syarat" element={<SyaratKetentuan />} />
      <Route path="/kebijakan" element={<KebijakanPrivasi />} />
      <Route path="/faq" element={<FAQ />} />

      {/* ADMIN LOGIN */}
      <Route path="/admin/login" element={<LoginAdmin />} />

      {/* PROFILE */}
      <Route
        path="/profile"
        element={
          <ProtectedAnyAuthRoute>
            <ProfilePage />
          </ProtectedAnyAuthRoute>
        }
      />

      {/* ADMIN AREA */}
      <Route
        path="/admin"
        element={
          <ProtectedAdminRoute>
            <AdminLayout />
          </ProtectedAdminRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />

        <Route path="dashboard" element={<Dashboard />} />
        <Route path="admins" element={<AdminUsers />} />
        <Route path="kendaraan" element={<Kendaraan />} />

        <Route path="master/vehicle-types" element={<VehicleTypes />} />
        <Route path="master/vehicle-brands" element={<VehicleBrands />} />
        <Route path="master/transmissions" element={<Transmissions />} />
        <Route path="master/rental-statuses" element={<RentalStatuses />} />
        <Route path="master/payment-statuses" element={<PaymentStatuses />} />

        <Route path="kendaraan/mobil" element={<Cars />} />
        <Route path="kendaraan/motor" element={<Motorcycles />} />

        <Route path="penyewaan/mobil" element={<RentalsList type="mobil" />} />
        <Route path="penyewaan/motor" element={<RentalsList type="motor" />} />

        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}