import { motion } from "framer-motion";
import { Upload, Shirt, Cpu, Image } from "lucide-react";

function HowItWorks() {

  return (

    <div className="min-h-screen pb-20">


      {/* HERO SECTION */}

      <div className="relative h-[70vh] w-full mb-28">

        {/* BACKGROUND IMAGE */}

        <img
          src="/images/howitworks-img.webp"
          alt="How Tryvora Works"
          className="absolute inset-0 object-cover w-full h-full"
        />

        {/* DARK OVERLAY */}

        <div className="absolute inset-0 bg-black/40"></div>


        {/* HERO CONTENT */}

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute bottom-0 max-w-6xl px-6 pb-16 mx-auto text-white -translate-x-1/2 left-1/2"
        >

          <h1 className="mb-6 text-4xl font-bold md:text-5xl">
            How Tryvora Works
          </h1>

          <p className="max-w-2xl text-gray-200">
            Tryvora uses artificial intelligence to generate virtual
            clothing try-on previews. Follow these simple steps to see
            how outfits look on you before buying them.
          </p>

        </motion.div>

      </div>



      <div className="max-w-6xl px-6 mx-auto">


        {/* STEP PROCESS */}

        <div className="grid gap-10 mb-24 md:grid-cols-4">


          {/* STEP 1 */}

          <motion.div
            whileHover={{ y: -8 }}
            className="p-8 text-center transition bg-white shadow-sm rounded-xl hover:shadow-xl"
          >

            <Upload className="w-10 h-10 mx-auto mb-4 text-black" />

            <h3 className="mb-2 text-lg font-semibold">
              Upload Image
            </h3>

            <p className="text-sm text-gray-600">
              Upload a clear photo of yourself to begin the
              virtual try-on experience.
            </p>

          </motion.div>



          {/* STEP 2 */}

          <motion.div
            whileHover={{ y: -8 }}
            className="p-8 text-center transition bg-white shadow-sm rounded-xl hover:shadow-xl"
          >

            <Shirt className="w-10 h-10 mx-auto mb-4 text-black" />

            <h3 className="mb-2 text-lg font-semibold">
              Select Clothing
            </h3>

            <p className="text-sm text-gray-600">
              Choose an outfit from the clothing options
              available in the system.
            </p>

          </motion.div>



          {/* STEP 3 */}

          <motion.div
            whileHover={{ y: -8 }}
            className="p-8 text-center transition bg-white shadow-sm rounded-xl hover:shadow-xl"
          >

            <Cpu className="w-10 h-10 mx-auto mb-4 text-black" />

            <h3 className="mb-2 text-lg font-semibold">
              AI Processing
            </h3>

            <p className="text-sm text-gray-600">
              Our AI overlays the clothing onto your image
              to generate a realistic 2D try-on result.
            </p>

          </motion.div>



          {/* STEP 4 */}

          <motion.div
            whileHover={{ y: -8 }}
            className="p-8 text-center transition bg-white shadow-sm rounded-xl hover:shadow-xl"
          >

            <Image className="w-10 h-10 mx-auto mb-4 text-black" />

            <h3 className="mb-2 text-lg font-semibold">
              View Result
            </h3>

            <p className="text-sm text-gray-600">
              See how the outfit looks on you and explore
              different clothing styles instantly.
            </p>

          </motion.div>

        </div>



        {/* 2D WORKFLOW SECTION */}

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="p-12 text-center bg-white shadow-sm rounded-xl"
        >

          <h2 className="mb-8 text-3xl font-semibold">
            How 2D Virtual Try-On Works
          </h2>

          <p className="max-w-3xl mx-auto mb-10 text-gray-600">
            The Tryvora AI model analyzes your uploaded image
            and aligns the selected clothing onto your body
            to generate a realistic virtual try-on preview.
          </p>


          {/* FLOW DIAGRAM */}

          <div className="flex flex-col items-center justify-center gap-6 md:flex-row">

            <div className="px-6 py-4 bg-gray-100 rounded-lg">
              User Photo
            </div>

            <span className="text-xl">+</span>

            <div className="px-6 py-4 bg-gray-100 rounded-lg">
              Clothing PNG
            </div>

            <span className="text-xl">→</span>

            <div className="px-6 py-4 bg-gray-100 rounded-lg">
              AI Processing
            </div>

            <span className="text-xl">→</span>

            <div className="px-6 py-4 font-medium text-white bg-black rounded-lg">
              Try-On Result
            </div>

          </div>

        </motion.div>



        {/* BENEFITS */}

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-24 text-center"
        >

          <h2 className="mb-6 text-3xl font-semibold">
            Why Use Tryvora?
          </h2>

          <div className="grid max-w-4xl gap-6 mx-auto text-gray-600 md:grid-cols-3">

            <div className="p-6 bg-white shadow-sm rounded-xl">
              Save time by trying outfits instantly online.
            </div>

            <div className="p-6 bg-white shadow-sm rounded-xl">
              Make better fashion decisions before buying.
            </div>

            <div className="p-6 bg-white shadow-sm rounded-xl">
              Experience AI-powered virtual fitting technology.
            </div>

          </div>

        </motion.div>


      </div>

    </div>

  );
}

export default HowItWorks;