import { readOrders } from "@/utils/excel";

export default function handler(req, res) {
  const orders = readOrders();
  res.status(200).json({ orders });
}
