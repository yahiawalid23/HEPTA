import formidable from "formidable";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const form = formidable({ multiples: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ message: "Error parsing form data" });
    }

    const productId = Array.isArray(fields.productId) ? fields.productId[0] : fields.productId;
    const thumbnailIndex = fields.thumbnailIndex ? parseInt(Array.isArray(fields.thumbnailIndex) ? fields.thumbnailIndex[0] : fields.thumbnailIndex) : null;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const images = Array.isArray(files.images) ? files.images : [files.images].filter(Boolean);

    if (!images.length) {
      return res.status(400).json({ message: "No images provided" });
    }

    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // server-side only
      if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ message: "Supabase env vars missing" });
      }
      const supabase = createClient(supabaseUrl, supabaseKey);

      const uploaded = [];
      for (let index = 0; index < images.length; index++) {
        const image = images[index];
        const ext = path.extname(image.originalFilename || image.newFilename) || ".jpg";
        const filename = (thumbnailIndex === index) ? `thumbnail${ext}` : `image_${index + 1}${ext}`;
        const storagePath = `${productId}/${filename}`;

        const fileBuffer = fs.readFileSync(image.filepath);
        const { error: uploadError } = await supabase
          .storage
          .from("product-images")
          .upload(storagePath, fileBuffer, {
            upsert: true,
            contentType: image.mimetype || undefined,
          });
        if (uploadError) {
          throw uploadError;
        }
        // Assume bucket is public; construct public URL
        const { data: publicUrl } = supabase.storage.from("product-images").getPublicUrl(storagePath);
        uploaded.push(publicUrl.publicUrl);
      }

      return res.status(200).json({
        message: `Successfully uploaded ${images.length} images for product ${productId}${thumbnailIndex !== null ? ` with thumbnail set to image ${thumbnailIndex + 1}` : ''}`,
        images: uploaded,
      });
    } catch (error) {
      console.error("Supabase upload error", error);
      res.status(500).json({ message: "Error saving images" });
    }
  });
}
