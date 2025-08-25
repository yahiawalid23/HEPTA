import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function Admin() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [orders, setOrders] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [productId, setProductId] = useState("");
  const [imageMessage, setImageMessage] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editingStatus, setEditingStatus] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState(null);
  const [imagePreviews, setImagePreviews] = useState([]);
  const router = useRouter();

  // Removed auto-logout on refresh/unload to prevent immediate logout on entry

  useEffect(() => {
    fetchOrders();
    
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchOrders();
    }, 5 * 60 * 1000); // 5 minutes in milliseconds
    
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders");
      const data = await response.json();
      setOrders(data.orders || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    setMessage(data.message);
  };

  const handleImageFilesChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files);
    setSelectedThumbnail(null);
    
    // Create image previews
    const previews = files.map((file, index) => ({
      file,
      index,
      url: URL.createObjectURL(file),
      name: file.name
    }));
    setImagePreviews(previews);
  };

  const handleImageUpload = async (e) => {
    e.preventDefault();
    if (!imageFiles.length || !productId) return;
    const formData = new FormData();
    imageFiles.forEach((file) => formData.append("images", file));
    formData.append("productId", productId);
    if (selectedThumbnail !== null) {
      formData.append("thumbnailIndex", selectedThumbnail);
    }
    try {
      const res = await fetch("/api/upload-images", { method: "POST", body: formData });
      const data = await res.json();
      setImageMessage(data.message);
      setImageFiles([]);
      setProductId("");
      setSelectedThumbnail(null);
      setImagePreviews([]);
      // Clean up preview URLs
      imagePreviews.forEach(preview => URL.revokeObjectURL(preview.url));
    } catch (error) {
      setImageMessage("Error uploading images");
    }
  };

  const handleEditStatus = (orderId, currentStatus) => {
    setEditingOrderId(orderId);
    setEditingStatus(currentStatus);
  };

  const handleSaveStatus = async (orderId) => {
    try {
      const response = await fetch("/api/update-order-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: editingStatus })
      });
      
      if (response.ok) {
        setOrders(orders.map(order => 
          order.id === orderId ? { ...order, status: editingStatus } : order
        ));
        setEditingOrderId(null);
        setEditingStatus("");
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleResetOrders = async () => {
    try {
      const response = await fetch("/api/reset-orders", { method: "POST" });
      const data = await response.json();
      
      if (response.ok) {
        setOrders([]);
        setMessage("Orders reset successfully!");
        setShowResetConfirm(false);
      } else {
        setMessage(data.message || "Error resetting orders");
      }
    } catch (error) {
      setMessage("Error resetting orders");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/logout");
    router.push("/login");
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button onClick={handleLogout} className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-black">
          Logout
        </button>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Orders</h2>
            {lastUpdated && (
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()} • Auto-refreshes every 5 minutes
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchOrders}
              className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center"
              title="Refresh Orders"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <a 
              className="p-2 rounded-lg bg-green-600 text-white hover:bg-green-700 flex items-center justify-center" 
              href="/api/download?type=orders"
              title="Download Orders"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </a>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="p-2 rounded-lg bg-red-600 text-white hover:bg-red-700 flex items-center justify-center"
              title="Reset Orders"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
        
        {orders.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No orders found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Order ID</th>
                  <th className="text-left py-2 px-3">Date</th>
                  <th className="text-left py-2 px-3">Customer</th>
                  <th className="text-left py-2 px-3">Contact</th>
                  <th className="text-left py-2 px-3">Items</th>
                  <th className="text-left py-2 px-3">Total</th>
                  <th className="text-left py-2 px-3">Status</th>
                  <th className="text-left py-2 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3">{order.id || `ORD-${index + 1}`}</td>
                    <td className="py-2 px-3">{order.date || new Date().toLocaleDateString()}</td>
                    <td className="py-2 px-3">{order.customer || "N/A"}</td>
                    <td className="py-2 px-3">
                      <div className="text-sm">
                        <div>{order.phone || "N/A"}</div>
                        <div className="text-gray-500">{order.email || ""}</div>
                      </div>
                    </td>
                    <td className="py-2 px-3">{order.items || "N/A"}</td>
                    <td className="py-2 px-3">{order.total || "N/A"}</td>
                    <td className="py-2 px-3">
                      {editingOrderId === order.id ? (
                        <select
                          value={editingStatus}
                          onChange={(e) => setEditingStatus(e.target.value)}
                          className="px-2 py-1 border rounded text-xs"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'processing' ? 'bg-orange-100 text-orange-800' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status || 'pending'}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      {editingOrderId === order.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleSaveStatus(order.id)}
                            className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingOrderId(null)}
                            className="px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditStatus(order.id, order.status)}
                          className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-5 shadow mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Upload Products.xlsx</h2>
          <a 
            className="p-2 rounded-lg bg-green-600 text-white hover:bg-green-700 flex items-center justify-center" 
            href="/api/download?type=products"
            title="Download Products"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </a>
        </div>
        <form onSubmit={handleUpload} className="flex items-center gap-3">
          <input 
            type="file" 
            accept=".xlsx,.xls" 
            onChange={(e) => setFile(e.target.files[0])} 
            className="block" 
          />
          <button className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
            Upload
          </button>
        </form>
        {message && <p className="mt-3 text-green-700">{message}</p>}
        <p className="text-sm text-gray-600 mt-2">
          Excel file should contain columns: ID, English Name, Arabic Name, Category, Unit
        </p>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow mb-6">
        <h2 className="text-xl font-semibold mb-3">Upload Product Images</h2>
        <form onSubmit={handleImageUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product ID</label>
            <input
              type="text"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              placeholder="Enter product ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageFilesChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">Select multiple images and choose which one to use as thumbnail.</p>
          </div>

          {imagePreviews.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Selected Images</label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div 
                    key={index}
                    className={`relative border-2 rounded-lg p-2 cursor-pointer transition-all ${
                      selectedThumbnail === index 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => setSelectedThumbnail(index)}
                  >
                    <img
                      src={preview.url}
                      alt={preview.name}
                      className="w-full h-24 object-cover rounded"
                    />
                    <p className="text-xs text-gray-600 mt-1 truncate">{preview.name}</p>
                    {selectedThumbnail === index && (
                      <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                        ★
                      </div>
                    )}
                    <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Click on an image to select it as the thumbnail. 
                {selectedThumbnail !== null ? ` Selected: Image ${selectedThumbnail + 1}` : ' No thumbnail selected.'}
              </p>
            </div>
          )}
          <button 
            type="submit"
            className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
          >
            Upload Images
          </button>
        </form>
        {imageMessage && <p className="mt-3 text-green-700">{imageMessage}</p>}
      </div>


      {/* Reset Orders Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Reset All Orders</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to reset all orders? This action cannot be undone and will permanently delete all order history.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResetOrders}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Reset Orders
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
