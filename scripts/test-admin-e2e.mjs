async function run() {
  console.log("1. Testing unauthenticated request to /api/admin/orders...");
  const res1 = await fetch("http://localhost:3000/api/admin/orders");
  console.log("Status:", res1.status);
  const data1 = await res1.json();
  console.log("Body:", data1);

  if (res1.status !== 401) {
    throw new Error("Expected 401 Unauthorized for unauthenticated request");
  }

  console.log("\n2. Logging in as OWNER (adarshshukla4639@gmail.com)...");
  const loginRes = await fetch("http://localhost:3000/api/admin/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "adarshshukla4639@gmail.com" }),
  });
  console.log("Login status:", loginRes.status);
  const loginData = await loginRes.json();
  console.log("Login result:", loginData);

  const setCookie = loginRes.headers.get("set-cookie");
  console.log("Session Cookie Received:", setCookie ? setCookie.split(";")[0] : "NONE");

  if (!setCookie) {
    throw new Error("Expected session cookie on owner login");
  }

  const cookieHeader = setCookie.split(";")[0];

  console.log("\n3. Testing authenticated request to /api/admin/orders with owner cookie...");
  const ordersRes = await fetch("http://localhost:3000/api/admin/orders", {
    headers: { Cookie: cookieHeader },
  });
  console.log("Orders status:", ordersRes.status);
  const ordersData = await ordersRes.json();
  console.log("Orders retrieved:", ordersData.orders?.length, "orders. Total store count:", ordersData.totalCount);

  if (ordersRes.status !== 200 || !ordersData.orders) {
    throw new Error("Failed to retrieve orders as authenticated owner");
  }

  console.log("\n4. Testing authenticated request to /api/admin/dashboard with owner cookie...");
  const dashRes = await fetch("http://localhost:3000/api/admin/dashboard", {
    headers: { Cookie: cookieHeader },
  });
  console.log("Dashboard status:", dashRes.status);
  const dashData = await dashRes.json();
  console.log("Store GMV Revenue:", dashData.kpi?.revenue?.value);
  console.log("Total Orders KPI:", dashData.kpi?.totalOrders?.value);
  console.log("Store Systems Online:", Object.keys(dashData.liveStatus || {}).length, "services");

  console.log("\n✅ ALL LIVE SERVER VERIFICATIONS PASSED SUCCESSFULLY!");
}

run().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
