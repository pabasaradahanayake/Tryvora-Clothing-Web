import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";

function Settings() {
  const [users, setUsers] = useState([]);
  const [clothes, setClothes] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = (localStorage.getItem("admin_token") || "")
    .replace(/"/g, "")
    .trim();

  const adminUsername = useMemo(() => {
    if (!token) return "Not logged in";

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.sub || "Admin";
    } catch {
      return "Admin";
    }
  }, [token]);

  const loadSettingsData = async () => {
    if (!token) {
      setError("Admin token not found. Please login again.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [usersRes, clothesRes, messagesRes] = await Promise.all([
        axios.get(`${API_BASE}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE}/clothes`),
        axios.get(`${API_BASE}/contact/admin/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setUsers(usersRes.data || []);
      setClothes(usersRes.data ? clothesRes.data || [] : []);
      setMessages(messagesRes.data || []);
    } catch (err) {
      console.log("SETTINGS LOAD ERROR:", err.response?.data || err);
      setError("Failed to load settings data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettingsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleClothes = clothes.filter((item) => item.category !== "full_body");

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-semibold tracking-wide text-gray-500 uppercase">
          Admin Panel
        </p>
        <h1 className="mt-2 text-4xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          View admin account details and real system data summary.
        </p>
      </div>

      {error && (
        <div className="p-4 mb-6 text-sm font-medium text-red-700 border border-red-200 rounded-xl bg-red-50">
          {error}
        </div>
      )}

      <div className="grid gap-6 mb-8 lg:grid-cols-2">
        <div className="p-6 bg-white border shadow-sm rounded-3xl">
          <h2 className="text-xl font-bold text-gray-900">
            Admin Account Info
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Current logged admin session details.
          </p>

          <div className="mt-6 space-y-4">
            <div className="p-5 rounded-2xl bg-slate-50">
              <p className="text-sm font-semibold text-gray-500">
                Admin Username
              </p>
              <h3 className="mt-2 text-2xl font-bold text-gray-900">
                {adminUsername}
              </h3>
            </div>

            <div className="p-5 rounded-2xl bg-green-50">
              <p className="text-sm font-semibold text-green-700">
                Token Status
              </p>
              <h3 className="mt-2 text-2xl font-bold text-green-900">
                {token ? "Available" : "Missing"}
              </h3>
            </div>

            <div className="p-5 rounded-2xl bg-blue-50">
              <p className="text-sm font-semibold text-blue-700">Role</p>
              <h3 className="mt-2 text-2xl font-bold text-blue-900">Admin</h3>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border shadow-sm rounded-3xl">
          <h2 className="text-xl font-bold text-gray-900">Data Summary</h2>
          <p className="mt-1 text-sm text-gray-500">
            Real values loaded from backend endpoints.
          </p>

          {loading ? (
            <div className="p-10 mt-6 text-center rounded-2xl bg-slate-50">
              <p className="text-gray-600">Loading summary...</p>
            </div>
          ) : (
            <div className="grid gap-4 mt-6">
              <div className="flex items-center justify-between p-5 rounded-2xl bg-purple-50">
                <div>
                  <p className="text-sm font-semibold text-purple-700">
                    Total Registered Users
                  </p>
                  <p className="mt-1 text-xs text-purple-500">
                    From admin users endpoint
                  </p>
                </div>
                <h3 className="text-3xl font-bold text-purple-900">
                  {users.length}
                </h3>
              </div>

              <div className="flex items-center justify-between p-5 rounded-2xl bg-orange-50">
                <div>
                  <p className="text-sm font-semibold text-orange-700">
                    Total Clothing Items
                  </p>
                  <p className="mt-1 text-xs text-orange-500">
                    Excluding full_body category
                  </p>
                </div>
                <h3 className="text-3xl font-bold text-orange-900">
                  {visibleClothes.length}
                </h3>
              </div>

              <div className="flex items-center justify-between p-5 rounded-2xl bg-cyan-50">
                <div>
                  <p className="text-sm font-semibold text-cyan-700">
                    Total Contact Messages
                  </p>
                  <p className="mt-1 text-xs text-cyan-500">
                    From admin contact messages
                  </p>
                </div>
                <h3 className="text-3xl font-bold text-cyan-900">
                  {messages.length}
                </h3>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;