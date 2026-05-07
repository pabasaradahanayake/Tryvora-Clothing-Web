import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import loginImg from "../assets/login-img.webp";
import axios from "axios";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accepted, setAccepted] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name || !email || !password || !confirmPassword) {
      setError("All fields are required!");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters!");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (!accepted) {
      setError("You must accept Terms & Conditions!");
      return;
    }

    try {

      await axios.post("http://127.0.0.1:8000/register", {
        username: name,
        email: email,
        password: password
      });

      setSuccess("Account created successfully! Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (err) {
      console.error("Register error:", err);
      setError("Registration failed. Email or username may already exist.");
    }
  };

  return (
    <div className="flex min-h-screen">

      {/* LEFT SIDE */}
      <div className="w-1/2 flex items-center justify-center bg-[#EEEF3F8] px-6 pt-18">

        <div className="w-full max-w-sm p-6 mt-20 bg-white shadow-md rounded-3xl">

          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold text-gray-800">
             Step Into Intelligent Fashion
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Let AI redefine your personal style.
            </p>
          </div>

          {error && (
            <div className="mb-3 text-xs text-center text-red-500">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-3 text-xs text-center text-green-600">
              {success}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">

            {/* Full Name */}
            <div>
              <label className="block mb-1 text-xs text-gray-600">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Your Full Name"
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-black"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block mb-1 text-xs text-gray-600">
                Email
              </label>
              <input
                type="email"
                placeholder="Your Email"
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-black"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block mb-1 text-xs text-gray-600">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Minimum 6 characters"
                  style={{ WebkitAppearance: "none", MozAppearance: "none" }}
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-black"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <span
                  className="absolute right-4 top-2.5 cursor-pointer text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </span>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block mb-1 text-xs text-gray-600">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                  style={{ WebkitAppearance: "none", MozAppearance: "none" }}
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-black"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <span
                  className="absolute right-4 top-2.5 cursor-pointer text-gray-500"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </span>
              </div>
            </div>

            {/* Accept Terms */}
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={accepted}
                onChange={() => setAccepted(!accepted)}
              />
              <span>
                I accept{" "}
                <span className="font-medium text-black">
                  Terms & Conditions
                </span>
              </span>
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white py-2.5 rounded-full font-medium hover:bg-gray-900 transition"
            >
              Sign Up
            </button>

          </form>

          <p className="mt-5 text-xs text-center text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-black">
              Login
            </Link>
          </p>

        </div>
      </div>

      {/* RIGHT SIDE IMAGE */}
      <div className="hidden w-1/2 md:block">
        <img
          src={loginImg}
          alt="Fashion"
          className="object-cover w-full h-screen"
        />
      </div>

    </div>
  );
}

export default Register;