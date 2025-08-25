import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { productId, name } = req.body || {};
    if (!productId || !name) {
      return res.status(400).json({ message: "productId and name are required" });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ message: "Supabase env vars missing" });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const path = `${productId}/${name}`;

    const { error } = await supabase.storage.from("product-images").remove([path]);
    if (error) {
      throw error;
    }

    return res.status(200).json({ message: "Image deleted", path });
  } catch (error) {
    const isProd = process.env.NODE_ENV === "production";
    const payload = { message: "Error deleting image" };
    if (!isProd) payload.details = error?.message || String(error);
    return res.status(500).json(payload);
  }
}
