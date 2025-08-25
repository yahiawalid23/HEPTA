import { readProducts } from "@/utils/excel";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

export default async function handler(req, res) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase.storage.from("files").download("products.xlsx");
      if (!error && data) {
        const buf = Buffer.from(await data.arrayBuffer());
        const wb = XLSX.read(buf, { type: "buffer" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
        // Normalize to match existing shape used by the app
        const products = rows.map((r) => ({
          id: r["ID"] ?? r.id ?? "",
          englishName: r["English Name"] ?? r.English_Name ?? "",
          arabicName: r["Arabic Name"] ?? r.Arabic_Name ?? "",
          category: r["Category"] ?? "",
          unit: r["Unit"] ?? "",
        }));
        return res.status(200).json({ products });
      }
    }

    // Fallback to local file
    const products = readProducts();
    return res.status(200).json({ products });
  } catch (e) {
    console.error("products list error", e);
    return res.status(500).json({ products: [], message: "Failed to load products" });
  }
}
