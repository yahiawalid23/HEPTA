import { useState, useEffect, useRef } from 'react';
import { useLang } from '@/utils/i18n';
import Link from 'next/link';
import Image from 'next/image';

export default function Products() {
  const { lang, setLang } = useLang();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [productImages, setProductImages] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState([]);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [productThumbs, setProductThumbs] = useState({});
  const cartRef = useRef(null);
  const addToCartBtnRef = useRef(null);
  const lastAnimTimeRef = useRef(0);
  const startPointRef = useRef(null); // { x, y } center of clicked product card
  const modalImageRef = useRef(null); // container of product images in modal

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => {
        const productsData = d.products || [];
        setProducts(productsData);
        setFilteredProducts(productsData);

        // Extract unique categories
        const uniqueCategories = [...new Set(productsData.map(p => p.category).filter(Boolean))];
        setCategories(uniqueCategories);

        // Thumbnails: hydrate from cache first, then fetch missing with limited concurrency
        (async () => {
          try {
            const CACHE_KEY = 'productThumbsCache';
            const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
            const now = Date.now();
            let cached = null;
            try { cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch {}
            const isValidCache = cached && cached.expiresAt && cached.expiresAt > now && cached.map;

            if (isValidCache) {
              setProductThumbs(cached.map);
            }

            const currentMap = isValidCache ? cached.map : {};
            const missing = productsData.filter(p => !currentMap[p.id]);

            // simple concurrency limiter
            const limit = 6;
            const results = { ...currentMap };
            for (let i = 0; i < missing.length; i += limit) {
              const slice = missing.slice(i, i + limit);
              const chunk = await Promise.all(slice.map(async (p) => {
                try {
                  const res = await fetch(`/api/product-images?id=${encodeURIComponent(p.id)}`);
                  const data = await res.json();
                  const thumb = data.thumbnail || (data.images && data.images[0]) || null;
                  return [p.id, thumb];
                } catch {
                  return [p.id, null];
                }
              }));
              for (const [pid, t] of chunk) results[pid] = t;
              // progressively update UI
              setProductThumbs(prev => ({ ...prev, ...Object.fromEntries(chunk) }));
            }

            // write cache
            localStorage.setItem(CACHE_KEY, JSON.stringify({ map: results, expiresAt: now + CACHE_TTL_MS }));
          } catch (e) {
            // ignore thumbnail fetch errors
          }
        })();
      });

    // Update cart count on component mount
    updateCartCount();
  }, []);

  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const uniqueProducts = cart.length;
    setCartItemCount(uniqueProducts);
  };

  // Simple fly-to-cart animation from startEl to the cart button
  const animateToCart = (startEl, endEl, startPoint) => {
    console.log('animateToCart called:', { startEl: !!startEl, endEl: !!endEl, startPoint });
    
    if (!endEl) {
      console.log('No end element, skipping animation');
      return;
    }
    
    // Determine start coordinates
    let startCenterX, startCenterY;
    if (startPoint && typeof startPoint.x === 'number' && typeof startPoint.y === 'number') {
      startCenterX = startPoint.x;
      startCenterY = startPoint.y;
      console.log('Using startPoint:', startPoint);
    } else if (startEl) {
      const startRect = startEl.getBoundingClientRect();
      startCenterX = startRect.left + startRect.width / 2;
      startCenterY = startRect.top + startRect.height / 2;
      console.log('Using startEl rect:', { startCenterX, startCenterY });
    } else {
      console.log('No valid start position, aborting');
      return;
    }
    
    const endRect = endEl.getBoundingClientRect();
    console.log('End rect:', endRect);

    const ghost = document.createElement('div');
    ghost.style.position = 'fixed';
    ghost.style.left = `${startCenterX - 10}px`;
    ghost.style.top = `${startCenterY - 10}px`;
    ghost.style.width = '20px';
    ghost.style.height = '20px';
    ghost.style.background = '#F59E0B';
    ghost.style.borderRadius = '50%';
    ghost.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.4)';
    ghost.style.zIndex = '10000';
    ghost.style.pointerEvents = 'none';

    document.body.appendChild(ghost);
    console.log('Ghost created at:', { left: ghost.style.left, top: ghost.style.top });

    const deltaX = (endRect.left + endRect.width / 2) - startCenterX;
    const deltaY = (endRect.top + endRect.height / 2) - startCenterY;
    console.log('Delta:', { deltaX, deltaY });

    // Animate using CSS transition
    ghost.style.transition = 'all 800ms cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    
    setTimeout(() => {
      ghost.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.3)`;
      ghost.style.opacity = '0';
    }, 10);

    setTimeout(() => {
      if (ghost && ghost.parentNode) {
        ghost.parentNode.removeChild(ghost);
      }
    }, 850);
  };

  // Filter products based on search term and category
  useEffect(() => {
    let filtered = products;

    // Filter by search term (search in both English and Arabic names)
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.englishName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.arabicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory]);

  const getProductImages = async (productId) => {
    try {
      const response = await fetch(`/api/product-images?id=${productId}`);
      const data = await response.json();
      return {
        images: data.images || [],
        thumbnail: data.thumbnail || (data.images && data.images[0]) || null,
      };
    } catch (error) {
      console.error('Error fetching product images:', error);
      return { images: [], thumbnail: null };
    }
  };

  const handleProductClick = async (product, evt) => {
    // capture the center point of the clicked card for the animation origin
    if (evt && evt.currentTarget) {
      const r = evt.currentTarget.getBoundingClientRect();
      startPointRef.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    } else {
      startPointRef.current = null;
    }
    setSelectedProduct(product);
    setQty(1);

    if (!productImages[product.id]) {
      const data = await getProductImages(product.id);
      setProductImages(prev => ({
        ...prev,
        [product.id]: data
      }));
      // Also cache the thumbnail if we don't already have it
      if (data.thumbnail) {
        setProductThumbs(prev => ({ ...prev, [product.id]: data.thumbnail }));
      }
    }
  };

  const handleQtyAdd = (value) => {
    setQty(prev => prev + value);
  };

  const handleQtySubtract = (value) => {
    setQty(prev => Math.max(1, prev - value));
  };

  const handleBuyNow = () => {
    const cartItem = {
      name: selectedProduct.englishName,
      arabicName: selectedProduct.arabicName,
      category: selectedProduct.category,
      unit: selectedProduct.unit,
      price: 0, // You may want to add price to your products.xlsx
      qty: qty,
      id: selectedProduct.id
    };

    // Get existing cart from localStorage
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");

    // Check if item already exists in cart
    const existingItemIndex = existingCart.findIndex(item => item.id === selectedProduct.id);

    if (existingItemIndex >= 0) {
      // Update quantity if item exists
      existingCart[existingItemIndex].qty += qty;
    } else {
      // Add new item to cart
      existingCart.push(cartItem);
    }

    // Save updated cart to localStorage
    localStorage.setItem("cart", JSON.stringify(existingCart));

    // Redirect to cart page
    window.location.href = '/cart';
  };

  const handleAddToCart = () => {
    const cartItem = {
      name: selectedProduct.englishName,
      arabicName: selectedProduct.arabicName,
      category: selectedProduct.category,
      unit: selectedProduct.unit,
      price: 0, // You may want to add price to your products.xlsx
      qty: qty,
      id: selectedProduct.id
    };

    // Get existing cart from localStorage
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");

    // Check if item already exists in cart
    const existingItemIndex = existingCart.findIndex(item => item.id === selectedProduct.id);

    if (existingItemIndex >= 0) {
      // Update quantity if item exists
      existingCart[existingItemIndex].qty += qty;
    } else {
      // Add new item to cart
      existingCart.push(cartItem);
    }

    // Save updated cart to localStorage
    localStorage.setItem("cart", JSON.stringify(existingCart));

    // Update cart count
    updateCartCount();

    // Reset quantity and close modal
    setQty(1);
    setSelectedProduct(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        <div className="max-w-6xl mx-auto p-6 w-full">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">{lang === 'ar' ? 'المنتجات' : 'Products'}</h1>
            <Link href="/cart" className="relative px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700">
              <span ref={cartRef}>{lang === 'ar' ? 'السلة' : 'Cart'}</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>
          </div>

          {/* Search and Filter Section */}
          <div className="bg-white rounded-2xl p-5 shadow mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder={lang === 'ar' ? 'ابحث عن المنتجات (إنجليزي، عربي أو الفئة)...' : 'Search products (English, Arabic, or Category)...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Category Filter */}
              <div className="md:w-64">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">{lang === 'ar' ? 'كل الفئات' : 'All Categories'}</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters Button */}
              {(searchTerm || selectedCategory !== "all") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  {lang === 'ar' ? 'مسح الفلاتر' : 'Clear Filters'}
                </button>
              )}
            </div>

            {/* Results Count */}
            <div className="mt-3 text-sm text-gray-600">
              {lang === 'ar'
                ? <>عرض {filteredProducts.length} من {products.length} منتج</>
                : <>Showing {filteredProducts.length} of {products.length} products</>}
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 shadow text-center">
              <div className="text-gray-400 text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">{lang === 'ar' ? 'لا توجد منتجات' : 'No products found'}</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || selectedCategory !== "all"
                  ? (lang === 'ar' ? 'حاول تعديل البحث أو معايير التصفية' : 'Try adjusting your search or filter criteria')
                  : (lang === 'ar' ? 'لا توجد منتجات متاحة حالياً' : 'No products available at the moment')}
              </p>
              {(searchTerm || selectedCategory !== "all") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {lang === 'ar' ? 'عرض جميع المنتجات' : 'Show All Products'}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl p-5 shadow hover:shadow-lg transition cursor-pointer"
                  onClick={(e) => handleProductClick(p, e)}
                >
                  <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                    <img
                      src={productThumbs[p.id] || '/placeholder-product.png'}
                      alt={lang === 'ar' ? p.arabicName : p.englishName}
                      loading="lazy"
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        if (!e.target.src.includes('placeholder-product.png')) {
                          e.target.src = '/placeholder-product.png';
                        }
                      }}
                    />
                  </div>
                  <h2 className="text-lg font-semibold">{lang === 'ar' ? p.arabicName : p.englishName}</h2>
                  <p className="text-sm text-gray-500 mb-1">{lang === 'ar' ? p.englishName : p.arabicName}</p>
                  <p className="text-sm text-blue-600 font-medium">{p.category}</p>
                  <p className="text-xs text-gray-400 mt-1">{lang === 'ar' ? 'الوحدة: ' : 'Unit: '}{p.unit}</p>
                </div>
              ))}
            </div>
          )}

          {selectedProduct && (
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[95vh] overflow-y-auto relative">
                <button
                  className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 text-2xl"
                  onClick={() => setSelectedProduct(null)}
                >
                  ✕
                </button>

                <div className="mb-6 flex gap-8 items-start">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{lang === 'ar' ? selectedProduct.arabicName : selectedProduct.englishName}</h2>
                    <p className="text-lg text-gray-600">{lang === 'ar' ? selectedProduct.englishName : selectedProduct.arabicName}</p>
                  </div>
                  <div>
                    <p className="text-blue-600 font-medium">{selectedProduct.category}</p>
                    <p className="text-sm text-gray-500">{selectedProduct.unit}</p>
                  </div>
                </div>

                <div className="mb-4">
                  {productImages[selectedProduct.id] && productImages[selectedProduct.id].images && productImages[selectedProduct.id].images.length > 0 ? (
                    <div
                      ref={modalImageRef}
                      className="flex gap-3 overflow-x-scroll scrollbar-hide pb-2"
                      style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        WebkitOverflowScrolling: 'touch'
                      }}
                    >
                      {productImages[selectedProduct.id].images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`${selectedProduct.arabicName} ${index + 1}`}
                          loading="lazy"
                          className="flex-shrink-0 w-64 h-64 object-cover rounded-lg"
                          onError={(e) => {
                            if (!e.target.src.includes('placeholder-product.png')) {
                              e.target.src = '/placeholder-product.png';
                            }
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div ref={modalImageRef} className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-500">{lang === 'ar' ? 'لا توجد صورة' : 'No image available'}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">{lang === 'ar' ? 'الكمية' : 'Quantity'}</h3>

                    <div className="flex gap-2 flex-wrap mb-3">
                      {[1, 5, 10, 50, 100].map((value) => (
                        <button
                          key={value}
                          className="px-3 py-2 rounded-lg border bg-green-50 text-green-700 border-green-300 hover:border-green-600 hover:bg-green-100"
                          onClick={() => handleQtyAdd(value)}
                        >
                          +{value}
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2 flex-wrap mb-4">
                      {[1, 5, 10, 50, 100].map((value) => (
                        <button
                          key={value}
                          className="px-3 py-2 rounded-lg border bg-red-50 text-red-700 border-red-300 hover:border-red-600 hover:bg-red-100"
                          onClick={() => handleQtySubtract(value)}
                        >
                          -{value}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                      <p className="text-lg font-semibold">{lang === 'ar' ? 'إجمالي الكمية: ' : 'Total Quantity: '}{qty} {selectedProduct.unit}</p>
                      <button
                        className="px-3 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"
                        onClick={() => setQty(1)}
                      >
                        {lang === 'ar' ? 'إعادة ضبط' : 'Reset'}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 justify-end">
                    <button
                      className="w-full px-6 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 font-semibold"
                      onClick={handleBuyNow}
                    >
                      {lang === 'ar' ? 'اشتر الآن' : 'Buy Now'}
                    </button>
                    <button
                      ref={addToCartBtnRef}
                      className="w-full px-6 py-3 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 font-semibold"
                      onClick={() => {
                        const now = Date.now();
                        const COOLDOWN_MS = 1200;
                        const canAnimate = now - lastAnimTimeRef.current > COOLDOWN_MS;
                        
                        // Add to cart
                        handleAddToCart();
                        
                        // Close modal
                        setSelectedProduct(null);
                        
                        // Simple animation from stored card position to cart button
                        if (canAnimate && startPointRef.current) {
                          lastAnimTimeRef.current = now;
                          setTimeout(() => {
                            animateToCart(null, cartRef.current, startPointRef.current);
                          }, 100);
                        }
                      }}
                    >
                      {lang === 'ar' ? 'أضف إلى السلة' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}