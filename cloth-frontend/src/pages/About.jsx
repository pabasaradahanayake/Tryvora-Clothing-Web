import { motion as Motion } from "framer-motion";
import { Sparkles, Cpu, LayoutDashboard } from "lucide-react";

function About() {

  return (

    <div className="min-h-screen pb-20">


      {/* HERO SECTION */}

      <div className="relative h-[70vh] w-full mb-28">

        {/* BACKGROUND IMAGE */}

        <img
          src="/images/about-img.webp"
          alt="Tryvora AI Fashion"
          className="absolute inset-0 object-cover w-full h-full"
        />

        {/* DARK OVERLAY */}

        <div className="absolute inset-0 bg-black/40"></div>


        {/* CONTENT */}

        <Motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute bottom-0 max-w-6xl px-6 pb-16 mx-auto text-white -translate-x-1/2 left-1/2"
        >

          <h1 className="mb-6 text-4xl font-bold md:text-5xl">
            About Tryvora
          </h1>

          <p className="max-w-2xl text-gray-200">
            Tryvora is an AI-powered virtual clothing try-on platform that
            allows users to visualize how outfits look before purchasing
            them online. By combining artificial intelligence and modern
            web technologies, Tryvora helps users experiment with different
            styles and clothing options in a simple and interactive way.

            <br /><br />

            Our platform is designed to improve the online fashion shopping
            experience by reducing uncertainty and helping users make more
            confident purchasing decisions. With Tryvora, users can upload
            their photos, select clothing items, and instantly preview how
            outfits look on their body using intelligent virtual fitting
            technology.
          </p>

        </Motion.div>

      </div>



      <div className="max-w-6xl px-6 mx-auto">


        {/* SECTION DIVIDER */}

        <Motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          transition={{ duration: 0.6 }}
          className="h-[2px] bg-gray-200 mb-24 origin-left"
        />



        {/* MISSION */}

        <div className="py-20 mb-28 bg-slate-50 rounded-2xl">

          <Motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-4xl px-6 mx-auto text-center"
          >

            <h2 className="mb-6 text-3xl font-semibold">
              Our Mission
            </h2>

            <p className="text-gray-600">
              Our mission is to transform the online fashion experience
              by using artificial intelligence to allow users to try
              clothes virtually. We aim to reduce uncertainty in
              online shopping and help users make better purchasing
              decisions.
            </p>

          </Motion.div>

        </div>



        {/* FEATURES */}

        <Motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-28"
        >

          <h2 className="mb-16 text-3xl font-semibold text-center">
            Key Features
          </h2>

          <div className="grid gap-10 md:grid-cols-3">


            {/* CARD */}

            <Motion.div
              whileHover={{ y: -10 }}
              className="p-10 transition bg-white shadow-sm rounded-xl hover:shadow-xl"
            >

              <Sparkles className="w-10 h-10 mb-4 text-black" />

              <h3 className="mb-3 text-lg font-semibold">
                AI Clothing Try-On
              </h3>

              <p className="text-gray-600">
                Upload your photo and preview how different outfits
                look on your body using AI technology.
              </p>

            </Motion.div>



            {/* CARD */}

            <Motion.div
              whileHover={{ y: -10 }}
              className="p-10 transition bg-white shadow-sm rounded-xl hover:shadow-xl"
            >

              <Cpu className="w-10 h-10 mb-4 text-black" />

              <h3 className="mb-3 text-lg font-semibold">
                Instant Results
              </h3>

              <p className="text-gray-600">
                Generate outfit previews instantly without visiting
                a physical store.
              </p>

            </Motion.div>



            {/* CARD */}

            <Motion.div
              whileHover={{ y: -10 }}
              className="p-10 transition bg-white shadow-sm rounded-xl hover:shadow-xl"
            >

              <LayoutDashboard className="w-10 h-10 mb-4 text-black" />

              <h3 className="mb-3 text-lg font-semibold">
                User Dashboard
              </h3>

              <p className="text-gray-600">
                Manage your try-on sessions, view saved results,
                and explore clothing options easily.
              </p>

            </Motion.div>

          </div>

        </Motion.div>



        {/* FUTURE VISION */}

        <div className="py-20 bg-slate-50 rounded-2xl">

          <Motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-4xl px-6 mx-auto text-center"
          >

            <h2 className="mb-6 text-3xl font-semibold">
              Future Vision
            </h2>

            <p className="text-gray-600">
              In the future, Tryvora aims to expand its capabilities by
              introducing more clothing categories, improving AI fitting
              accuracy, and integrating real-time 3D virtual fitting
              experiences. Our long-term goal is to revolutionize how
              people shop for fashion online.
            </p>

          </Motion.div>

        </div>


      </div>

    </div>

  );
}

export default About;