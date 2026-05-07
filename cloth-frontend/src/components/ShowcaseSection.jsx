import { motion } from "framer-motion";

function ShowcaseSection() {

  return (
    <section className="py-24 bg-white">

      <div className="grid items-center max-w-6xl grid-cols-1 gap-16 px-6 mx-auto md:grid-cols-2">

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >

          <h2 className="mb-6 text-3xl font-bold md:text-4xl">
            See Yourself Before You Buy
          </h2>

          <p className="leading-relaxed text-gray-600">
            Online shopping often leaves you wondering how clothes will
            actually look on your body. With our AI-powered virtual fitting
            technology, you can upload your photo and instantly visualize how
            different outfits will appear on you.
          </p>

          <br />

          <p className="leading-relaxed text-gray-600">
            Our system analyzes body shape and clothing structure using
            advanced computer vision techniques to generate realistic
            try-on results. This helps you make confident fashion decisions
            without the need to physically try on clothes.
          </p>

        </motion.div>


        {/* Image */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >

          <img
            src="/images/showcase-img.webp"
            alt="virtual fitting"
            className="shadow-xl rounded-xl"
          />

        </motion.div>

      </div>

    </section>
  );
}

export default ShowcaseSection;