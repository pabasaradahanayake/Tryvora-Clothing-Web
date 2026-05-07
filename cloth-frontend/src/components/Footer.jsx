import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="pt-16 pb-8 text-gray-300 bg-black">
      <div className="grid max-w-6xl gap-10 px-6 mx-auto md:grid-cols-3">
        {/* Logo + About */}
        <div>
          <h2 className="mb-4 text-2xl font-semibold text-white">
            Tryvora
          </h2>

          <p className="max-w-sm text-sm leading-6 text-gray-400">
            Virtual clothing try-on platform that lets you see how clothes fit
            your body instantly using AI technology.
          </p>
        </div>

        {/* Navigation */}
        <div>
          <h3 className="mb-4 font-semibold text-white">
            Navigation
          </h3>

          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/about" className="hover:text-white">
                About Us
              </Link>
            </li>

            <li>
              <Link to="/how-it-works" className="hover:text-white">
                How It Works
              </Link>
            </li>

            <li>
              <Link to="/contact" className="hover:text-white">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        {/* Account */}
        <div>
          <h3 className="mb-4 font-semibold text-white">
            Account
          </h3>

          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/login" className="hover:text-white">
                Login
              </Link>
            </li>

            <li>
              <Link to="/register" className="hover:text-white">
                Register
              </Link>
            </li>

            <li>
              <Link to="/privacy" className="hover:text-white">
                Privacy Policy
              </Link>
            </li>

            <li>
              <Link to="/terms" className="hover:text-white">
                Terms & Conditions
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom */}
      <div className="pt-6 mt-12 text-sm text-center text-gray-500 border-t border-gray-800">
        ©️ 2026 Tryvora All Rights Reserved.
      </div>
    </footer>
  );
}

export default Footer;