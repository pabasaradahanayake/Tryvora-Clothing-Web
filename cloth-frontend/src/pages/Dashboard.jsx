import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function Dashboard() {

  const navigate = useNavigate();
  const MotionDiv = motion.div;

  return (

    <div className="min-h-screen pt-32 pb-20">

      <div className="w-full px-10">

        {/* 🔥 WELCOME */}
        <MotionDiv
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-left"
        >
          <h1 className="mb-3 text-4xl font-bold">
            Welcome to Tryvora 👋
          </h1>
          <p className="max-w-lg text-gray-500">
            Experience AI-powered virtual clothing try-on in seconds.
          </p>
        </MotionDiv>


        {/* 🔥 HERO SECTION */}
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative mb-16 overflow-hidden shadow-lg rounded-xl"
        >

          <img
            src="/images/dash-bg.webp"
            alt="fashion"
            className="w-full h-[350px] object-cover"
          />

          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white bg-black/50">

            <h2 className="mb-4 text-3xl font-bold">
              Try Clothes Instantly
            </h2>

            <p className="max-w-md mb-6 text-sm">
              Upload your photo and see how outfits fit your body using AI technology.
            </p>

            <button
              onClick={() => navigate("/tryon")}
              className="px-8 py-3 font-semibold text-black transition bg-white rounded-lg hover:bg-gray-200"
            >
              Start Try-On
            </button>

          </div>

        </MotionDiv>


        {/* 🔥 QUICK ACTIONS (FIXED WIDTH + CENTERED) */}
        <div className="flex justify-center">

          <MotionDiv
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md p-6 bg-white shadow-sm rounded-xl"
          >

            <h3 className="mb-4 text-lg font-semibold text-center">
              Quick Actions
            </h3>

            <div className="flex flex-col gap-3">

              <button
                onClick={() => navigate("/tryon")}
                className="w-full py-3 text-white transition bg-black rounded-lg hover:bg-gray-900"
              >
                New Try-On
              </button>

              <button
                onClick={() => navigate("/results")}
                className="w-full py-3 transition border border-black rounded-lg hover:bg-black hover:text-white"
              >
                View My Results
              </button>

            </div>

          </MotionDiv>

        </div>

      </div>

    </div>

  );
}

export default Dashboard;