// pages/api/logout.js
export default function handler(req, res) {
  res.setHeader("Set-Cookie", "admin-auth=; HttpOnly; Path=/; Max-Age=0");
  return res.status(200).json({ message: "Logged out" });
}
