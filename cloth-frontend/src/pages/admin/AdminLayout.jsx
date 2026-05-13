import { Outlet, NavLink, useNavigate } from "react-router-dom";

function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    `group flex items-center w-full px-5 py-3.5 text-sm font-semibold rounded-2xl transition-all duration-300 ${
      isActive
        ? "bg-white text-[#0F172A] shadow-xl scale-[1.01]"
        : "text-gray-300 hover:bg-white/10 hover:text-white hover:translate-x-1"
    }`;

  return (
    <div className="min-h-screen bg-[#F3F6FB]">
      {/* SIDEBAR */}
      <aside className="fixed left-0 top-16 flex h-[calc(100vh-64px)] w-80 flex-col overflow-hidden bg-gradient-to-b from-[#0F172A] via-[#111827] to-[#020617] text-white shadow-2xl">
        {/* TOP BRAND */}
        <div className="relative px-8 py-6 border-b border-white/10">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-14 h-14 font-bold text-white shadow-lg rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600">
                T
              </div>

              <div>
                <h2 className="text-2xl font-black tracking-tight">
                  Admin Panel
                </h2>
                <p className="mt-1 text-sm text-gray-400">
                  Tryvora Management
                </p>
              </div>
            </div>

            <div className="p-4 mt-6 border bg-white/5 border-white/10 rounded-2xl backdrop-blur-sm">
              <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
                System Status
              </p>

              <div className="flex items-center gap-3 mt-3">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                <p className="text-sm font-semibold text-green-300">
                  All Systems Running
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 px-5 py-6">
          <p className="px-2 mb-5 text-xs font-bold tracking-[0.2em] text-gray-500 uppercase">
            Management
          </p>

          <div className="space-y-5">
            <NavLink to="/admin/clothes" className={linkClass}>
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 text-lg rounded-xl bg-white/10">
                  👕
                </div>
                <div>
                  <p className="font-bold">Clothing Management</p>
                  <p className="mt-1 text-xs text-gray-400">
                    Upload and manage clothes
                  </p>
                </div>
              </div>
            </NavLink>

            <NavLink to="/admin/users" className={linkClass}>
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 text-lg rounded-xl bg-white/10">
                  👥
                </div>
                <div>
                  <p className="font-bold">User Management</p>
                  <p className="mt-1 text-xs text-gray-400">
                    View and manage users
                  </p>
                </div>
              </div>
            </NavLink>

            <NavLink to="/admin/messages" className={linkClass}>
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 text-lg rounded-xl bg-white/10">
                  💬
                </div>
                <div>
                  <p className="font-bold">Contact Messages</p>
                  <p className="mt-1 text-xs text-gray-400">
                    Manage customer messages
                  </p>
                </div>
              </div>
            </NavLink>

            <NavLink to="/admin/settings" className={linkClass}>
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 text-lg rounded-xl bg-white/10">
                  ⚙️
                </div>
                <div>
                  <p className="font-bold">Settings</p>
                  <p className="mt-1 text-xs text-gray-400">
                    Admin and data summary
                  </p>
                </div>
              </div>
            </NavLink>
          </div>
        </nav>

        {/* LOGOUT */}
        <div className="p-5 border-t border-white/10 bg-black/10">
          <button
            onClick={handleLogout}
            className="w-full px-5 py-4 text-sm font-bold text-white transition-all duration-300 shadow-xl rounded-2xl bg-gradient-to-r from-red-600 to-red-500 hover:scale-[1.02] hover:from-red-500 hover:to-red-400"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* PAGE CONTENT */}
      <main className="ml-80 px-10 pt-12 pb-16">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;