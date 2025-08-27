import { useEffect, useState } from "react";
import Link from "next/link";

export default function Cart() {
  const [cart, setCart] = useState([]);
  const [clientName, setClientName] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setCart(JSON.parse(localStorage.getItem("cart") || "[]"));
  }, []);

  const updateQty = (name, qty) => {
    const next = cart.map((it) => (it.name === name ? { ...it, qty: Number(qty) } : it));
    setCart(next);
    localStorage.setItem("cart", JSON.stringify(next));
  };

  const removeItem = (name) => {
    const next = cart.filter((it) => it.name !== name);
    setCart(next);
    localStorage.setItem("cart", JSON.stringify(next));
  };

  const placeOrder = async () => {
    if (!clientName) return setMessage("Please enter your name.");
    if (!clientPhone) return setMessage("Please enter your phone number.");
    const res = await fetch("/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientName,
        clientCompany,
        clientPhone,
        clientEmail,
        clientAddress,
        items: cart
      })
    });
    const data = await res.json();
    if (res.ok) {
      setMessage("Order placed successfully.");
      localStorage.removeItem("cart");
      setCart([]);
    } else {
      setMessage(data.message || "Error placing order.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Cart</h1>
        <Link href="/products" className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300">Back to products</Link>
      </div>

      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <div className="bg-white rounded-2xl p-5 shadow">
            {cart.map((it) => (
              <div key={it.name} className="flex items-center justify-between py-2 border-b last:border-none">
                <div>
                  <div className="font-medium">{it.name}</div>
                  {/* price removed */}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={it.qty}
                    onChange={(e) => updateQty(it.name, e.target.value)}
                    className="w-20 border rounded-lg p-2"
                  />
                  <button onClick={() => removeItem(it.name)} className="px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-5 shadow mt-6">
            <h2 className="text-xl font-semibold mb-3">Checkout</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <input
                className="w-full border rounded-lg p-2"
                placeholder="Your name *"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
              <input
                className="w-full border rounded-lg p-2"
                placeholder="Phone number *"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
              />
              <input
                className="w-full border rounded-lg p-2"
                placeholder="Email address"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
              />
              <input
                className="w-full border rounded-lg p-2"
                placeholder="Company (hotel/supermarket)"
                value={clientCompany}
                onChange={(e) => setClientCompany(e.target.value)}
              />
            </div>
            <textarea
              className="w-full border rounded-lg p-2 mb-4"
              placeholder="Delivery address"
              rows="2"
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
            />

            <div className="flex items-center justify-end">
              <button onClick={placeOrder} className="px-5 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700">
                Place Order
              </button>
            </div>
            {message && <p className="mt-3">{message}</p>}
          </div>
        </>
      )}
    </div>
  );
}
