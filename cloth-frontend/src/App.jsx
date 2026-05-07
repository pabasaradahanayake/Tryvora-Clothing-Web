import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
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
import AdminDashboard from "./pages/AdminDashboard";
import MyMessages from "./pages/MyMessages";

import Footer from "./components/Footer";

function App() {
  const token = localStorage.getItem("token");

  return (
    <div className="min-h-screen bg-[#EEF3F8]">
      <Navbar />

      <div className="flex-grow">
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={token ? <Dashboard /> : <Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/how-it-works" element={<HowItWorks />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin Protected Page */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
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

      <Footer />
    </div>
  );
}

export default App;