import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const API_BASE = "http://127.0.0.1:8000";

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletedCount, setDeletedCount] = useState(0);
  const [error, setError] = useState("");
  const [searchText, setSearchText] = useState("");

  const token = (localStorage.getItem("admin_token") || "")
    .replace(/"/g, "")
    .trim();

  const loadUsers = async () => {
    if (!token) {
      setError("Admin token not found. Please login again.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsers(res.data || []);
    } catch (err) {
      console.log("USERS LOAD ERROR:", err.response?.data || err);
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeUsers = useMemo(() => {
    const usersWithActiveStatus = users.filter(
      (user) => typeof user.is_active === "boolean"
    );

    if (usersWithActiveStatus.length === 0) return null;
    return usersWithActiveStatus.filter((user) => user.is_active).length;
  }, [users]);

  const latestUser = users.length > 0 ? users[users.length - 1] : null;

  const filteredUsers = users.filter((user) => {
    const keyword = searchText.toLowerCase();

    return (
      String(user.id).includes(keyword) ||
      (user.username || "").toLowerCase().includes(keyword) ||
      (user.email || "").toLowerCase().includes(keyword)
    );
  });

  const chartData = [
    { name: "Registered Users", value: users.length },
    { name: "Deleted This Session", value: deletedCount },
    {
      name: "Active Users",
      value: activeUsers === null ? 0 : activeUsers,
    },
  ];

  const COLORS = ["#3B82F6", "#EF4444", "#FBBF24"];

  const deleteUser = async (userId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this user?"
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_BASE}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setDeletedCount((prev) => prev + 1);
      loadUsers();
    } catch (err) {
      console.log("USER DELETE ERROR:", err.response?.data || err);
      alert(err.response?.data?.detail || "Failed to delete user.");
    }
  };

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-semibold tracking-wide text-gray-500 uppercase">
          Admin Panel
        </p>
        <h1 className="mt-2 text-4xl font-bold text-gray-900">
          User Management
        </h1>
        <p className="mt-2 text-gray-600">
          View registered users, search accounts, and delete users securely.
        </p>
      </div>

      <div className="grid gap-5 mb-8 md:grid-cols-3">
        <div className="p-6 bg-white border shadow-sm rounded-2xl">
          <p className="text-sm text-gray-500">Registered Users</p>
          <h2 className="mt-2 text-3xl font-bold text-gray-900">
            {users.length}
          </h2>
        </div>

        <div className="p-6 bg-white border shadow-sm rounded-2xl">
          <p className="text-sm text-gray-500">Active Users</p>
          <h2 className="mt-2 text-3xl font-bold text-green-600">
            {activeUsers === null ? "N/A" : activeUsers}
          </h2>
        </div>

        <div className="p-6 bg-white border shadow-sm rounded-2xl">
          <p className="text-sm text-gray-500">Deleted This Session</p>
          <h2 className="mt-2 text-3xl font-bold text-red-600">
            {deletedCount}
          </h2>
        </div>
      </div>

      <div className="grid gap-6 mb-8 lg:grid-cols-2">
        <div className="p-6 bg-white border shadow-sm rounded-2xl">
          <h2 className="text-lg font-bold text-gray-900">User Overview</h2>
          <p className="mt-1 text-sm text-gray-500">
            Real values from the backend user database.
          </p>

          <div className="w-full h-80 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.filter((item) => item.value > 0)}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  dataKey="value"
                  label
                >
                  {chartData
                    .filter((item) => item.value > 0)
                    .map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index]} />
                    ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 bg-white border shadow-sm rounded-2xl">
          <h2 className="text-lg font-bold text-gray-900">
            Latest User Summary
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Most recent user record from the backend list.
          </p>

          <div className="mt-6 space-y-4">
            <div className="p-5 rounded-2xl bg-blue-50">
              <p className="text-sm font-semibold text-blue-700">
                Latest User ID
              </p>
              <h3 className="mt-2 text-2xl font-bold text-blue-900">
                {latestUser ? latestUser.id : "N/A"}
              </h3>
            </div>

            <div className="p-5 rounded-2xl bg-yellow-50">
              <p className="text-sm font-semibold text-yellow-700">Username</p>
              <h3 className="mt-2 text-lg font-bold text-yellow-900 break-all">
                {latestUser?.username || "N/A"}
              </h3>
            </div>

            <div className="p-5 rounded-2xl bg-green-50">
              <p className="text-sm font-semibold text-green-700">Email</p>
              <h3 className="mt-2 text-lg font-bold text-green-900 break-all">
                {latestUser?.email || "N/A"}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-6 text-sm font-medium text-red-700 border border-red-200 rounded-xl bg-red-50">
          {error}
        </div>
      )}

      <div className="overflow-hidden bg-white border shadow-sm rounded-2xl">
        <div className="flex flex-col gap-4 px-6 py-5 border-b lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Registered Users
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              All users registered in the system.
            </p>
          </div>

          <input
            type="text"
            placeholder="Search by ID, username, or email..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full px-5 py-3 text-sm border outline-none lg:w-80 rounded-2xl focus:ring-2 focus:ring-black"
          />
        </div>

        {loading ? (
          <div className="p-10 text-center">
            <p className="text-gray-600">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-10 text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              No users found
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Try changing your search keyword.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-gray-500 bg-gray-50">
                <tr>
                  <th className="px-6 py-4 font-semibold">ID</th>
                  <th className="px-6 py-4 font-semibold">Username</th>
                  <th className="px-6 py-4 font-semibold">Email</th>
                  <th className="px-6 py-4 font-semibold text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-600">{user.id}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {user.username || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {user.email || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="px-4 py-2 text-sm font-semibold text-red-600 transition border border-red-200 rounded-full bg-red-50 hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserManagement;