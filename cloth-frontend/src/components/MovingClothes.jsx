import { motion } from "framer-motion";

function MovingClothes() {

  const images = [
    "/images/shirt.webp",
    "/images/jacket.webp",
    "/images/dress.webp",
    "/images/pants.webp",
     "/images/Tshirt.webp",
  ];

  return (

    <section className="py-12 overflow-hidden">

      <motion.div
        className="flex gap-10"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          repeat: Infinity,
          duration: 20,
          ease: "linear"
        }}
      >

        {[...images, ...images].map((img, index) => (
          <img
            key={index}
            src={img}
            alt="clothing"
            className="object-contain w-68 h-60"
          />
        ))}

      </motion.div>

    </section>

  );
}

export default MovingClothes;