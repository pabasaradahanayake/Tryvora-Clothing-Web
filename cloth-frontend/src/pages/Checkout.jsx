import { useEffect, useState } from "react";
import { CreditCard, Landmark, Truck, ShieldCheck } from "lucide-react";

function Checkout() {
  const [cartItems, setCartItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [customerDetails, setCustomerDetails] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
  });

  const [cardDetails, setCardDetails] = useState({
    cardHolder: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });

  useEffect(() => {
    try {
      const savedCart = JSON.parse(localStorage.getItem("cart") || "[]");
      setCartItems(Array.isArray(savedCart) ? savedCart : []);
    } catch {
      setCartItems([]);
    }
  }, []);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.price || 0),
    0
  );
  const shipping = cartItems.length > 0 ? 500 : 0;
  const total = subtotal + shipping;

  const handleCustomerChange = (field, value) => {
    setCustomerDetails((prev) => ({
      ...prev,
      [field]: value,
    }));
    setErrorMessage("");
  };

  const handleCardChange = (field, value) => {
    let cleanValue = value;

    if (field === "cardNumber") {
      cleanValue = value.replace(/\D/g, "").slice(0, 16);
    }

    if (field === "cvv") {
      cleanValue = value.replace(/\D/g, "").slice(0, 3);
    }

    if (field === "expiry") {
      cleanValue = value.replace(/[^\d/]/g, "").slice(0, 5);
    }

    setCardDetails((prev) => ({
      ...prev,
      [field]: cleanValue,
    }));
    setErrorMessage("");
  };

  const validateCustomerDetails = () => {
    if (!customerDetails.fullName.trim()) {
      return "Please enter your full name.";
    }

    if (!customerDetails.phone.trim()) {
      return "Please enter your phone number.";
    }

    if (!/^\d{10}$/.test(customerDetails.phone.trim())) {
      return "Phone number must contain 10 digits.";
    }

    if (!customerDetails.email.trim()) {
      return "Please enter your email address.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerDetails.email.trim())) {
      return "Please enter a valid email address.";
    }

    if (!customerDetails.address.trim()) {
      return "Please enter your delivery address.";
    }

    return "";
  };

  const validateCardDetails = () => {
    const cardHolder = cardDetails.cardHolder.trim();
    const cardNumber = cardDetails.cardNumber.trim();
    const expiry = cardDetails.expiry.trim();
    const cvv = cardDetails.cvv.trim();

    if (!cardHolder) {
      return "Please enter card holder name.";
    }

    if (!/^[A-Za-z\s]+$/.test(cardHolder)) {
      return "Card holder name can contain letters only.";
    }

    if (!/^\d{16}$/.test(cardNumber)) {
      return "Card number must contain exactly 16 digits.";
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
      return "Expiry date must be in MM/YY format.";
    }

    const [month, year] = expiry.split("/");
    const currentDate = new Date();
    const currentYear = Number(String(currentDate.getFullYear()).slice(2));
    const currentMonth = currentDate.getMonth() + 1;

    if (
      Number(year) < currentYear ||
      (Number(year) === currentYear && Number(month) < currentMonth)
    ) {
      return "Card expiry date must be valid and not expired.";
    }

    if (!/^\d{3}$/.test(cvv)) {
      return "CVV must contain exactly 3 digits.";
    }

    return "";
  };

  const placeOrder = () => {
    if (cartItems.length === 0) {
      setErrorMessage("Your cart is empty.");
      return;
    }

    const customerError = validateCustomerDetails();

    if (customerError) {
      setErrorMessage(customerError);
      return;
    }

    if (paymentMethod === "card") {
      const cardError = validateCardDetails();

      if (cardError) {
        setErrorMessage(cardError);
        return;
      }
    }

    const loggedUser =
      localStorage.getItem("user_email") ||
      localStorage.getItem("email") ||
      customerDetails.email;

    const order = {
      id: `TRY-${Date.now()}`,
      items: cartItems,
      customerDetails,
      userEmail: loggedUser,
      paymentMethod,
      paymentStatus: paymentMethod === "cash" ? "Pending" : "Paid Demo",
      orderStatus: "Placed",
      subtotal,
      shipping,
      total,
      createdAt: new Date().toISOString(),
    };

    let existingOrders = [];

    try {
      const parsedOrders = JSON.parse(
        localStorage.getItem("orders_history") || "[]"
      );
      existingOrders = Array.isArray(parsedOrders) ? parsedOrders : [];
    } catch {
      existingOrders = [];
    }

    const updatedOrders = [order, ...existingOrders];

    localStorage.setItem("latest_order", JSON.stringify(order));
    localStorage.setItem("orders_history", JSON.stringify(updatedOrders));
    localStorage.removeItem("cart");

    setCartItems([]);
    setOrderPlaced(true);
  };

  return (
    <div className="min-h-screen pt-32 pb-20 bg-[#F4F7FB]">
      <div className="max-w-7xl px-6 mx-auto">
        <div className="mb-10">
          <p className="text-sm font-semibold tracking-widest text-gray-500 uppercase">
            Secure Checkout
          </p>
          <h1 className="mt-2 text-5xl font-black text-gray-900">Checkout</h1>
          <p className="mt-3 text-gray-600">
            Confirm your order details and select a payment method.
          </p>
        </div>

        {orderPlaced ? (
          <div className="p-12 text-center bg-white border shadow-sm rounded-[32px]">
            <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 text-white bg-green-600 rounded-full">
              <ShieldCheck size={36} />
            </div>

            <h2 className="text-3xl font-black text-gray-900">
              Order Placed Successfully
            </h2>

            <p className="max-w-xl mx-auto mt-4 text-gray-600">
              Your order has been saved successfully. You can view it from the
              My Orders page.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {errorMessage && (
                <div className="p-4 text-sm font-semibold text-red-700 border border-red-200 rounded-2xl bg-red-50">
                  {errorMessage}
                </div>
              )}

              <div className="p-7 bg-white border shadow-sm rounded-[32px]">
                <h2 className="text-2xl font-black text-gray-900">
                  Customer Details
                </h2>

                <div className="grid gap-5 mt-6 md:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={customerDetails.fullName}
                    onChange={(e) =>
                      handleCustomerChange("fullName", e.target.value)
                    }
                    className="w-full px-5 py-4 border outline-none rounded-2xl focus:ring-2 focus:ring-black"
                  />

                  <input
                    type="text"
                    placeholder="Phone Number"
                    value={customerDetails.phone}
                    maxLength={10}
                    onChange={(e) =>
                      handleCustomerChange(
                        "phone",
                        e.target.value.replace(/\D/g, "").slice(0, 10)
                      )
                    }
                    className="w-full px-5 py-4 border outline-none rounded-2xl focus:ring-2 focus:ring-black"
                  />

                  <input
                    type="email"
                    placeholder="Email Address"
                    value={customerDetails.email}
                    onChange={(e) =>
                      handleCustomerChange("email", e.target.value)
                    }
                    className="w-full px-5 py-4 border outline-none rounded-2xl focus:ring-2 focus:ring-black md:col-span-2"
                  />

                  <textarea
                    placeholder="Delivery Address"
                    rows="4"
                    value={customerDetails.address}
                    onChange={(e) =>
                      handleCustomerChange("address", e.target.value)
                    }
                    className="w-full px-5 py-4 border outline-none resize-none rounded-2xl focus:ring-2 focus:ring-black md:col-span-2"
                  />
                </div>
              </div>

              <div className="p-7 bg-white border shadow-sm rounded-[32px]">
                <h2 className="text-2xl font-black text-gray-900">
                  Payment Method
                </h2>

                <div className="grid gap-4 mt-6 md:grid-cols-3">
                  <button
                    onClick={() => {
                      setPaymentMethod("cash");
                      setErrorMessage("");
                    }}
                    className={`p-5 text-left border rounded-3xl transition ${
                      paymentMethod === "cash"
                        ? "border-black bg-gray-100"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <Truck />
                    <h3 className="mt-4 font-bold text-gray-900">
                      Cash on Delivery
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Pay when your order arrives.
                    </p>
                  </button>

                  <button
                    onClick={() => {
                      setPaymentMethod("bank");
                      setErrorMessage("");
                    }}
                    className={`p-5 text-left border rounded-3xl transition ${
                      paymentMethod === "bank"
                        ? "border-black bg-gray-100"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <Landmark />
                    <h3 className="mt-4 font-bold text-gray-900">
                      Bank Transfer
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Transfer payment manually.
                    </p>
                  </button>

                  <button
                    onClick={() => {
                      setPaymentMethod("card");
                      setErrorMessage("");
                    }}
                    className={`p-5 text-left border rounded-3xl transition ${
                      paymentMethod === "card"
                        ? "border-black bg-gray-100"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <CreditCard />
                    <h3 className="mt-4 font-bold text-gray-900">
                      Card Payment
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Demo card payment option.
                    </p>
                  </button>
                </div>

                {paymentMethod === "bank" && (
                  <div className="p-5 mt-6 border border-blue-200 bg-blue-50 rounded-3xl">
                    <p className="text-sm font-bold text-blue-800">
                      Bank Details
                    </p>
                    <p className="mt-2 text-sm text-blue-700">
                      Bank: Demo Bank | Account: Tryvora Store | Account No:
                      0000000000
                    </p>
                  </div>
                )}

                {paymentMethod === "card" && (
                  <div className="grid gap-4 mt-6 md:grid-cols-2">
                    <input
                      type="text"
                      placeholder="Card Holder Name"
                      value={cardDetails.cardHolder}
                      onChange={(e) =>
                        handleCardChange("cardHolder", e.target.value)
                      }
                      className="w-full px-5 py-4 border outline-none rounded-2xl focus:ring-2 focus:ring-black md:col-span-2"
                    />

                    <input
                      type="text"
                      placeholder="Card Number"
                      value={cardDetails.cardNumber}
                      maxLength={16}
                      onChange={(e) =>
                        handleCardChange("cardNumber", e.target.value)
                      }
                      className="w-full px-5 py-4 border outline-none rounded-2xl focus:ring-2 focus:ring-black md:col-span-2"
                    />

                    <input
                      type="text"
                      placeholder="MM / YY"
                      value={cardDetails.expiry}
                      maxLength={5}
                      onChange={(e) =>
                        handleCardChange("expiry", e.target.value)
                      }
                      className="w-full px-5 py-4 border outline-none rounded-2xl focus:ring-2 focus:ring-black"
                    />

                    <input
                      type="text"
                      placeholder="CVV"
                      value={cardDetails.cvv}
                      maxLength={3}
                      onChange={(e) => handleCardChange("cvv", e.target.value)}
                      className="w-full px-5 py-4 border outline-none rounded-2xl focus:ring-2 focus:ring-black"
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="sticky p-7 bg-white border shadow-sm top-32 rounded-[32px]">
                <h2 className="text-3xl font-black text-gray-900">
                  Order Summary
                </h2>

                <div className="mt-6 space-y-4">
                  {cartItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-4 pb-4 border-b"
                    >
                      <div>
                        <p className="font-bold text-gray-900">
                          {item.cloth_name || "Fashion Item"}
                        </p>
                        <p className="text-sm text-gray-500">
                          Size: {item.selected_size || "N/A"}
                        </p>
                      </div>

                      <p className="font-bold text-gray-900">
                        Rs. {Number(item.price || 0).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex justify-between">
                    <p className="text-gray-500">Subtotal</p>
                    <p className="font-bold">Rs. {subtotal.toFixed(2)}</p>
                  </div>

                  <div className="flex justify-between">
                    <p className="text-gray-500">Shipping</p>
                    <p className="font-bold">Rs. {shipping.toFixed(2)}</p>
                  </div>

                  <div className="flex justify-between pt-5 border-t">
                    <p className="text-lg font-bold text-gray-900">Total</p>
                    <p className="text-2xl font-black text-gray-900">
                      Rs. {total.toFixed(2)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={placeOrder}
                  className="w-full py-4 mt-8 text-sm font-semibold text-white transition bg-black shadow-lg rounded-2xl hover:bg-gray-900"
                >
                  Place Order
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Checkout;