import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingBag } from "lucide-react";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const adminToken = localStorage.getItem("admin_token");

  const cartItems = JSON.parse(localStorage.getItem("cart") || "[]");

  const isActive = (path) =>
    location.pathname === path
      ? "text-black font-semibold border-b-2 border-black pb-1"
      : "text-gray-600 hover:text-black";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin_token");
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 z-50 w-full border-b border-gray-200 bg-white/90 backdrop-blur-xl shadow-sm">
      <div className="flex items-center justify-between px-8 py-4 mx-auto max-w-7xl">
        {/* LEFT SIDE - LOGO */}
        <div className="flex items-center">
          <Link
            to={adminToken ? "/admin" : token ? "/dashboard" : "/"}
            className="flex items-center gap-3 text-3xl font-black tracking-wider text-black transition hover:opacity-80"
          >
            Tryvora
          </Link>
        </div>

        {/* CENTER - NAV PAGES */}
        <div className="flex items-center gap-10 text-[15px] font-medium">
          {/* PUBLIC NAV */}
          {!token && !adminToken && (
            <>
              <Link to="/" className={`transition ${isActive("/")}`}>
                Home
              </Link>

              <Link to="/about" className={`transition ${isActive("/about")}`}>
                About
              </Link>

              <Link
                to="/how-it-works"
                className={`transition ${isActive("/how-it-works")}`}
              >
                How It Works
              </Link>
            </>
          )}

          {/* USER NAV */}
          {token && (
            <>
              <Link
                to="/dashboard"
                className={`transition ${isActive("/dashboard")}`}
              >
                Dashboard
              </Link>

              <Link
                to="/tryon"
                className={`transition ${isActive("/tryon")}`}
              >
                Try On
              </Link>

              <Link
                to="/cart"
                className={`transition flex items-center gap-2 ${isActive(
                  "/cart"
                )}`}
              >
                <div className="relative">
                  <ShoppingBag size={18} />

                  {cartItems.length > 0 && (
                    <span className="absolute -top-2 -right-2 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                      {cartItems.length}
                    </span>
                  )}
                </div>

                Cart
              </Link>

              <Link
                to="/my-orders"
                className={`transition ${isActive("/my-orders")}`}
              >
                My Orders
              </Link>

              <Link
                to="/contact"
                className={`transition ${isActive("/contact")}`}
              >
                Contact
              </Link>

              <Link
                to="/my-messages"
                className={`transition ${isActive("/my-messages")}`}
              >
                My Messages
              </Link>
            </>
          )}

          {/* ADMIN NAV */}
          {adminToken && (
            <>
              <Link
                to="/admin"
                className={`transition ${isActive("/admin")}`}
              >
                Admin Dashboard
              </Link>
            </>
          )}
        </div>

        {/* RIGHT SIDE - AUTH BUTTONS */}
        <div className="flex items-center gap-5">
          {!token && !adminToken && (
            <>
              <Link
                to="/login"
                className="font-medium text-gray-700 transition hover:text-black"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="px-6 py-2.5 rounded-full bg-black text-white hover:bg-gray-900 transition shadow-lg"
              >
                Register
              </Link>
            </>
          )}

          {(token || adminToken) && (
            <button
              onClick={handleLogout}
              className="px-6 py-2.5 text-sm font-semibold text-white transition bg-red-500 rounded-full shadow-md hover:bg-red-600"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;