import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, ShoppingBag, ShieldCheck, ArrowRight } from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

function Cart() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    try {
      const savedCart = JSON.parse(localStorage.getItem("cart") || "[]");
      setCartItems(Array.isArray(savedCart) ? savedCart : []);
    } catch {
      setCartItems([]);
    }
  }, []);

  const removeItem = (indexToRemove) => {
    const updatedCart = cartItems.filter(
      (_, index) => index !== indexToRemove
    );

    setCartItems(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.price || 0),
    0
  );
  const shipping = cartItems.length > 0 ? 500 : 0;
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen pt-32 pb-20 bg-gradient-to-br from-[#F4F7FB] via-white to-[#EEF3F8]">
      <div className="max-w-7xl px-6 mx-auto">
        {/* HEADER */}
        <div className="flex flex-col gap-5 mb-10 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold tracking-[0.25em] text-gray-500 uppercase">
              Shopping Cart
            </p>

            <h1 className="mt-2 text-5xl font-black tracking-tight text-gray-950">
              Your Cart
            </h1>

            <p className="mt-3 text-base text-gray-600">
              Review your selected virtual try-on outfits before checkout.
            </p>
          </div>

          <div className="flex items-center gap-4 px-5 py-4 bg-white border border-gray-200 shadow-sm rounded-3xl">
            <div className="flex items-center justify-center w-14 h-14 text-white bg-black shadow-lg rounded-2xl">
              <ShoppingBag size={24} />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Total Items</p>
              <h2 className="text-3xl font-black text-gray-900">
                {cartItems.length}
              </h2>
            </div>
          </div>
        </div>

        {/* EMPTY CART */}
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white border border-gray-200 shadow-sm rounded-[36px]">
            <div className="flex items-center justify-center w-24 h-24 mb-6 text-white bg-black rounded-full shadow-xl">
              <ShoppingBag size={38} />
            </div>

            <h2 className="text-3xl font-black text-gray-900">
              Your Cart is Empty
            </h2>

            <p className="max-w-md mt-4 text-gray-500">
              No virtual try-on outfits have been added yet. Generate a try-on
              result and add it to your cart.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* CART ITEMS */}
            <div className="lg:col-span-2">
              <div className="flex flex-col gap-7">
                {cartItems.map((item, index) => (
                  <div
                    key={index}
                    className="overflow-hidden transition bg-white border border-gray-200 shadow-sm rounded-[36px] hover:shadow-xl"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-[320px_1fr]">
                      {/* IMAGE */}
                      <div className="flex items-center justify-center p-6 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200">
                        <img
                          src={
                            item.preview_image_url?.startsWith("http")
                              ? item.preview_image_url
                              : `${API_BASE}${item.preview_image_url}`
                          }
                          alt="Try-On Result"
                          className="object-contain w-full rounded-3xl max-h-[430px]"
                        />
                      </div>

                      {/* DETAILS */}
                      <div className="flex flex-col justify-between p-7">
                        <div>
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase">
                                Virtual Try-On
                              </p>

                              <h2 className="mt-2 text-3xl font-black leading-tight text-gray-950">
                                {item.selected_clothing?.name ||
                                  item.cloth_name ||
                                  "Fashion Item"}
                              </h2>
                            </div>

                            <button
                              onClick={() => removeItem(index)}
                              className="flex items-center justify-center w-11 h-11 text-red-500 transition border border-red-200 rounded-2xl bg-red-50 hover:bg-red-100"
                            >
                              <Trash2 size={19} />
                            </button>
                          </div>

                          {/* TAGS */}
                          <div className="flex flex-wrap gap-3 mt-6">
                            <span className="px-4 py-2 text-sm font-bold text-blue-700 bg-blue-100 rounded-full">
                              {item.cloth_category ||
                                item.selected_clothing?.category ||
                                "Clothing"}
                            </span>

                            <span className="px-4 py-2 text-sm font-bold text-green-700 bg-green-100 rounded-full">
                              {item.match_status || "Good Fit"}
                            </span>
                          </div>

                          {/* SIZE INFO */}
                          <div className="grid grid-cols-2 gap-4 mt-8">
                            <div className="p-5 border border-gray-200 rounded-3xl bg-gray-50">
                              <p className="text-sm font-semibold text-gray-500">
                                Recommended Size
                              </p>

                              <h3 className="mt-2 text-3xl font-black text-gray-950">
                                {item.recommended_size ||
                                  item.recommendation ||
                                  "M"}
                              </h3>
                            </div>

                            <div className="p-5 border border-gray-200 rounded-3xl bg-gray-50">
                              <p className="text-sm font-semibold text-gray-500">
                                Selected Size
                              </p>

                              <h3 className="mt-2 text-3xl font-black text-gray-950">
                                {item.selected_size || "M"}
                              </h3>
                            </div>
                          </div>

                          {/* FEEDBACK */}
                          <div className="p-5 mt-6 border border-gray-200 rounded-3xl bg-slate-50">
                            <p className="text-xs font-bold tracking-[0.2em] text-gray-500 uppercase">
                              AI Feedback
                            </p>

                            <p className="mt-3 text-sm leading-7 text-gray-700">
                              {item.feedback_text ||
                                "This clothing item matches your body shape well and gives a balanced appearance."}
                            </p>
                          </div>
                        </div>

                        {/* PRICE */}
                        <div className="flex flex-col gap-4 pt-7 mt-7 border-t border-gray-200 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-500">
                              Item Price
                            </p>

                            <h3 className="mt-1 text-4xl font-black text-gray-950">
                              Rs. {Number(item.price || 0).toFixed(2)}
                            </h3>
                          </div>

                          <button
                            onClick={() => navigate("/checkout")}
                            className="px-8 py-4 text-sm font-bold text-white transition bg-black shadow-lg rounded-2xl hover:bg-gray-900"
                          >
                            Buy Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ORDER SUMMARY */}
            <div>
              <div className="sticky p-7 bg-white border border-gray-200 shadow-xl top-32 rounded-[36px]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 text-white bg-black rounded-2xl">
                    <ShieldCheck size={22} />
                  </div>

                  <h2 className="text-3xl font-black text-gray-950">
                    Order Summary
                  </h2>
                </div>

                <div className="mt-8 space-y-5">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-500">Subtotal</p>
                    <h3 className="font-black text-gray-900">
                      Rs. {subtotal.toFixed(2)}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-500">Shipping</p>
                    <h3 className="font-black text-gray-900">
                      Rs. {shipping.toFixed(2)}
                    </h3>
                  </div>

                  <div className="pt-5 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold text-gray-900">Total</p>

                      <h2 className="text-4xl font-black text-gray-950">
                        Rs. {total.toFixed(2)}
                      </h2>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => navigate("/checkout")}
                  className="flex items-center justify-center w-full gap-2 py-4 mt-8 text-sm font-bold text-white transition bg-black shadow-lg rounded-2xl hover:bg-gray-900"
                >
                  Proceed to Checkout
                  <ArrowRight size={18} />
                </button>

                <p className="mt-5 text-xs leading-6 text-center text-gray-500">
                  Secure checkout experience for your selected virtual fashion
                  items.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Cart;