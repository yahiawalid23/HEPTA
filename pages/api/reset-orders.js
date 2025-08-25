import { writeOrders } from "@/utils/excel";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Clear all orders by writing an empty array
    await writeOrders([]);
    res.status(200).json({ message: "Orders reset successfully" });
  } catch (error) {
    console.error("reset-orders error", error);
    res.status(500).json({ message: "Error resetting orders" });
  }
}
