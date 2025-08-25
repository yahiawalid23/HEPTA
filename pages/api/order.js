import { readOrders, writeOrders } from "@/utils/excel";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ message: "Method not allowed" });

  try {
    const { clientName, clientCompany, clientPhone, clientEmail, clientAddress, items } = req.body;
    if (!clientName || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ message: "Missing client info or empty items" });
    }

    // Create order record
    const total = items.reduce(
      (sum, it) => sum + Number(it.price || 0) * Number(it.qty || 0),
      0
    );

    const newOrder = {
      id: `ORD-${Date.now()}`,
      date: new Date().toLocaleDateString(),
      customer: clientName,
      company: clientCompany || "",
      phone: clientPhone || "",
      email: clientEmail || "",
      address: clientAddress || "",
      items: items.map(item => `${item.qty} ${item.unit || 'pcs'} ${item.name}`).join(', '),
      total: total.toFixed(2),
      status: 'pending'
    };

    // Read existing orders and add new one
    const existingOrders = readOrders();
    existingOrders.push(newOrder);

    // Ensure Supabase upload completes (important on Vercel)
    await writeOrders(existingOrders);

    return res.status(200).json({ message: "Order placed successfully", total });
  } catch (e) {
    console.error("order create error", e);
    return res.status(500).json({ message: "Failed to place order" });
  }
}
