import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";

function HeroSection() {

  const navigate = useNavigate();

  return (
    <section
      className="relative flex items-center justify-center h-[70vh] pt-24 text-center bg-cover bg-center"
      style={{ backgroundImage: "url('/images/hero-img.webp')" }}
    >

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40"></div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative max-w-2xl px-4 text-white"
      >

        {/* Title */}
        <h1 className="mb-4 text-3xl font-bold md:text-4xl lg:text-5xl">
          Virtual Clothing Try-On
        </h1>

        {/* Description */}
        <p className="mb-8 text-gray-200 md:text-lg">
          Upload your photo and see how clothes fit your body instantly
          using AI-powered virtual fitting technology.
        </p>

        {/* Buttons Container */}
        <div className="flex justify-center">

          <div className="flex gap-4 p-2 border rounded-full border-white/30 backdrop-blur-md">

            <Button
              text="Experience Virtual Fitting"
              onClick={() => navigate("/login")}
            />

            <Button
              text="Learn More"
              variant="outline"
              onClick={() => navigate("/how-it-works")}
            />

          </div>

        </div>

      </motion.div>

    </section>
  );
}

export default HeroSection;