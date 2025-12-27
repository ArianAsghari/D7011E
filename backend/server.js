// backend/server.js
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");

const { initDb } = require("./db");

const { booksRouter } = require("./routes/books");
const { authRouter } = require("./routes/auth");
const { ordersRouter } = require("./routes/orders");
const { profilesRouter } = require("./routes/profiles");
const { imagesRouter } = require("./routes/images");


const app = express();
app.use(cors());
app.use(express.json());

// ----------------------------------------------------
// ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD
// MANAGER_SEED_EMAIL / MANAGER_SEED_PASSWORD   (role EMPLOYEE)
// ----------------------------------------------------
async function seedUsersIfRequested(db) {
  async function seedOne(email, password, name, role) {
    if (!email || !password) return;

    const cleanEmail = email.trim().toLowerCase();

    const existing = await db.get("SELECT id FROM users WHERE email=?", [cleanEmail]);
    if (existing) return;

    const hash = await bcrypt.hash(password, 10);

    const r = await db.run(
      "INSERT INTO users (email,name,password_hash,role) VALUES (?,?,?,?)",
      [cleanEmail, name || role, hash, role]
    );

    // One-to-one profile row
    await db.run("INSERT OR IGNORE INTO profiles (user_id, phone) VALUES (?, ?)", [r.lastID, null]);

    console.log(`Seeded ${role}: ${cleanEmail}`);
  }

  // Admin seed
  await seedOne(
    process.env.ADMIN_SEED_EMAIL,
    process.env.ADMIN_SEED_PASSWORD,
    process.env.ADMIN_SEED_NAME || "Seed Admin",
    "ADMIN"
  );

  // Manager seed (Manager = EMPLOYEE in your DB)
  await seedOne(
    process.env.MANAGER_SEED_EMAIL,
    process.env.MANAGER_SEED_PASSWORD,
    process.env.MANAGER_SEED_NAME || "Seed Manager",
    "EMPLOYEE"
  );
}

async function start() {
  const db = await initDb();

  // Seed bootstrap users (optional, controlled by env vars)
  await seedUsersIfRequested(db);

  // Health check
  app.get("/api/health", (req, res) => res.json({ ok: true, db: "ready" }));

  // Debug helper: list tables
  app.get("/api/tables", async (req, res) => {
    const rows = await db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    res.json(rows);
  });

  // ----------------------------------------------------
  // Mount ALL APIs
  // ----------------------------------------------------
  app.use("/api/books", booksRouter(db));
  app.use("/api/images", imagesRouter(db));
  app.use("/api/profiles", profilesRouter(db));

  // Auth endpoints: /api/register, /api/me, /api/admin/create-user, etc.
  app.use("/api", authRouter(db));

  // Orders endpoints: /api/orders, /api/orders/my, /api/orders/users..., etc.
  app.use("/api/orders", ordersRouter(db));

  app.listen(8080, () => console.log("API running on http://localhost:8080"));
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
