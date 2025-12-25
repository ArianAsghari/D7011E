const express = require("express");
const cors = require("cors");

const { initDb } = require("./db");
const { booksRouter } = require("./routes/books");
const { authRouter } = require("./routes/auth");
const { ordersRouter } = require("./routes/orders");
const { imagesRouter } = require("./routes/images");
const { profilesRouter } = require("./routes/profiles");

const app = express();
app.use(cors());
app.use(express.json());

async function start() {
  const db = await initDb();

  app.get("/api/health", (req, res) => res.json({ ok: true, db: "ready" }));

  app.get("/api/tables", async (req, res) => {
    const rows = await db.all(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    res.json(rows);
  });

  app.use("/api/books", booksRouter(db));
  app.use("/api", authRouter(db));        // /api/register, /api/me, /api/admin/create-user
  app.use("/api/orders", ordersRouter(db)); // /api/orders, /api/orders/mine
  app.use("/api/images", imagesRouter(db));
  app.use("/api/profiles", profilesRouter(db));

  app.listen(8080, () => console.log("API running on http://localhost:8080"));
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
