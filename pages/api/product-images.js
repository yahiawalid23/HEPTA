import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ message: "Product ID required" });

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ message: "Supabase env vars missing" });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // List files in folder productId/
    const { data: list, error: listError } = await supabase
      .storage
      .from("product-images")
      .list(id.toString(), { limit: 100 });
    if (listError) throw listError;

    const imageFiles = (list || [])
      .filter((f) => /\.(jpg|jpeg|png|gif|webp)$/i.test(f.name));

    const images = imageFiles.map((f) => {
      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(`${id}/${f.name}`);
      return data.publicUrl;
    });

    return res.status(200).json({ images });
  } catch (error) {
    console.error("product-images error", error);
    return res.status(500).json({ message: "Error reading images" });
  }
}
