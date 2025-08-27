import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Products() {
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

        // Fetch thumbnails from Supabase for each product (best effort)
        (async () => {
          try {
            const entries = await Promise.all(
              productsData.map(async (p) => {
                try {
                  const res = await fetch(`/api/product-images?id=${encodeURIComponent(p.id)}`);
                  const data = await res.json();
                  const thumb = data.thumbnail || (data.images && data.images[0]) || null;
                  return [p.id, thumb];
                } catch {
                  return [p.id, null];
                }
              })
            );
            const map = Object.fromEntries(entries);
            setProductThumbs(map);
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

  const handleProductClick = async (product) => {
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

    // Show success message (you could add a toast notification here)
    alert(`Added ${qty} ${selectedProduct.unit} of ${selectedProduct.englishName} to cart!`);

    // Reset quantity and close modal
    setQty(1);
    setSelectedProduct(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Shop Banner */}
      <div className="w-full bg-[#282D31] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <img
            src="/shop-banner.svg"
            alt="Shop Banner"
            className="h-20 w-auto mx-auto"
          />
        </div>
      </div>

      <main className="flex-grow">
        <div className="max-w-6xl mx-auto p-6 w-full">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Products</h1>
            <Link href="/cart" className="relative px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700">
              Cart
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
                  placeholder="Search products (English, Arabic, or Category)..."
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
                  <option value="all">All Categories</option>
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
                  Clear Filters
                </button>
              )}
            </div>

            {/* Results Count */}
            <div className="mt-3 text-sm text-gray-600">
              Showing {filteredProducts.length} of {products.length} products
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 shadow text-center">
              <div className="text-gray-400 text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No products found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || selectedCategory !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "No products available at the moment"}
              </p>
              {(searchTerm || selectedCategory !== "all") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Show All Products
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl p-5 shadow hover:shadow-lg transition cursor-pointer"
                  onClick={() => handleProductClick(p)}
                >
                  <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                    <img
                      src={productThumbs[p.id] || '/placeholder-product.png'}
                      alt={p.englishName}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        if (!e.target.src.includes('placeholder-product.png')) {
                          e.target.src = '/placeholder-product.png';
                        }
                      }}
                    />
                  </div>
                  <h2 className="text-lg font-semibold">{p.arabicName}</h2>
                  <p className="text-sm text-gray-500 mb-1">{p.englishName}</p>
                  <p className="text-sm text-blue-600 font-medium">{p.category}</p>
                  <p className="text-xs text-gray-400 mt-1">Unit: {p.unit}</p>
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
                    <h2 className="text-2xl font-bold mb-2">{selectedProduct.arabicName}</h2>
                    <p className="text-lg text-gray-600">{selectedProduct.englishName}</p>
                  </div>
                  <div>
                    <p className="text-blue-600 font-medium">{selectedProduct.category}</p>
                    <p className="text-sm text-gray-500">{selectedProduct.unit}</p>
                  </div>
                </div>

                <div className="mb-4">
                  {productImages[selectedProduct.id] && productImages[selectedProduct.id].images && productImages[selectedProduct.id].images.length > 0 ? (
                    <div
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
                    <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-500">No image available</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Quantity</h3>

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
                      <p className="text-lg font-semibold">Total Quantity: {qty} {selectedProduct.unit}</p>
                      <button
                        className="px-3 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"
                        onClick={() => setQty(1)}
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 justify-end">
                    <button
                      className="w-full px-6 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 font-semibold"
                      onClick={handleBuyNow}
                    >
                      Buy Now
                    </button>
                    <button
                      className="w-full px-6 py-3 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 font-semibold"
                      onClick={handleAddToCart}
                    >
                      Add to Cart
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