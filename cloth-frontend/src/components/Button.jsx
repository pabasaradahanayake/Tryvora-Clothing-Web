import { motion } from "framer-motion";

function Button({ text, onClick, variant = "primary" }) {

  const baseStyle =
    "px-6 py-3 rounded-full transition font-medium";

  const variants = {
    primary: "bg-black text-white hover:bg-gray-900",
    outline: "border border-white text-white hover:bg-white hover:text-black"
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`${baseStyle} ${variants[variant]}`}
    >
      {text}
    </motion.button>
  );
}

export default Button;