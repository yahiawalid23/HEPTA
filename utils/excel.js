import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

const productsPath = path.join(process.cwd(), "data", "products.xlsx");
const ordersPath = path.join(process.cwd(), "data", "orders.xlsx");

function ensureDataDir() {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
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
  if (!fs.existsSync(ordersPath)) {
    return [];
  }
  const wb = XLSX.readFile(ordersPath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: "" });
}

export function writeOrders(orders) {
  ensureDataDir();
  const ws = XLSX.utils.json_to_sheet(orders);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Orders");
  XLSX.writeFile(wb, ordersPath);
}