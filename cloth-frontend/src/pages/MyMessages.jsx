import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";

function MyMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = (localStorage.getItem("token") || "").replace(/"/g, "").trim();
  const userEmail = (localStorage.getItem("user_email") || "").trim();

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError("");

      if (!token) {
        setError("Please login first.");
        return;
      }

      if (!userEmail) {
        setError("No previous messages found.");
        return;
      }

      const res = await axios.get(
        `${API_BASE}/contact/my-messages/by-email/${encodeURIComponent(userEmail)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessages(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load your messages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages(); // 🔥 AUTO LOAD
  }, []);

  return (
    <div className="min-h-screen px-6 pt-28 pb-16 bg-[#EEF3F8]">
      
      {/* HEADER */}
      <div className="max-w-5xl mx-auto mb-10">
        <h1 className="text-3xl font-bold text-gray-900">
          My Messages
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          View all your previous messages and admin replies.
        </p>
      </div>

      <div className="max-w-5xl mx-auto">

        {/* ERROR */}
        {error && (
          <div className="p-4 mb-6 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50">
            {error}
          </div>
        )}

        {/* LOADING */}
        {loading ? (
          <div className="p-6 text-center bg-white border shadow rounded-xl">
            <p className="text-gray-600">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="p-6 text-center bg-white border shadow rounded-xl">
            <p className="text-gray-500">No messages yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="p-6 transition bg-white border shadow-md rounded-xl hover:shadow-lg"
              >
                {/* SUBJECT */}
                {msg.subject && (
                  <h2 className="mb-2 text-lg font-semibold text-gray-800">
                    {msg.subject}
                  </h2>
                )}

                {/* MESSAGE */}
                <p className="text-gray-700 whitespace-pre-wrap">
                  {msg.message}
                </p>

                {/* STATUS */}
                <p className="mt-3 text-xs text-gray-400">
                  Status:{" "}
                  <span
                    className={`font-medium ${
                      msg.status === "replied"
                        ? "text-green-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {msg.status}
                  </span>
                </p>

                {/* ADMIN REPLY */}
                {msg.admin_reply ? (
                  <div className="p-4 mt-4 border border-green-200 rounded-lg bg-green-50">
                    <p className="text-sm font-semibold text-green-700">
                      Admin Reply
                    </p>
                    <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                      {msg.admin_reply}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 mt-4 border border-yellow-200 rounded-lg bg-yellow-50">
                    <p className="text-sm text-yellow-700">
                      Waiting for admin reply...
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyMessages;