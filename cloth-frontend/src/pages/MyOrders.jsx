import { useEffect, useState } from "react";
import { PackageCheck, ShoppingBag, CalendarDays, CreditCard } from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

function MyOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    try {
      const savedOrders = JSON.parse(localStorage.getItem("orders_history") || "[]");
      setOrders(Array.isArray(savedOrders) ? savedOrders : []);
    } catch {
      setOrders([]);
    }
  }, []);

  return (
    <div className="min-h-screen pt-32 pb-20 bg-gradient-to-br from-[#F4F7FB] via-white to-[#EEF3F8]">
      <div className="max-w-7xl px-6 mx-auto">
        <div className="flex flex-col gap-5 mb-10 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold tracking-[0.25em] text-gray-500 uppercase">
              Order History
            </p>

            <h1 className="mt-2 text-5xl font-black tracking-tight text-gray-950">
              My Orders
            </h1>

            <p className="mt-3 text-gray-600">
              View your current and previous Tryvora fashion orders.
            </p>
          </div>

          <div className="flex items-center gap-4 px-5 py-4 bg-white border border-gray-200 shadow-sm rounded-3xl">
            <div className="flex items-center justify-center w-14 h-14 text-white bg-black rounded-2xl">
              <ShoppingBag size={24} />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <h2 className="text-3xl font-black text-gray-900">
                {orders.length}
              </h2>
            </div>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white border border-gray-200 shadow-sm rounded-[36px]">
            <div className="flex items-center justify-center w-24 h-24 mb-6 text-white bg-black rounded-full shadow-xl">
              <PackageCheck size={38} />
            </div>

            <h2 className="text-3xl font-black text-gray-900">
              No Orders Found
            </h2>

            <p className="max-w-md mt-4 text-gray-500">
              Your placed orders will appear here after completing checkout.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {orders.map((order) => (
              <div
                key={order.id}
                className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-[36px]"
              >
                <div className="flex flex-col gap-5 p-7 border-b border-gray-200 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase">
                      Order ID
                    </p>

                    <h2 className="mt-2 text-2xl font-black text-gray-950">
                      {order.id || "TRY-ORDER"}
                    </h2>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-blue-700 bg-blue-100 rounded-full">
                      <CalendarDays size={16} />
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString()
                        : "N/A"}
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-purple-700 bg-purple-100 rounded-full">
                      <CreditCard size={16} />
                      {order.paymentMethod || "N/A"}
                    </div>

                    <div className="px-4 py-2 text-sm font-bold text-green-700 bg-green-100 rounded-full">
                      {order.orderStatus || "Placed"}
                    </div>
                  </div>
                </div>

                <div className="grid gap-8 p-7 lg:grid-cols-3">
                  <div className="space-y-5 lg:col-span-2">
                    {(order.items || []).map((item, index) => (
                      <div
                        key={index}
                        className="grid gap-5 p-5 border border-gray-200 rounded-3xl bg-gray-50 md:grid-cols-[160px_1fr]"
                      >
                        <div className="flex items-center justify-center bg-white border rounded-3xl">
                          <img
                            src={
                              item.preview_image_url?.startsWith("http")
                                ? item.preview_image_url
                                : `${API_BASE}${item.preview_image_url}`
                            }
                            alt="Order Item"
                            className="object-contain w-full h-44 p-3 rounded-3xl"
                          />
                        </div>

                        <div className="flex flex-col justify-between">
                          <div>
                            <h3 className="text-2xl font-black text-gray-950">
                              {item.cloth_name ||
                                item.selected_clothing?.name ||
                                "Fashion Item"}
                            </h3>

                            <div className="flex flex-wrap gap-2 mt-4">
                              <span className="px-3 py-1 text-xs font-bold text-blue-700 bg-blue-100 rounded-full">
                                {item.cloth_category ||
                                  item.selected_clothing?.category ||
                                  "Clothing"}
                              </span>

                              <span className="px-3 py-1 text-xs font-bold text-green-700 bg-green-100 rounded-full">
                                {item.match_status || "Good Fit"}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mt-5">
                            <div className="p-4 bg-white border rounded-2xl">
                              <p className="text-xs font-semibold text-gray-500">
                                Recommended Size
                              </p>
                              <h4 className="mt-1 text-xl font-black text-gray-900">
                                {item.recommended_size ||
                                  item.recommendation ||
                                  "N/A"}
                              </h4>
                            </div>

                            <div className="p-4 bg-white border rounded-2xl">
                              <p className="text-xs font-semibold text-gray-500">
                                Selected Size
                              </p>
                              <h4 className="mt-1 text-xl font-black text-gray-900">
                                {item.selected_size || "N/A"}
                              </h4>
                            </div>
                          </div>

                          <div className="mt-5">
                            <p className="text-sm font-semibold text-gray-500">
                              Item Price
                            </p>
                            <h4 className="text-2xl font-black text-gray-950">
                              Rs. {Number(item.price || 0).toFixed(2)}
                            </h4>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div className="p-6 border border-gray-200 rounded-3xl bg-gray-50">
                      <h3 className="text-2xl font-black text-gray-950">
                        Order Summary
                      </h3>

                      <div className="mt-6 space-y-4">
                        <div className="flex justify-between">
                          <p className="text-gray-500">Subtotal</p>
                          <p className="font-bold text-gray-900">
                            Rs. {Number(order.subtotal || 0).toFixed(2)}
                          </p>
                        </div>

                        <div className="flex justify-between">
                          <p className="text-gray-500">Shipping</p>
                          <p className="font-bold text-gray-900">
                            Rs. {Number(order.shipping || 0).toFixed(2)}
                          </p>
                        </div>

                        <div className="flex justify-between pt-5 border-t">
                          <p className="text-lg font-bold text-gray-900">
                            Total
                          </p>
                          <p className="text-2xl font-black text-gray-950">
                            Rs. {Number(order.total || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 mt-6 bg-white border rounded-2xl">
                        <p className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase">
                          Delivery Details
                        </p>

                        <p className="mt-3 text-sm font-semibold text-gray-900">
                          {order.customerDetails?.fullName || "N/A"}
                        </p>
                        <p className="mt-1 text-sm text-gray-600">
                          {order.customerDetails?.phone || "N/A"}
                        </p>
                        <p className="mt-1 text-sm text-gray-600">
                          {order.customerDetails?.address || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyOrders;