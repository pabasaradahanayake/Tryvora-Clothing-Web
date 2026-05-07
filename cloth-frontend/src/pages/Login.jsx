import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import loginImg from "../assets/login-img.webp";
import axios from "axios";
import API from "../api";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const ADMIN_USERNAME = "tryvoraadmin";

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);

      const response = await API.post("/auth/google-login", {
        credential: credentialResponse.credential,
      });

      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("user_email", decoded.email || response.data.email || "");
      localStorage.setItem("user_name", decoded.name || response.data.name || "");
      localStorage.removeItem("admin_token");

      navigate("/dashboard");
    } catch (err) {
      console.error("Google login error:", err);
      setError("Google login failed.");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    // validation
    if (!username || !password) {
      setError("Please fill all fields.");
      return;
    }

    try {
      const enteredUsername = username.trim().toLowerCase();
      const isAdmin = enteredUsername === ADMIN_USERNAME;

      let response;

      if (isAdmin) {
        response = await axios.post(
          "http://127.0.0.1:8000/admin/login",
          new URLSearchParams({
            username: username.trim(),
            password: password,
          }),
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        );

        // save admin JWT token
        localStorage.setItem("admin_token", response.data.access_token);
        localStorage.removeItem("token");

        // redirect admin
        navigate("/admin");
      } else {
        response = await axios.post(
          "http://127.0.0.1:8000/token",
          new URLSearchParams({
            username: username,
            password: password,
          }),
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        );

        // save user JWT token
        localStorage.setItem("token", response.data.access_token);
        localStorage.removeItem("admin_token");

        // redirect user
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Invalid username or password.");
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* LEFT SIDE */}
      <div className="w-1/2 flex items-center justify-center bg-[#EEEF3F8] px-6 pt-18">
        {/* Form Card */}
        <div className="w-full max-w-sm p-6 mt-20 bg-white shadow-md rounded-3xl">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold text-gray-800">
              Welcome back to Tryvora
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Continue your AI-powered fashion experience.
            </p>
          </div>

          {/* Google Button */}
          <div className="flex justify-center w-full">
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={() => {
                setError("Google login failed.");
              }}
              width="320"
              text="continue_with"
              shape="pill"
            />
          </div>

          {/* Divider */}
          <div className="flex items-center my-5">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="px-3 text-xs text-gray-400">OR</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-3 text-xs text-center text-red-500">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block mb-1 text-xs text-gray-600">
                User Name
              </label>
              <input
                type="text"
                placeholder="Your User Name"
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-black"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="block mb-1 text-xs text-gray-600">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="********"
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

            <div className="flex items-center justify-between text-xs text-gray-500">
              <label className="flex items-center gap-2">
                <input type="checkbox" />
                Remember me
              </label>
              <span className="cursor-pointer hover:underline">
                Forgot password?
              </span>
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white py-2.5 rounded-full font-medium hover:bg-gray-900 transition"
            >
              Login
            </button>
          </form>

          <p className="mt-5 text-xs text-center text-gray-500">
            Don’t have an account?{" "}
            <Link to="/register" className="font-semibold text-black">
              Sign Up
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

export default Login;