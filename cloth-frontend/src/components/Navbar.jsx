import { Link, useLocation, useNavigate } from "react-router-dom";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const adminToken = localStorage.getItem("admin_token");

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
    <nav
      className="fixed top-0 left-0 z-50 w-full bg-white shadow-sm"
    >
      <div className="flex items-center justify-between px-8 py-3 mx-auto max-w-7xl">
        {/* LEFT SIDE - LOGO */}
        <div className="flex items-center">
          <Link
            to={adminToken ? "/admin" : token ? "/dashboard" : "/"}
            className="flex items-center gap-3 text-3xl font-bold tracking-widest text-black"
          >
            Tryvora
          </Link>
        </div>

        {/* CENTER - NAV PAGES */}
        <div className="flex items-center gap-10 text-base font-medium">
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
                to="/results"
                className={`transition ${isActive("/results")}`}
              >
                My Results
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
                className="font-medium text-gray-700 hover:text-black"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="px-6 py-2.5 rounded-full bg-black text-white hover:bg-gray-900 transition"
              >
                Register
              </Link>
            </>
          )}

          {(token || adminToken) && (
            <button
              onClick={handleLogout}
              className="px-6 py-2.5 text-white transition bg-red-500 rounded-full hover:bg-red-600"
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