// src/components/AdminRoute.jsx
import { Navigate, Outlet } from "react-router-dom";

function AdminRoute() {
  const adminToken = localStorage.getItem("admin_token");

  return adminToken ? <Outlet /> : <Navigate to="/login" />;
}

export default AdminRoute;