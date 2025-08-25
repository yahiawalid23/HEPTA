import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  const { type } = req.query; // products | orders
  if (!type || !["products", "orders"].includes(type)) {
    return res.status(400).json({ message: "Invalid type" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ message: "Supabase env vars missing" });
  }
  const supabase = createClient(supabaseUrl, supabaseKey);

  const pathInBucket = `${type}.xlsx`;
  const { data, error } = await supabase.storage.from("files").download(pathInBucket);
  if (error) {
    if (error.message && /object not found/i.test(error.message)) {
      return res.status(404).json({ message: "File not found" });
    }
    console.error("download error", error);
    return res.status(500).json({ message: "Error downloading file" });
  }

  res.setHeader("Content-Disposition", `attachment; filename=${type}.xlsx`);
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );

  // data is a Blob in Node per supabase-js; convert to buffer and send
  const arrayBuffer = await data.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  res.status(200).send(buffer);
}
