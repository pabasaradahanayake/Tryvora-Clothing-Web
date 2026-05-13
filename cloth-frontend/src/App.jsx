import { Routes, Route, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

import Home from "./pages/Home";
import About from "./pages/About";
import HowItWorks from "./pages/HowItWorks";
import Contact from "./pages/Contact";

import TryOn from "./pages/TryOn";
import MyResults from "./pages/MyResults";
import MyMessages from "./pages/MyMessages";

import AdminLayout from "./pages/admin/AdminLayout";
import ClothingManagement from "./pages/admin/ClothingManagement";
import UserManagement from "./pages/admin/UserManagement";
import ContactMessages from "./pages/admin/ContactMessages";
import Settings from "./pages/admin/Settings";

function App() {
  const token = localStorage.getItem("token");
  const location = useLocation();

  const isAdminPage = location.pathname.startsWith("/admin");

  return (
    <div className="min-h-screen bg-[#EEF3F8] flex flex-col">
      {!isAdminPage && <Navbar />}

      {isAdminPage && (
        <div className="fixed top-0 left-0 right-0 z-40 h-16 bg-white/90 backdrop-blur-xl border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between h-full px-8">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">
                Tryvora Admin Dashboard
              </h1>
              <p className="text-xs font-medium text-gray-500">
                Manage clothing, users, messages, and settings
              </p>
            </div>

            <div className="w-full max-w-md">
              <input
                type="text"
                placeholder="Search admin panel..."
                className="w-full px-5 py-2.5 text-sm bg-gray-100 border border-gray-200 outline-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-black"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex-grow">
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={token ? <Dashboard /> : <Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/how-it-works" element={<HowItWorks />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin Protected Pages */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<ClothingManagement />} />
              <Route path="clothes" element={<ClothingManagement />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="messages" element={<ContactMessages />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>

          {/* User Protected Pages */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tryon" element={<TryOn />} />
            <Route path="/results" element={<MyResults />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/my-messages" element={<MyMessages />} />
          </Route>
        </Routes>
      </div>

      {!isAdminPage && <Footer />}
    </div>
  );
}

export default App;