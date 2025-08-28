import { useEffect, useState } from "react";
import Link from "next/link";
import { useLang } from "@/utils/i18n";

export default function Cart() {
  const { lang, setLang } = useLang();
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
    if (!clientName) return setMessage(lang === 'ar' ? "يرجى إدخال اسمك." : "Please enter your name.");
    if (!clientPhone) return setMessage(lang === 'ar' ? "يرجى إدخال رقم هاتفك." : "Please enter your phone number.");
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
      setMessage(lang === 'ar' ? "تم إرسال الطلب بنجاح." : "Order placed successfully.");
      localStorage.removeItem("cart");
      setCart([]);
    } else {
      setMessage(data.message || (lang === 'ar' ? "حدث خطأ أثناء إرسال الطلب." : "Error placing order."));
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold whitespace-nowrap">{lang === 'ar' ? 'سلة المشتريات' : 'Your Cart'}</h1>
        <div className="flex gap-2 sm:gap-3">
          <button 
            onClick={() => {
              localStorage.removeItem("cart");
              setCart([]);
            }}
            className="px-3 sm:px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm sm:text-base whitespace-nowrap"
          >
            {lang === 'ar' ? 'مسح السلة' : 'Clear Cart'}
          </button>
          <Link href="/products" className="px-3 sm:px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-sm sm:text-base whitespace-nowrap text-center">{lang === 'ar' ? 'عودة إلى المنتجات' : 'Back to products'}</Link>
        </div>
      </div>

      {cart.length === 0 ? (
        <p>{lang === 'ar' ? 'سلة المشتريات فارغة.' : 'Your cart is empty.'}</p>
      ) : (
        <>
          <div className="bg-white rounded-2xl p-5 shadow">
            {cart.map((it) => (
              <div key={(it.id ?? it.name) + ''} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b last:border-none gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm sm:text-base break-words">{lang === 'ar' ? (it.arabicName || it.name) : (it.englishName || it.name)}</div>
                  {/* price removed */}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <input
                    type="number"
                    min={1}
                    value={it.qty}
                    onChange={(e) => updateQty(it.name, e.target.value)}
                    className="w-16 sm:w-20 border rounded-lg p-2 text-sm"
                  />
                  <button 
                    onClick={() => removeItem(it.name)} 
                    className="p-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center justify-center"
                    title={lang === 'ar' ? 'إزالة' : 'Remove'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-5 shadow mt-6">
            <h2 className="text-xl font-semibold mb-3">{lang === 'ar' ? 'إتمام الشراء' : 'Checkout'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <input
                className="w-full border rounded-lg p-2"
                placeholder={lang === 'ar' ? 'اسمك *' : 'Your name *'}
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
              <input
                className="w-full border rounded-lg p-2"
                placeholder={lang === 'ar' ? 'رقم الهاتف *' : 'Phone number *'}
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
              />
              <input
                className="w-full border rounded-lg p-2"
                placeholder={lang === 'ar' ? 'البريد الإلكتروني' : 'Email address'}
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
              />
              <input
                className="w-full border rounded-lg p-2"
                placeholder={lang === 'ar' ? 'الشركة (فندق/سوبرماركت)' : 'Company (hotel/supermarket)'}
                value={clientCompany}
                onChange={(e) => setClientCompany(e.target.value)}
              />
            </div>
            <textarea
              className="w-full border rounded-lg p-2 mb-4"
              placeholder={lang === 'ar' ? 'عنوان التوصيل' : 'Delivery address'}
              rows="2"
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
            />

            <div className="flex items-center justify-end">
              <button onClick={placeOrder} className="px-5 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700">
                {lang === 'ar' ? 'إرسال الطلب' : 'Place Order'}
              </button>
            </div>
            {message && <p className="mt-3">{message}</p>}
          </div>
        </>
      )}
    </div>
  );
}
