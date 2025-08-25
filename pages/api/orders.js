import { readOrders } from "@/utils/excel";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

export default async function handler(req, res) {
  try {
    let orders = readOrders();

    if (!orders || orders.length === 0) {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data, error } = await supbaseDownload(supabase);
        if (!error && data) {
          const buf = Buffer.from(await data.arrayBuffer());
          const wb = XLSX.read(buf, { type: "buffer" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          orders = XLSX.utils.sheet_to_json(ws, { defval: "" });
        }
      }
    }

    return res.status(200).json({ orders: orders || [] });
  } catch (e) {
    console.error("orders list error", e);
    return res.status(500).json({ orders: [], message: "Failed to load orders" });
  }
}

async function supbaseDownload(supabase) {
  try {
    const result = await supabase.storage.from("files").download("orders.xlsx");
    return { data: result.data, error: result.error };
  } catch (e) {
    return { data: null, error: e };
  }
}
