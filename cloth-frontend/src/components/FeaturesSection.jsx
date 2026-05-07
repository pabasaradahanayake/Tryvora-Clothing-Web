import { motion } from "framer-motion";
import { Sparkles, Shirt, Zap } from "lucide-react";

function FeaturesSection() {

  const features = [
    {
      icon: <Sparkles size={32} />,
      title: "AI Body Detection",
      desc: "Detects your body shape using advanced computer vision."
    },
    {
      icon: <Shirt size={32} />,
      title: "Virtual Fitting",
      desc: "Try clothes virtually before purchasing them online."
    },
    {
      icon: <Zap size={32} />,
      title: "Instant Results",
      desc: "Generate AI-powered try-on results in seconds."
    }
  ];

  return (
    <section className="py-24 bg-gray-100">

      <div className="max-w-6xl px-6 mx-auto text-center">

        {/* Title */}
        <h2 className="mb-4 text-3xl font-bold md:text-4xl">
          Smart Virtual Fitting Experience
        </h2>

        <p className="max-w-xl mx-auto mb-16 text-gray-600">
          Our AI technology helps you visualize clothing on your body
          instantly before making a purchase.
        </p>

        {/* Features */}
        <div className="grid gap-10 md:grid-cols-3">

          {features.map((feature, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -8 }}
              className="p-8 transition bg-white shadow-md rounded-xl hover:shadow-xl"
            >

              <div className="flex justify-center mb-4 text-black">
                {feature.icon}
              </div>

              <h3 className="mb-2 text-xl font-semibold">
                {feature.title}
              </h3>

              <p className="text-sm text-gray-600">
                {feature.desc}
              </p>

            </motion.div>
          ))}

        </div>

      </div>

    </section>
  );
}

export default FeaturesSection;