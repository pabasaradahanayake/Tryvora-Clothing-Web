import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";

const UI_CATEGORIES = {
  male: ["shirt", "tshirt", "pants"],
  female: ["dress", "skirt"],
};

const CATEGORY_TO_BACKEND = {
  shirt: "upper_body",
  tshirt: "upper_body",
  pants: "lower_body",
  dress: "full_body",
  skirt: "lower_body",
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

function ClothingManagement() {
  const [clothes, setClothes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedGender, setSelectedGender] = useState("all");

  const [showAddModal, setShowAddModal] = useState(false);
  const [newGender, setNewGender] = useState("male");
  const [newCategory, setNewCategory] = useState("shirt");
  const [newPrice, setNewPrice] = useState("");
  const [newFile, setNewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [editingPricePath, setEditingPricePath] = useState("");
  const [editingPriceValue, setEditingPriceValue] = useState("");
  const [updatingPrice, setUpdatingPrice] = useState(false);

  const loadClothes = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/clothes`);
      setClothes(res.data || []);
    } catch (err) {
      console.log("CLOTHES LOAD ERROR:", err);
      alert("Failed to load clothes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClothes();
  }, []);

  const clothesWithDisplayCategory = clothes.map((item) => ({
    ...item,
    displayCategory: detectDisplayCategory(item),
  }));

  const isAllowedCategoryForGender = (item) => {
    const allowedCategories = UI_CATEGORIES[item.gender];

    if (!allowedCategories) return false;

    return allowedCategories.includes(item.displayCategory);
  };

  const filteredClothes = clothesWithDisplayCategory.filter((item) => {
    if (!isAllowedCategoryForGender(item)) return false;

    const matchCategory =
      selectedCategory === "all" || item.displayCategory === selectedCategory;

    const matchGender =
      selectedGender === "all" || item.gender === selectedGender;

    return matchCategory && matchGender;
  });

  const allowedCategoriesForSelectedGender =
    selectedGender === "all"
      ? ["shirt", "tshirt", "pants", "dress", "skirt"]
      : UI_CATEGORIES[selectedGender] || [];

  const categories = [
    "all",
    ...new Set(
      clothesWithDisplayCategory
        .filter((item) => isAllowedCategoryForGender(item))
        .map((item) => item.displayCategory)
        .filter((category) =>
          selectedGender === "all"
            ? true
            : allowedCategoriesForSelectedGender.includes(category)
        )
    ),
  ];

  const genders = [
    "all",
    ...new Set(clothesWithDisplayCategory.map((item) => item.gender)),
  ];

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];

    setNewFile(file || null);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl("");
    }
  };

  const resetAddForm = () => {
    setNewGender("male");
    setNewCategory("shirt");
    setNewPrice("");
    setNewFile(null);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl("");
  };

  const closeAddModal = () => {
    resetAddForm();
    setShowAddModal(false);
  };

  const uploadCloth = async (e) => {
    e.preventDefault();

    if (!newFile) {
      alert("Please select a clothing image.");
      return;
    }

    if (newPrice === "" || Number(newPrice) < 0) {
      alert("Please enter a valid price.");
      return;
    }

    try {
      setUploading(true);

      const backendCategory = CATEGORY_TO_BACKEND[newCategory];

      const formData = new FormData();
      formData.append("gender", newGender);
      formData.append("category", backendCategory);
      formData.append("price", Number(newPrice));
      formData.append("file", newFile);

      await axios.post(`${API_BASE}/clothes/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      await loadClothes();
      closeAddModal();
      alert("Clothing item added successfully.");
    } catch (err) {
      console.log("UPLOAD ERROR:", err.response?.data || err);
      alert(err.response?.data?.detail || "Failed to upload clothing item.");
    } finally {
      setUploading(false);
    }
  };

  const startEditPrice = (item) => {
    setEditingPricePath(item.path);
    setEditingPriceValue(String(item.price || 0));
  };

  const cancelEditPrice = () => {
    setEditingPricePath("");
    setEditingPriceValue("");
  };

  const updatePrice = async (item) => {
    if (editingPriceValue === "" || Number(editingPriceValue) < 0) {
      alert("Please enter a valid price.");
      return;
    }

    try {
      setUpdatingPrice(true);

      const formData = new FormData();
      formData.append("path", item.path);
      formData.append("price", Number(editingPriceValue));

      await axios.put(`${API_BASE}/clothes/price`, formData);

      await loadClothes();
      cancelEditPrice();
      alert("Price updated successfully.");
    } catch (err) {
      console.log("PRICE UPDATE ERROR:", err.response?.data || err);
      alert(err.response?.data?.detail || "Failed to update price.");
    } finally {
      setUpdatingPrice(false);
    }
  };

  const deleteCloth = async (item) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${item.name}?`
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_BASE}/clothes/delete`, {
        params: {
          path: item.path,
        },
      });

      await loadClothes();
      alert("Clothing item deleted successfully.");
    } catch (err) {
      console.log("DELETE CLOTH ERROR:", err.response?.data || err);
      alert(err.response?.data?.detail || "Failed to delete clothing item.");
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-5 mb-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-wide text-gray-500 uppercase">
            Admin Panel
          </p>
          <h1 className="mt-2 text-4xl font-bold text-gray-900">
            Clothing Management
          </h1>
          <p className="mt-2 text-gray-600">
            Add, view, filter, and delete clothing items used for the virtual
            try-on system.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 text-sm font-semibold text-white transition bg-black shadow-lg rounded-2xl hover:bg-gray-900"
        >
          + Add Clothes
        </button>
      </div>

      <div className="grid gap-5 mb-8 md:grid-cols-3">
        <div className="p-6 bg-white border shadow-sm rounded-2xl">
          <p className="text-sm text-gray-500">Total Clothes</p>
          <h2 className="mt-2 text-3xl font-bold text-gray-900">
            {
              clothesWithDisplayCategory.filter((item) =>
                isAllowedCategoryForGender(item)
              ).length
            }
          </h2>
        </div>

        <div className="p-6 bg-white border shadow-sm rounded-2xl">
          <p className="text-sm text-gray-500">Categories</p>
          <h2 className="mt-2 text-3xl font-bold text-blue-600">
            {categories.length - 1}
          </h2>
        </div>

        <div className="p-6 bg-white border shadow-sm rounded-2xl">
          <p className="text-sm text-gray-500">Storage</p>
          <h2 className="mt-2 text-2xl font-bold text-green-600">Static</h2>
        </div>
      </div>

      <div className="p-5 mb-8 bg-white border shadow-sm rounded-2xl">
        <div className="mb-5">
          <p className="mb-3 text-sm font-semibold text-gray-700">
            Filter by Gender
          </p>

          <div className="flex flex-wrap gap-3">
            {genders.map((gender) => (
              <button
                key={gender}
                onClick={() => {
                  setSelectedGender(gender);
                  setSelectedCategory("all");
                }}
                className={`px-5 py-2 text-sm font-semibold rounded-full transition ${
                  selectedGender === gender
                    ? "bg-black text-white"
                    : "bg-white text-gray-700 border hover:bg-gray-100"
                }`}
              >
                {gender === "all" ? "All Gender" : gender}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-gray-700">
            Filter by Category
          </p>

          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-5 py-2 text-sm font-semibold rounded-full transition ${
                  selectedCategory === category
                    ? "bg-black text-white"
                    : "bg-white text-gray-700 border hover:bg-gray-100"
                }`}
              >
                {category === "all" ? "All Categories" : category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-10 text-center bg-white border shadow-sm rounded-2xl">
          <p className="text-gray-600">Loading clothes...</p>
        </div>
      ) : filteredClothes.length === 0 ? (
        <div className="p-10 text-center bg-white border shadow-sm rounded-2xl">
          <h2 className="text-lg font-semibold text-gray-900">
            No clothes found
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Clothing images will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredClothes.map((item, index) => (
            <div
              key={index}
              className="overflow-hidden transition bg-white border shadow-sm rounded-3xl hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex items-center justify-center h-64 bg-gradient-to-br from-gray-50 to-gray-200">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="object-contain w-full h-full p-5"
                />
              </div>

              <div className="p-5">
                <h2 className="text-sm font-bold text-gray-900 truncate">
                  {item.name}
                </h2>

                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full">
                    {item.gender}
                  </span>

                  <span className="px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">
                    {item.displayCategory}
                  </span>
                </div>

                <div className="p-4 mt-4 border rounded-2xl bg-gray-50">
                  <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    Price
                  </p>

                  {editingPricePath === item.path ? (
                    <div className="mt-3">
                      <input
                        type="number"
                        min="0"
                        value={editingPriceValue}
                        onChange={(e) => setEditingPriceValue(e.target.value)}
                        className="w-full px-4 py-2 text-sm border rounded-xl outline-none focus:ring-2 focus:ring-black"
                        placeholder="Enter price"
                      />

                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => updatePrice(item)}
                          disabled={updatingPrice}
                          className="flex-1 px-3 py-2 text-xs font-semibold text-white transition bg-black rounded-xl hover:bg-gray-900 disabled:bg-gray-400"
                        >
                          {updatingPrice ? "Saving..." : "Save"}
                        </button>

                        <button
                          onClick={cancelEditPrice}
                          className="flex-1 px-3 py-2 text-xs font-semibold text-gray-700 transition bg-white border rounded-xl hover:bg-gray-100"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mt-2">
                      <h3 className="text-2xl font-black text-gray-900">
                        Rs. {Number(item.price || 0).toFixed(2)}
                      </h3>

                      <button
                        onClick={() => startEditPrice(item)}
                        className="px-3 py-1.5 text-xs font-semibold text-blue-700 transition bg-blue-100 rounded-full hover:bg-blue-200"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => deleteCloth(item)}
                  className="w-full px-4 py-2.5 mt-5 text-sm font-semibold text-red-600 transition border border-red-200 rounded-full bg-red-50 hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden bg-white shadow-2xl rounded-3xl">
            <div className="flex items-center justify-between px-6 py-5 border-b">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Add New Clothes
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Upload a new clothing image to the try-on collection.
                </p>
              </div>

              <button
                onClick={closeAddModal}
                className="flex items-center justify-center w-10 h-10 text-xl font-bold text-gray-500 transition bg-gray-100 rounded-full hover:bg-gray-200"
              >
                ×
              </button>
            </div>

            <form onSubmit={uploadCloth} className="p-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">
                    Gender
                  </label>
                  <select
                    value={newGender}
                    onChange={(e) => {
                      const genderValue = e.target.value;
                      setNewGender(genderValue);
                      setNewCategory(UI_CATEGORIES[genderValue][0]);
                    }}
                    className="w-full px-4 py-3 text-sm border rounded-2xl outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="male">male</option>
                    <option value="female">female</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-4 py-3 text-sm border rounded-2xl outline-none focus:ring-2 focus:ring-black"
                  >
                    {UI_CATEGORIES[newGender].map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-5">
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Price
                </label>

                <input
                  type="number"
                  min="0"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full px-4 py-3 text-sm border rounded-2xl outline-none focus:ring-2 focus:ring-black"
                  placeholder="Enter clothing price"
                />
              </div>

              <div className="mt-5">
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Clothing Image
                </label>

                <label className="flex flex-col items-center justify-center w-full gap-3 px-6 py-8 text-center transition border-2 border-gray-300 border-dashed cursor-pointer rounded-3xl bg-gray-50 hover:bg-gray-100">
                  <span className="text-sm font-semibold text-gray-700">
                    Click to upload clothing image
                  </span>
                  <span className="text-xs text-gray-500">
                    PNG, JPG, JPEG, WEBP supported
                  </span>

                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {previewUrl && (
                <div className="mt-5">
                  <p className="mb-2 text-sm font-semibold text-gray-700">
                    Preview
                  </p>

                  <div className="flex items-center justify-center h-56 border rounded-3xl bg-gray-50">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="object-contain h-full p-4"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="px-6 py-3 text-sm font-semibold text-gray-700 transition bg-gray-100 rounded-2xl hover:bg-gray-200"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-3 text-sm font-semibold text-white transition bg-black rounded-2xl hover:bg-gray-900 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {uploading ? "Uploading..." : "Upload Clothes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClothingManagement;