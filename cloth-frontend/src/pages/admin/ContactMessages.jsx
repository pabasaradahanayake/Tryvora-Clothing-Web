import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";

function ContactMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [replyText, setReplyText] = useState({});
  const [error, setError] = useState("");

  const token = (localStorage.getItem("admin_token") || "")
    .replace(/"/g, "")
    .trim();

  const stats = useMemo(() => {
    const total = messages.length;
    const pending = messages.filter((msg) => msg.status !== "replied").length;
    const replied = messages.filter((msg) => msg.status === "replied").length;

    return { total, pending, replied };
  }, [messages]);

  const loadMessages = async () => {
    if (!token) {
      setError("Admin token not found. Please login again.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${API_BASE}/contact/admin/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMessages(res.data || []);
    } catch (err) {
      console.log("ADMIN LOAD ERROR:", err.response?.data || err);
      setError("Failed to load messages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendReply = async (id) => {
    const reply = (replyText[id] || "").trim();

    if (!reply) {
      alert("Please write a reply first.");
      return;
    }

    if (!token) {
      alert("Admin token not found. Please login again.");
      return;
    }

    try {
      await axios.put(
        `${API_BASE}/contact/admin/messages/${id}/reply`,
        { reply },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setReplyText((prev) => ({ ...prev, [id]: "" }));
      loadMessages();
    } catch (err) {
      console.log("ADMIN REPLY ERROR:", err.response?.data || err);
      alert("Reply failed.");
    }
  };

  const deleteMessage = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this message?"
    );

    if (!confirmDelete) return;

    if (!token) {
      alert("Admin token not found. Please login again.");
      return;
    }

    try {
      await axios.delete(`${API_BASE}/contact/admin/messages/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      loadMessages();
    } catch (err) {
      console.log("ADMIN DELETE ERROR:", err.response?.data || err);
      alert("Delete failed.");
    }
  };

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-semibold tracking-wide text-gray-500 uppercase">
          Admin Panel
        </p>
        <h1 className="mt-2 text-4xl font-bold text-gray-900">
          Contact Messages
        </h1>
        <p className="mt-2 text-gray-600">
          View user messages, send replies, and delete messages.
        </p>
      </div>

      <div className="grid gap-5 mb-8 md:grid-cols-3">
        <div className="p-5 bg-white border shadow-sm rounded-2xl">
          <p className="text-sm text-gray-500">Total Messages</p>
          <h2 className="mt-2 text-3xl font-bold text-gray-900">
            {stats.total}
          </h2>
        </div>

        <div className="p-5 bg-white border shadow-sm rounded-2xl">
          <p className="text-sm text-gray-500">Pending Replies</p>
          <h2 className="mt-2 text-3xl font-bold text-yellow-600">
            {stats.pending}
          </h2>
        </div>

        <div className="p-5 bg-white border shadow-sm rounded-2xl">
          <p className="text-sm text-gray-500">Replied</p>
          <h2 className="mt-2 text-3xl font-bold text-green-600">
            {stats.replied}
          </h2>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-6 text-sm font-medium text-red-700 border border-red-200 rounded-xl bg-red-50">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center bg-white border shadow-sm rounded-2xl">
          <p className="text-gray-600">Loading messages...</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="p-8 text-center bg-white border shadow-sm rounded-2xl">
          <h2 className="text-lg font-semibold text-gray-900">
            No messages found
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            User messages will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="overflow-hidden transition bg-white border shadow-sm rounded-2xl hover:shadow-md"
            >
              <div className="flex flex-col gap-4 p-6 border-b md:flex-row md:items-start md:justify-between bg-gray-50">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {msg.subject || "No Subject"}
                  </h2>

                  <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-600">
                    <span>
                      <strong>Name:</strong> {msg.name}
                    </span>

                    <span>
                      <strong>Email:</strong> {msg.email}
                    </span>
                  </div>
                </div>

                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    msg.status === "replied"
                      ? "text-green-700 bg-green-100"
                      : "text-yellow-700 bg-yellow-100"
                  }`}
                >
                  {msg.status === "replied" ? "Replied" : "Pending"}
                </span>
              </div>

              <div className="p-6">
                <div className="p-4 border rounded-xl bg-slate-50">
                  <p className="mb-1 text-sm font-semibold text-gray-700">
                    User Message
                  </p>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {msg.message}
                  </p>
                </div>

                {msg.admin_reply && (
                  <div className="p-4 mt-4 border border-green-200 rounded-xl bg-green-50">
                    <p className="mb-1 text-sm font-semibold text-green-700">
                      Admin Reply
                    </p>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {msg.admin_reply}
                    </p>
                  </div>
                )}

                <div className="mt-5">
                  <label className="block mb-2 text-sm font-semibold text-gray-700">
                    Write Reply
                  </label>

                  <textarea
                    placeholder="Write a professional reply..."
                    rows="4"
                    className="w-full p-4 text-sm border rounded-xl outline-none focus:ring-2 focus:ring-black"
                    value={replyText[msg.id] || ""}
                    onChange={(e) =>
                      setReplyText((prev) => ({
                        ...prev,
                        [msg.id]: e.target.value,
                      }))
                    }
                  />

                  <div className="flex justify-end gap-3 mt-3">
                    <button
                      onClick={() => deleteMessage(msg.id)}
                      className="px-6 py-2.5 text-sm font-semibold text-red-600 transition bg-red-50 border border-red-200 rounded-full hover:bg-red-100"
                    >
                      Delete
                    </button>

                    <button
                      onClick={() => sendReply(msg.id)}
                      className="px-6 py-2.5 text-sm font-semibold text-white transition bg-black rounded-full hover:bg-gray-900"
                    >
                      Send Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ContactMessages;