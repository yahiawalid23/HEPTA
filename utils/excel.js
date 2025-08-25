import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";

const productsPath = path.join(process.cwd(), "data", "products.xlsx");
const ordersPath = path.join(process.cwd(), "data", "orders.xlsx");

function ensureDataDir() {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

export function readProducts() {
  ensureDataDir();
  if (!fs.existsSync(productsPath)) {
    // create empty products file with headers if missing
    writeProducts([]);
  }
  const wb = XLSX.readFile(productsPath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
  // Normalize keys expected by the app
  return rows.map((r) => ({
    id: r["ID"] ?? r.id ?? "",
    englishName: r["English Name"] ?? r.English_Name ?? "",
    arabicName: r["Arabic Name"] ?? r.Arabic_Name ?? "",
    category: r["Category"] ?? "",
    unit: r["Unit"] ?? ""
  }));
}

export function writeProducts(items) {
  ensureDataDir();
  const rows = items.map((p) => ({
    "ID": p.id,
    "English Name": p.englishName,
    "Arabic Name": p.arabicName,
    "Category": p.category,
    "Unit": p.unit
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Products");
  XLSX.writeFile(wb, productsPath);
}

export function readOrders() {
  ensureDataDir();
  // If local exists, prefer it
  if (fs.existsSync(ordersPath)) {
    const wb = XLSX.readFile(ordersPath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json(ws, { defval: "" });
  }
  // Fallback: return empty here; API route will try Supabase directly (async)
  return [];
}

export async function writeOrders(orders) {
  ensureDataDir();
  // Build worksheet and workbook in-memory
  const ws = XLSX.utils.json_to_sheet(orders);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Orders");

  // 1) Try writing to disk (best for local dev). Ignore failures on serverless.
  try {
    XLSX.writeFile(wb, ordersPath);
  } catch (e) {
    console.warn("writeOrders: failed to write local file (expected on serverless)");
  }

  // 2) Upload in-memory buffer to Supabase Storage so downloads work on Vercel
  const supabase = getSupabase();
  if (supabase) {
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const { error } = await supabase
      .storage
      .from("files")
      .upload("orders.xlsx", buffer, {
        upsert: true,
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
    if (error) {
      console.error("Supabase orders.xlsx upload error", error);
      throw error;
    }
  }
}