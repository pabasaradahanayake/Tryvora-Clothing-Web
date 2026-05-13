import { Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Top Bar */}
      <div className="h-14 bg-white border-b flex items-center justify-between px-6">
        <h1 className="text-lg font-semibold text-gray-800">
          Admin Dashboard
        </h1>

        <div className="text-sm text-gray-600">
          Admin
        </div>
      </div>

      {/* Admin Page Content */}
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}