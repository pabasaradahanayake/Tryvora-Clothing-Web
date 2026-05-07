import { useState } from "react";
import { motion as Motion } from "framer-motion";
import { MapPin, Phone, Mail } from "lucide-react";
import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";

function Contact() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    subject: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const getToken = () => {
    const token = (localStorage.getItem("token") || "").replace(/"/g, "").trim();
    return token || null;
  };

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = getToken();

    if (!token) {
      setErrorMessage("Please login first to send a message.");
      return;
    }

    const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
    const userEmail = formData.email.trim();

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setErrorMessage("Please enter your first name and last name.");
      return;
    }

    if (!userEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (!isValidEmail(userEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!formData.subject.trim()) {
      setErrorMessage("Please enter a subject.");
      return;
    }

    if (!formData.message.trim()) {
      setErrorMessage("Please enter your message.");
      return;
    }

    try {
      setLoading(true);
      setSuccessMessage("");
      setErrorMessage("");

      await axios.post(
        `${API_BASE}/contact/`,
        {
          name: fullName,
          email: userEmail,
          subject: formData.subject.trim(),
          message: formData.message.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      localStorage.setItem("user_email", userEmail);

      setSuccessMessage("Message sent successfully.");
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        subject: "",
        message: "",
      });

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      console.log("CONTACT ERROR:", err.response?.data || err);

      const detail = err?.response?.data?.detail;

      if (err?.response?.status === 401) {
        setErrorMessage("Please login again to send a message.");
      } else if (typeof detail === "string") {
        setErrorMessage(detail);
      } else {
        setErrorMessage("Failed to send message. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* HERO SECTION */}
      <div className="relative h-[70vh] w-full mb-28">
        <img
          src="/images/contact-img.webp"
          alt="Contact Tryvora"
          className="absolute inset-0 object-cover w-full h-full"
        />

        <div className="absolute inset-0 bg-black/50"></div>

        <Motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute bottom-0 max-w-6xl px-6 pb-16 mx-auto text-white -translate-x-1/2 left-1/2"
        >
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">
            Contact Us
          </h1>

          <p className="max-w-xl text-gray-200">
            Have questions about Tryvora? Feel free to reach out to us.
            Our team is always ready to help you.
          </p>
        </Motion.div>
      </div>

      {/* CONTACT SECTION */}
      <div className="max-w-6xl px-6 mx-auto">
        <div className="grid items-start gap-14 md:grid-cols-2">
          {/* LEFT SIDE */}
          <Motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4 text-2xl font-semibold">
              Get In Touch
            </h2>

            <p className="mb-10 text-gray-600">
              Also contact us through social media anytime.
            </p>

            {/* ADDRESS */}
            <div className="flex items-start gap-4 mb-8">
              <div className="p-3 bg-gray-100 rounded-full">
                <MapPin size={22} />
              </div>

              <div>
                <p className="font-medium">Address</p>
                <p className="text-sm text-gray-600">
                  Tryvora AI Solutions
                  <br />
                  Colombo, Sri Lanka
                </p>
              </div>
            </div>

            {/* PHONE */}
            <div className="flex items-start gap-4 mb-8">
              <div className="p-3 bg-gray-100 rounded-full">
                <Phone size={22} />
              </div>

              <div>
                <p className="font-medium">Phone</p>
                <p className="text-sm text-gray-600">
                  +94 70 173 0858
                </p>
              </div>
            </div>

            
          </Motion.div>

          {/* RIGHT SIDE FORM */}
          <Motion.div
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="relative p-10 border shadow-2xl rounded-2xl bg-white/90 backdrop-blur-lg"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-100 to-transparent opacity-40"></div>

            <div className="relative">
              <h2 className="mb-6 text-xl font-semibold">
                Send a Message
              </h2>

              {successMessage && (
                <div className="p-3 mb-4 text-sm font-medium text-green-700 border border-green-200 rounded-lg bg-green-50">
                  {successMessage}
                </div>
              )}

              {errorMessage && (
                <div className="p-3 mb-4 text-sm font-medium text-red-700 border border-red-200 rounded-lg bg-red-50">
                  {errorMessage}
                </div>
              )}

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="First Name"
                    className="p-3 transition border rounded-lg outline-none focus:ring-2 focus:ring-black"
                  />

                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Last Name"
                    className="p-3 transition border rounded-lg outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Your Email Address"
                  className="w-full p-3 transition border rounded-lg outline-none focus:ring-2 focus:ring-black"
                />

                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Subject"
                  className="w-full p-3 transition border rounded-lg outline-none focus:ring-2 focus:ring-black"
                />

                <textarea
                  rows="5"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Message"
                  className="w-full p-3 transition border rounded-lg outline-none focus:ring-2 focus:ring-black"
                ></textarea>

                <Motion.button
                  type="submit"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={loading}
                  className="w-full py-3 font-medium text-white transition rounded-lg bg-gradient-to-r from-black to-gray-800 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending..." : "Send Message"}
                </Motion.button>
              </form>
            </div>
          </Motion.div>
        </div>
      </div>
    </div>
  );
}

export default Contact;