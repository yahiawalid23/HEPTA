// pages/api/logout.js
export default function handler(req, res) {
  const isProd = process.env.NODE_ENV === "production";
  const cookie = [
    "admin-auth=",
    "HttpOnly",
    "Path=/",
    "Max-Age=0",
    "SameSite=Lax",
    isProd ? "Secure" : null,
  ]
    .filter(Boolean)
    .join("; ");

  res.setHeader("Set-Cookie", cookie);
  return res.status(200).json({ message: "Logged out" });
}
