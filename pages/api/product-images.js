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
      .list(id.toString(), { limit: 200 });
    if (listError) throw listError;

    const imageFiles = (list || [])
      .filter((f) => /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(f.name));

    // Build entries with name and public url
    const entries = imageFiles.map((f) => {
      const path = `${id}/${f.name}`;
      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(path);
      return { name: f.name, url: data.publicUrl };
    });

    // Sort: thumbnail first, then image_1,... image_N by index, then others by name
    const sorted = entries.sort((a, b) => {
      const aThumb = /^thumbnail\./i.test(a.name);
      const bThumb = /^thumbnail\./i.test(b.name);
      if (aThumb && !bThumb) return -1;
      if (!aThumb && bThumb) return 1;
      const aMatch = a.name.match(/^image_(\d+)\./i);
      const bMatch = b.name.match(/^image_(\d+)\./i);
      if (aMatch && bMatch) return Number(aMatch[1]) - Number(bMatch[1]);
      if (aMatch) return -1;
      if (bMatch) return 1;
      return a.name.localeCompare(b.name);
    });

    const images = sorted.map((e) => e.url);
    const thumbEntry = sorted.find((e) => /^thumbnail\./i.test(e.name)) || null;

    return res.status(200).json({ images, thumbnail: thumbEntry ? thumbEntry.url : null });
  } catch (error) {
    console.error("product-images error", error);
    return res.status(500).json({ message: "Error reading images" });
  }
}
