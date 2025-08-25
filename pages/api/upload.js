import formidable from "formidable";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ message: "Method not allowed" });

  const form = formidable({ multiples: false });
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ message: "Upload error" });
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file) return res.status(400).json({ message: "No file uploaded" });

    // Keep local copy (for current readProducts() syncing)
    const newPath = path.join(process.cwd(), "data", "products.xlsx");
    try {
      fs.mkdirSync(path.dirname(newPath), { recursive: true });
      fs.copyFileSync(file.filepath, newPath);
    } catch (e) {
      console.error("local copy error", e);
    }

    // Upload to Supabase Storage so download API works on Vercel
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!supabaseUrl || !supabaseKey) {
        // Don't fail the whole request if env missing; just warn
        console.warn("Supabase env missing; skipped remote upload");
      } else {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const buffer = fs.readFileSync(file.filepath);
        const { error } = await supabase
          .storage
          .from("files")
          .upload("products.xlsx", buffer, { upsert: true, contentType: file.mimetype || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        if (error) throw error;
      }
    } catch (e) {
      console.error("supabase upload error", e);
      // Continue; local copy succeeded above
    }

    return res.status(200).json({ message: "Products updated!" });
  });
}
