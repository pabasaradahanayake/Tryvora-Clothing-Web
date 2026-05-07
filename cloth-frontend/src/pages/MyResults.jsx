import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const API_BASE = "http://127.0.0.1:8000";

function MyResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("results_history") || "[]");
      setResults(Array.isArray(stored) ? stored : []);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen pt-32 pb-20 bg-slate-50">
      <div className="px-6 mx-auto max-w-7xl">

        {/* HEADER */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-4xl font-bold text-center text-slate-900"
        >
          My Results
        </motion.h1>

        {loading && (
          <p className="text-center text-slate-500">Loading...</p>
        )}

        {!loading && results.length === 0 && (
          <p className="text-center text-slate-500">
            No saved results yet.
          </p>
        )}

        {/* GRID */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">

          {results.map((item, index) => {

            const chest = item?.chest_estimate_cm || 0;
            const waist = item?.waist_estimate_cm || 0;
            const shoulder = item?.shoulder_width_cm || 0;

            const status = item?.match_status || "Poor Fit";
            const message = item?.feedback_text || "";
            const recommendation = item?.recommendation || "";

            let color = "red";
            if (status.includes("Excellent")) color = "green";
            else if (status.includes("Moderate")) color = "yellow";

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                className="overflow-hidden transition bg-white shadow-lg rounded-2xl hover:shadow-xl"
              >

                {/* IMAGE */}
                <div className="flex items-center justify-center h-[260px] bg-slate-100">
                  {item.preview_image_url ? (
                    <img
                      src={`${API_BASE}${item.preview_image_url}`}
                      alt="result"
                      className="object-contain h-full"
                    />
                  ) : (
                    <p className="text-sm text-slate-400">No Image</p>
                  )}
                </div>

                <div className="p-5">

                  {/* TITLE */}
                  <h2 className="mb-4 text-lg font-semibold text-slate-800">
                    Try-On Result #{index + 1}
                  </h2>

                  {/* MEASUREMENTS */}
                  <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
                    <div className="p-2 rounded bg-slate-100">
                      <p className="text-slate-500">Chest</p>
                      <p className="font-semibold">{chest.toFixed(1)} cm</p>
                    </div>

                    <div className="p-2 rounded bg-slate-100">
                      <p className="text-slate-500">Waist</p>
                      <p className="font-semibold">{waist.toFixed(1)} cm</p>
                    </div>

                    <div className="p-2 rounded bg-slate-100">
                      <p className="text-slate-500">Shoulder</p>
                      <p className="font-semibold">{shoulder.toFixed(1)} cm</p>
                    </div>
                  </div>

                  {/* STATUS BADGE */}
                  <div className="mb-3">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      color === "green"
                        ? "bg-green-100 text-green-700"
                        : color === "yellow"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {status}
                    </span>
                  </div>

                  {/* MESSAGE */}
                  <p className="mb-4 text-sm text-slate-600">
                    {message}
                  </p>

                  {/* RECOMMENDATION */}
                  {recommendation && (
                    <div className="p-3 border border-blue-200 rounded-lg bg-blue-50">
                      <p className="text-sm font-semibold text-blue-800">
                        {recommendation}
                      </p>
                    </div>
                  )}

                </div>
              </motion.div>
            );
          })}

        </div>
      </div>
    </div>
  );
}

export default MyResults;