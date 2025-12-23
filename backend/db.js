// backend/db.js
const sqlite3 = require("sqlite3").verbose();
const { open } = require("sqlite");
const path = require("path");

// ----------------------------------------------------
// Seed helper: runs ONCE if books table is empty
// ----------------------------------------------------
async function seedBooksIfEmpty(db) {
  const row = await db.get("SELECT COUNT(*) AS c FROM books");
  if (row.c > 0) return;

  const books = [
    [
      "The Great Gatsby",
      "F. Scott Fitzgerald",
      "A classic novel about the American Dream",
      "en",
      1925,
      19.99,
      50,
    ],
    [
      "1984",
      "George Orwell",
      "A dystopian novel about totalitarianism",
      "en",
      1949,
      24.99,
      40,
    ],
    [
      "The Hobbit",
      "J.R.R. Tolkien",
      "A fantasy adventure novel",
      "en",
      1937,
      29.99,
      25,
    ],
  ];

  await db.exec("BEGIN");
  try {
    for (const [name, author, description, language, year, price, stock] of books) {
      await db.run(
        `INSERT INTO books (name, author, description, language, year, price, stock)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, author, description, language, year, price, stock]
      );
    }
    await db.exec("COMMIT");
    console.log(`Seeded ${books.length} books.`);
  } catch (err) {
    await db.exec("ROLLBACK");
    throw err;
  }
}

// ----------------------------------------------------
// DB init
// ----------------------------------------------------
async function initDb() {
  const db = await open({
    filename: path.join(__dirname, "app.db"), 
    driver: sqlite3.Database,
  });

  await db.exec("PRAGMA foreign_keys = ON;");

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('CUSTOMER','EMPLOYEE','ADMIN')),
      address TEXT,
      default_lang TEXT
    );

    CREATE TABLE IF NOT EXISTS profiles (
      user_id INTEGER PRIMARY KEY,
      phone TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      author TEXT NOT NULL,
      description TEXT DEFAULT '',
      year INTEGER,
      language TEXT,
      price REAL NOT NULL CHECK (price >= 0),
      stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
      image_id INTEGER,
      FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'NEW',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS order_items (
      order_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      PRIMARY KEY (order_id, book_id),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE RESTRICT
    );
  `);

  // Safe migration for older DBs
  await db.exec(
    "ALTER TABLE books ADD COLUMN description TEXT DEFAULT ''"
  ).catch(() => {});

  // Seed books if empty
  await seedBooksIfEmpty(db);

  return db;
}

module.exports = { initDb };
