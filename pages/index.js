export default function Home() {
  return (
    <main style={{ padding: "40px", fontFamily: "sans-serif" }}>
      <h1>Welcome to the Inventory App</h1>
      <p>
        This is the homepage.  
        Use the navigation to view products or login as admin.
      </p>
      <ul style={{ marginTop: "20px" }}>
        <li>
          <a href="/products">🛒 View Products</a>
        </li>
        <li>
          <a href="/login">🔑 Admin Login</a>
        </li>
      </ul>
    </main>
  );
}
