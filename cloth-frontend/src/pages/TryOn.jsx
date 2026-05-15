import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000";

const UI_CATEGORIES = {
  male: ["shirt", "tshirt", "pants"],
  female: ["dress", "skirt"],
};

const SIZE_OPTIONS = {
  shirt: ["S", "M", "L", "XL"],
  tshirt: ["S", "M", "L", "XL"],
  dress: ["S", "M", "L", "XL"],
  skirt: ["S", "M", "L", "XL"],
  pants: ["28", "30", "32", "34", "36"],
  upper_body: ["S", "M", "L", "XL"],
  full_body: ["S", "M", "L", "XL"],
  lower_body: ["28", "30", "32", "34", "36"],
};

const detectDisplayCategory = (item) => {
  const name = (item.name || "").toLowerCase();
  const path = (item.path || "").toLowerCase();

  if (name.includes("tshirt") || path.includes("tshirt")) return "tshirt";
  if (name.includes("shirt") || path.includes("shirt")) return "shirt";
  if (name.includes("pants") || path.includes("pants")) return "pants";
  if (name.includes("dress") || path.includes("dress")) return "dress";
  if (name.includes("skirt") || path.includes("skirt")) return "skirt";

  if (item.gender === "male" && item.category === "upper_body") return "shirt";
  if (item.gender === "male" && item.category === "lower_body") return "pants";
  if (item.gender === "female" && item.category === "full_body") return "dress";
  if (item.gender === "female" && item.category === "lower_body") return "skirt";

  return item.category;
};

const getToken = () => {
  let token = localStorage.getItem("token");
  if (!token) return null;
  return token.replace(/"/g, "").trim();
};

const normalizePath = (path = "") =>
  path.replace(API_BASE, "").replace(/^\/+/, "").toLowerCase();

function TryOn() {
  const navigate = useNavigate();

  const [gender, setGender] = useState("");
  const [category, setCategory] = useState("");

  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const [allClothingOptions, setAllClothingOptions] = useState([]);
  const [allStaticClothes, setAllStaticClothes] = useState([]);
  const [images, setImages] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  const [result, setResult] = useState(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const staticClothesWithDisplayCategory = useMemo(
    () =>
      allStaticClothes.map((item) => ({
        ...item,
        displayCategory: detectDisplayCategory(item),
      })),
    [allStaticClothes]
  );

  const categories = useMemo(() => {
    if (!gender) return [];

    return [
      ...new Set(
        staticClothesWithDisplayCategory
          .filter((item) => item.gender === gender)
          .filter((item) =>
            UI_CATEGORIES[gender]?.includes(item.displayCategory)
          )
          .map((item) => item.displayCategory)
      ),
    ];
  }, [staticClothesWithDisplayCategory, gender]);

  useEffect(() => {
    const loadClothingOptions = async () => {
      const token = getToken();

      if (!token) {
        setErrorMessage("Please login first to load clothing options.");
        return;
      }

      try {
        setLoadingOptions(true);
        setErrorMessage("");

        const [optionsRes, clothesRes] = await Promise.all([
          axios.get(`${API_BASE}/analyze/clothing-options`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          axios.get(`${API_BASE}/clothes`),
        ]);

        setAllClothingOptions(optionsRes.data?.cloths || []);
        setAllStaticClothes(clothesRes.data || []);
      } catch (err) {
        const detail = err?.response?.data?.detail;
        setErrorMessage(
          typeof detail === "string"
            ? detail
            : "Failed to load clothing options from server."
        );
      } finally {
        setLoadingOptions(false);
      }
    };

    loadClothingOptions();
  }, []);

  useEffect(() => {
    if (!gender || !category) {
      setImages([]);
      setSelectedItem(null);
      return;
    }

    const matched = staticClothesWithDisplayCategory
      .filter(
        (item) =>
          item.gender === gender &&
          item.displayCategory === category &&
          UI_CATEGORIES[gender]?.includes(item.displayCategory)
      )
      .map((staticItem, index) => {
        const staticPath = normalizePath(
          staticItem.path
            ? `static/clothing_pngs/${staticItem.path}`
            : staticItem.image_url
        );

        const backendItem = allClothingOptions.find((option) => {
          const optionPath = normalizePath(option?.image_url || "");
          return optionPath === staticPath || optionPath.endsWith(staticPath);
        });

        return {
          id: backendItem?.id || `static-${index}-${staticItem.name}`,
          backendId: backendItem?.id || null,
          name: staticItem.name,
          image_url: staticItem.image_url,
          gender: staticItem.gender,
          category: staticItem.displayCategory,
          price: Number(staticItem.price || 0),
          backendItem: backendItem || null,
        };
      });

    setImages(matched);

    if (!matched.some((item) => item.id === selectedItem?.id)) {
      setSelectedItem(null);
    }
  }, [
    allClothingOptions,
    staticClothesWithDisplayCategory,
    category,
    gender,
    selectedItem?.id,
  ]);

  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setErrorMessage("");
  };

  const generateTryOn = async () => {
    if (!imageFile) {
      setErrorMessage("Please upload your photo first.");
      return;
    }

    if (!selectedItem) {
      setErrorMessage("Please select one clothing item.");
      return;
    }

    if (!selectedItem.backendId) {
      setErrorMessage(
        "This clothing item is visible, but it is not available for AI try-on yet. Please refresh the page or check backend clothing options."
      );
      return;
    }

    const token = getToken();

    if (!token) {
      setErrorMessage("Please login first.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      setResult(null);
      setSelectedSize("");

      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("clothing_id", String(selectedItem.backendId));

      const response = await axios.post(`${API_BASE}/analyze`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;

      if (
        data?.selected_clothing?.id &&
        data.selected_clothing.id !== selectedItem.backendId
      ) {
        setErrorMessage(
          "Selected clothing mismatch detected from server response. Please try again."
        );
      }

      const invalidMeasurements =
        !data?.chest_estimate_cm ||
        !data?.waist_estimate_cm ||
        !data?.shoulder_width_cm ||
        data.chest_estimate_cm < 20 ||
        data.waist_estimate_cm < 10 ||
        data.shoulder_width_cm < 10;

      if (invalidMeasurements) {
        setResult(null);
        setErrorMessage(
          "Invalid image uploaded. Please upload a clear full-body male or female photo."
        );
        return;
      }

      setResult(data);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setErrorMessage(
        typeof detail === "string"
          ? detail
          : "Error generating try-on. Please check your image and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const chest = result?.chest_estimate_cm || 0;
  const waist = result?.waist_estimate_cm || 0;
  const shoulder = result?.shoulder_width_cm || 0;

  const clothingType =
    selectedItem?.category ||
    selectedItem?.backendItem?.type ||
    selectedItem?.backendItem?.category ||
    "generic";

  const clothingId = selectedItem?.backendId || 1;

  let score = 0;

  const chestShoulderRatio = chest / (shoulder || 1);
  const waistChestRatio = waist / (chest || 1);

  if (chestShoulderRatio >= 1.9 && chestShoulderRatio <= 2.2) score += 25;
  else if (chestShoulderRatio >= 1.7 && chestShoulderRatio <= 2.5) score += 10;
  else score -= 20;

  if (waistChestRatio >= 0.45 && waistChestRatio <= 0.6) score += 25;
  else if (waistChestRatio >= 0.35 && waistChestRatio <= 0.7) score += 10;
  else score -= 20;

  if (
    clothingType === "shirt" ||
    clothingType === "tshirt" ||
    clothingType === "upper_body"
  ) {
    if (shoulder >= 26 && shoulder <= 55) score += 15;
    else score -= 10;
  }

  if (
    clothingType === "pants" ||
    clothingType === "skirt" ||
    clothingType === "lower_body"
  ) {
    if (waist >= 28 && waist <= 90) score += 15;
    else score -= 10;
  }

  if (clothingType === "dress" || clothingType === "full_body") {
    if (chest > waist && waistChestRatio < 0.65) score += 15;
    else score -= 10;
  }

  score += ((clothingId % 5) - 2) * 6;

  const fitScore = Math.max(0, Math.min(100, score + 15));

  let status = "";
  let message = "";
  let color = "";
  let baseSize = "";

  if (
    clothingType === "shirt" ||
    clothingType === "tshirt" ||
    clothingType === "dress" ||
    clothingType === "skirt" ||
    clothingType === "upper_body" ||
    clothingType === "full_body"
  ) {
    if (chest < 55) baseSize = "S";
    else if (chest >= 55 && chest < 65) baseSize = "M";
    else if (chest >= 65 && chest < 75) baseSize = "L";
    else baseSize = "XL";
  }

  if (clothingType === "pants" || clothingType === "lower_body") {
    if (waist < 28) baseSize = "28";
    else if (waist < 30) baseSize = "30";
    else if (waist < 34) baseSize = "32";
    else if (waist < 36) baseSize = "34";
    else baseSize = "36";
  }

  if (!baseSize && result?.recommended_size) {
    baseSize = result.recommended_size;
  }

  if (!baseSize) {
    baseSize = "S";
  }

  if (fitScore >= 70) {
    status = "Excellent Fit";
    message =
      "This outfit suits your body shape well and looks balanced overall.";
    color = "green";
  } else if (fitScore >= 45) {
    status = "Moderate Fit";
    message =
      "This outfit is an average match. Some areas look good, but others may feel slightly off.";
    color = "yellow";
  } else {
    status = "Poor Fit";
    message =
      "This outfit may not suit your body shape well. Trying a different style could give a better result.";
    color = "red";
  }

  let recommendation = "";

  if (status.includes("Excellent")) {
    recommendation = `Recommended Size: ${baseSize}`;
  } else if (status.includes("Moderate")) {
    if (clothingType === "pants" || clothingType === "lower_body") {
      const newSize = parseInt(baseSize, 10) + 2;
      recommendation = `Recommended Size: ${newSize}`;
    } else {
      const sizeMap = ["S", "M", "L", "XL"];
      let index = sizeMap.indexOf(baseSize);

      if (index < sizeMap.length - 1) {
        recommendation = `Recommended Size: ${sizeMap[index + 1]}`;
      } else {
        recommendation = `Recommended Size: ${baseSize}`;
      }
    }
  } else {
    recommendation =
      "This item may not suit your body well. Try a different size or style.";
  }

  const recommendedSizeValue = recommendation
    .replace("Recommended Size:", "")
    .trim();

  const sizeOptions = SIZE_OPTIONS[clothingType] || ["S", "M", "L", "XL"];

  const selectedFeedback = useMemo(() => {
    if (!result) return null;
    return { status, text: message };
  }, [result, status, message]);

  const addToCart = () => {
    if (!result) return;

    if (!selectedSize) {
      setErrorMessage("Please select your preferred size before adding to cart.");
      return;
    }

    let existingCart = [];

    try {
      const parsedCart = JSON.parse(localStorage.getItem("cart") || "[]");
      existingCart = Array.isArray(parsedCart) ? parsedCart : [];
    } catch {
      existingCart = [];
    }

    const cartItem = {
      ...result,
      selected_clothing: result.selected_clothing || selectedItem?.backendItem,
      cloth_name: selectedItem?.name || "Fashion Item",
      cloth_category: selectedItem?.category || clothingType,
      match_status: selectedFeedback?.status || "Good Fit",
      feedback_text:
        selectedFeedback?.text ||
        "This clothing item matches your body shape well and gives a balanced appearance.",
      recommendation,
      recommended_size: recommendedSizeValue,
      selected_size: selectedSize,
      price: Number(selectedItem?.price || 0),
      added_at: new Date().toISOString(),
    };

    const updatedCart = [cartItem, ...existingCart];
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    navigate("/cart");
  };

  return (
    <div className="min-h-screen pt-32 pb-20 bg-slate-50">
      <div className="max-w-6xl px-6 mx-auto">
        <h1 className="mb-8 text-4xl font-bold text-center text-slate-900">
          Virtual Try-On
        </h1>

        {errorMessage && (
          <div className="p-4 mb-6 text-sm font-medium text-red-700 border border-red-200 rounded-lg bg-red-50">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2">
          <div className="p-6 bg-white shadow rounded-xl">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">
              1. Upload Your Photo
            </h2>

            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="w-full"
            />

            {preview && (
              <img
                src={preview}
                alt="Uploaded preview"
                className="mt-4 max-h-[280px] mx-auto rounded-lg object-contain"
              />
            )}
          </div>

          <div className="p-6 bg-white shadow rounded-xl">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">
              2. Select Options
            </h2>

            <label className="block mb-2 text-sm font-medium text-slate-700">
              Gender
            </label>

            <select
              value={gender}
              className="w-full p-3 mb-4 border rounded border-slate-300"
              onChange={(e) => {
                setGender(e.target.value);
                setCategory("");
                setSelectedItem(null);
                setImages([]);
                setResult(null);
                setSelectedSize("");
                setErrorMessage("");
              }}
            >
              <option value="">Select Gender</option>
              {[...new Set(staticClothesWithDisplayCategory.map((item) => item.gender))].map(
                (itemGender) => (
                  <option key={itemGender} value={itemGender}>
                    {itemGender}
                  </option>
                )
              )}
            </select>

            <label className="block mb-2 text-sm font-medium text-slate-700">
              Category
            </label>

            <select
              value={category}
              disabled={!gender}
              className="w-full p-3 mb-4 border rounded border-slate-300 disabled:bg-slate-100"
              onChange={(e) => {
                setCategory(e.target.value);
                setSelectedItem(null);
                setResult(null);
                setSelectedSize("");
                setErrorMessage("");
              }}
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {loadingOptions && (
              <p className="mt-3 text-sm text-slate-600">
                Loading clothing options from server...
              </p>
            )}
          </div>
        </div>

        <div className="p-6 mb-8 bg-white shadow rounded-xl">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            3. Choose Clothing
          </h2>

          {!gender || !category ? (
            <p className="text-slate-600">
              Select gender and category to load clothes.
            </p>
          ) : images.length === 0 ? (
            <p className="text-slate-600">
              No matching clothing items found for this category.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {images.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => {
                    setSelectedItem(item);
                    setResult(null);
                    setSelectedSize("");
                    setErrorMessage("");
                  }}
                  className={`relative h-[210px] p-2 border rounded-lg transition ${
                    selectedItem?.id === item.id
                      ? "border-slate-900 ring-2 ring-slate-800 bg-slate-100"
                      : "border-slate-300 hover:border-slate-500 bg-white"
                  }`}
                >
                  <img
                    src={item.image_url}
                    alt={item.name || `Clothing ${item.id}`}
                    className="object-contain w-full h-full"
                  />

                  <span className="absolute px-2 py-1 text-xs font-semibold rounded top-2 left-2 bg-slate-900 text-slate-100">
                    {item.backendId ? `ID: ${item.backendId}` : "New"}
                  </span>

                  <span className="absolute px-2 py-1 text-xs font-semibold text-green-700 rounded bottom-2 left-2 bg-green-100">
                    Rs. {Number(item.price || 0).toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-center mb-8">
          <button
            onClick={generateTryOn}
            disabled={loading || loadingOptions || !imageFile || !selectedItem}
            className="px-10 py-3 font-semibold text-white transition rounded bg-slate-900 disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            {loading ? "Generating..." : "Generate Try-On"}
          </button>
        </div>

        {result && (
          <div className="grid grid-cols-1 gap-6 pb-10 lg:grid-cols-2">
            <div className="p-6 bg-white shadow rounded-xl">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">
                AI Try-On Result
              </h2>

              {result.preview_image_url ? (
                <img
                  src={`${API_BASE}${result.preview_image_url}`}
                  alt="AI try-on result"
                  className="w-full rounded-lg max-h-[560px] object-contain"
                />
              ) : (
                <p className="text-slate-600">
                  No preview image generated. Please ensure body landmarks are
                  visible in your photo.
                </p>
              )}
            </div>

            <div className="p-6 bg-white shadow rounded-xl">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">
                Measurements & Fit
              </h2>

              <div className="grid grid-cols-2 gap-3 mb-6 text-sm sm:grid-cols-4">
                <div className="p-3 rounded bg-slate-100">
                  <p className="text-slate-600">Chest</p>
                  <p className="font-semibold text-slate-900">
                    {result.chest_estimate_cm
                      ? `${result.chest_estimate_cm.toFixed(1)} cm`
                      : "-"}
                  </p>
                </div>

                <div className="p-3 rounded bg-slate-100">
                  <p className="text-slate-600">Waist</p>
                  <p className="font-semibold text-slate-900">
                    {result.waist_estimate_cm
                      ? `${result.waist_estimate_cm.toFixed(1)} cm`
                      : "-"}
                  </p>
                </div>

                <div className="p-3 rounded bg-slate-100">
                  <p className="text-slate-600">Shoulder</p>
                  <p className="font-semibold text-slate-900">
                    {result.shoulder_width_cm
                      ? `${result.shoulder_width_cm.toFixed(1)} cm`
                      : "-"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowPreviewModal(true)}
                className="w-full px-4 py-2 mb-6 text-sm font-medium text-white transition rounded-lg bg-slate-700 hover:bg-slate-800"
              >
                View 2D Preview
              </button>

              <div
                className={`p-4 rounded-lg ${
                  color === "green"
                    ? "bg-green-50"
                    : color === "yellow"
                    ? "bg-yellow-50"
                    : "bg-red-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      color === "green"
                        ? "bg-green-500"
                        : color === "yellow"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                  ></span>

                  <p
                    className={`font-semibold ${
                      color === "green"
                        ? "text-green-700"
                        : color === "yellow"
                        ? "text-yellow-700"
                        : "text-red-700"
                    }`}
                  >
                    {status}
                  </p>
                </div>

                <p
                  className={`text-sm font-medium ${
                    color === "green"
                      ? "text-green-800"
                      : color === "yellow"
                      ? "text-yellow-800"
                      : "text-red-800"
                  }`}
                >
                  {message}
                </p>

                {recommendation && (
                  <div className="p-3 mt-3 border border-blue-300 rounded bg-blue-50">
                    <p className="text-sm font-semibold text-blue-800">
                      {recommendation}
                    </p>
                  </div>
                )}

                <div className="p-3 mt-3 border border-green-300 rounded bg-green-50">
                  <p className="text-sm font-semibold text-green-800">
                    Price: Rs. {Number(selectedItem?.price || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <label className="block mb-2 text-sm font-semibold text-slate-700">
                  Choose Your Size
                </label>

                <select
                  value={selectedSize}
                  onChange={(e) => {
                    setSelectedSize(e.target.value);
                    setErrorMessage("");
                  }}
                  className="w-full p-3 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="">Select Size</option>
                  {sizeOptions.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={addToCart}
                className="w-full px-4 py-3 mt-6 text-sm font-semibold text-white transition rounded-lg bg-slate-900 hover:bg-slate-800"
              >
                Add to Cart
              </button>
            </div>
          </div>
        )}
      </div>

      {showPreviewModal && result?.preview_image_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setShowPreviewModal(false)}
        >
          <div
            className="relative bg-white rounded-lg shadow-lg p-6 max-w-2xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowPreviewModal(false)}
              className="absolute flex items-center justify-center w-8 h-8 text-2xl transition top-4 right-4 text-slate-600 hover:text-slate-900"
            >
              ✕
            </button>

            <h3 className="mb-4 text-xl font-semibold text-slate-900">
              2D Try-On Preview
            </h3>

            <img
              src={`${API_BASE}${result.preview_image_url}`}
              alt="2D Try-On Preview"
              className="w-full rounded-lg object-contain max-h-[70vh]"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default TryOn;