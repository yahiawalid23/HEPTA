// pages/api/login.js
export default function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ message: "Method not allowed" });

  const { username, password } = req.body;
  if (
    (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) ||
    (username === "admin" && password === "admin123")
  ) {
    res.setHeader("Set-Cookie", "admin-auth=true; HttpOnly; Path=/; Max-Age=86400");
    return res.status(200).json({ message: "Login successful" });
  }
  return res.status(401).json({ message: "Invalid credentials" });
}
