import { readOrders, writeOrders } from "@/utils/excel";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { orderId, status } = req.body;

  if (!orderId || !status) {
    return res.status(400).json({ message: "Missing orderId or status" });
  }

  try {
    const orders = readOrders();
    const orderIndex = orders.findIndex(order => order.id === orderId);
    
    if (orderIndex === -1) {
      return res.status(404).json({ message: "Order not found" });
    }

    orders[orderIndex].status = status;
    writeOrders(orders);

    return res.status(200).json({ message: "Order status updated successfully" });
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({ message: "Error updating order status" });
  }
}
