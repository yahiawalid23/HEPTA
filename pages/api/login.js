// pages/api/login.js
export default function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ message: "Method not allowed" });

  const { username, password } = req.body;
  const envUser = process.env.ADMIN_USER;
  const envPass = process.env.ADMIN_PASS;

  const isValid = envUser && envPass && username === envUser && password === envPass;
  if (isValid) {
    const isProd = process.env.NODE_ENV === "production";
    const cookie = [
      "admin-auth=true",
      "HttpOnly",
      "Path=/",
      "Max-Age=86400",
      "SameSite=Lax",
      isProd ? "Secure" : null,
    ]
      .filter(Boolean)
      .join("; ");

    res.setHeader("Set-Cookie", cookie);
    return res.status(200).json({ message: "Login successful" });
  }
  return res.status(401).json({ message: "Invalid credentials" });
}
