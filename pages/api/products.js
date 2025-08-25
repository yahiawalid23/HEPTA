import { readProducts } from "@/utils/excel";

export default function handler(req, res) {
  const products = readProducts();
  res.status(200).json({ products });
}
