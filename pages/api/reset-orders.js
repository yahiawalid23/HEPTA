import { writeOrders } from "@/utils/excel";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Clear all orders by writing an empty array
    writeOrders([]);
    res.status(200).json({ message: "Orders reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error resetting orders" });
  }
}
