// backend/db.js
const sqlite3 = require("sqlite3").verbose();
const { open } = require("sqlite");
const path = require("path");
const bcrypt = require("bcrypt");

// ----------------------------------------------------
// Seed helper: runs ONCE if books table is empty
// ----------------------------------------------------
async function seedBooksIfEmpty(db) {
  const row = await db.get("SELECT COUNT(*) AS c FROM books");
  if (row?.c > 0) return;

  const books = [
    ["The Great Gatsby", "F. Scott Fitzgerald", "A classic novel about the American Dream", "en", 1925, 19.99, 50],
    ["To Kill a Mockingbird", "Harper Lee", "A story of racial injustice in the American South", "en", 1960, 15.99, 30],
    ["1984", "George Orwell", "A dystopian novel about totalitarianism", "en", 1949, 24.99, 40],
    ["Pride and Prejudice", "Jane Austen", "A romantic novel about societal expectations", "en", 1813, 12.99, 20],
    ["The Hobbit", "J.R.R. Tolkien", "A fantasy adventure novel", "en", 1937, 29.99, 25],
    ["Harry Potter and the Sorcerer's Stone", "J.K. Rowling", "The first book in the Harry Potter series", "en", 1997, 18.99, 60],
    ["The Catcher in the Rye", "J.D. Salinger", "A novel about teenage angst and rebellion", "en", 1951, 17.99, 35],
    ["Moby-Dick", "Herman Melville", "A tale of the captains obsessive quest for the white whale", "en", 1851, 22.99, 15],
    ["The Lord of the Rings", "J.R.R. Tolkien", "An epic fantasy trilogy", "en", 1954, 39.99, 55],
    ["The Da Vinci Code", "Dan Brown", "A mystery-thriller novel", "en", 2003, 26.99, 48],
    ["The Alchemist", "Paulo Coelho", "A philosophical novel about following ones dreams", "en", 1988, 21.99, 42],
    ["Brave New World", "Aldous Huxley", "A dystopian novel about a futuristic society", "en", 1932, 28.99, 38],
    ["Frankenstein", "Mary Shelley", "A classic Gothic novel about science and morality", "en", 1818, 14.99, 27],
    ["The Odyssey", "Homer", "An ancient Greek epic poem", "en", 1999, 19.99, 23],
    ["The Shining", "Stephen King", "A horror novel about a haunted hotel", "en", 1977, 31.99, 29],
    ["The Hunger Games", "Suzanne Collins", "A dystopian novel set in a post-apocalyptic world", "en", 2008, 16.99, 33],
    ["A Tale of Two Cities", "Charles Dickens", "A historical novel set during the French Revolution", "en", 1859, 23.99, 36],
    ["The Road", "Cormac McCarthy", "A post-apocalyptic novel about a father and sons journey", "en", 2006, 25.99, 44],
    ["One Hundred Years of Solitude", "Gabriel García Márquez", "A magical realist novel about the Buendía family", "en", 1967, 27.99, 50],
    ["The Hitchhiker's Guide to the Galaxy", "Douglas Adams", "A comedic science fiction series", "en", 1979, 20.99, 22],
    ["Wuthering Heights", "Emily Brontë", "A dark and passionate tale of love and revenge", "en", 1847, 18.99, 28],
    ["The Girl with the Dragon Tattoo", "Stieg Larsson", "A psychological thriller novel", "en", 2005, 29.99, 47],
    ["The Art of War", "Sun Tzu", "An ancient Chinese military treatise", "en", 2005, 12.99, 18],
    ["The Count of Monte Cristo", "Alexandre Dumas", "An adventure novel about revenge and redemption", "en", 1844, 34.99, 31],
    ["The Picture of Dorian Gray", "Oscar Wilde", "A philosophical novel about the consequences of indulgence", "en", 1890, 16.99, 39],
    ["The Kite Runner", "Khaled Hosseini", "A novel about friendship, betrayal, and redemption", "en", 2003, 21.99, 26],
    ["The Grapes of Wrath", "John Steinbeck", "A novel about the struggles of the Joad family during the Great Depression", "en", 1939, 24.99, 34],
    ["Crime and Punishment", "Fyodor Dostoevsky", "A psychological novel about morality and redemption", "en", 1866, 28.99, 37],
    ["The Brothers Karamazov", "Fyodor Dostoevsky", "A philosophical novel about family and morality", "en", 1880, 30.99, 45],
    ["The Scarlet Letter", "Nathaniel Hawthorne", "A novel about sin, guilt, and redemption in Puritan society", "en", 1850, 19.99, 24],
    ["The Sun Also Rises", "Ernest Hemingway", 'A novel about the "Lost Generation" after World War I', "en", 1926, 22.99, 32],
    ["Gone with the Wind", "Margaret Mitchell", "A historical novel set during the American Civil War", "en", 1936, 26.99, 49],
    ["The Wind in the Willows", "Kenneth Grahame", "A classic children's novel about animal adventures", "en", 1908, 14.99, 21],
    ["The Silence of the Lambs", "Thomas Harris", "A psychological horror novel featuring Hannibal Lecter", "en", 1988, 32.99, 41],
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
// Seed helper: runs ONCE if orders table is empty
// ----------------------------------------------------
async function seedOrdersIfEmpty(db) {
  const row = await db.get("SELECT COUNT(*) AS c FROM orders");
  if (row?.c > 0) return;

  // 1) Find a CUSTOMER (or create one if missing)
  let customer = await db.get("SELECT id FROM users WHERE role='CUSTOMER' ORDER BY id LIMIT 1");

  if (!customer) {
    const hash = await bcrypt.hash("customer123", 10);
    const r = await db.run(
      "INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)",
      ["Seed Customer", "customer@test.com", hash, "CUSTOMER"]
    );
    await db.run("INSERT INTO profiles (user_id, phone) VALUES (?, ?)", [r.lastID, null]);
    customer = { id: r.lastID };
    console.log("Seeded CUSTOMER: customer@test.com / customer123");
  }

  // 2) Pick some books
  const books = await db.all("SELECT id, price, stock FROM books ORDER BY id LIMIT 3");
  if (books.length === 0) return;

  // Ensure we don’t go negative stock on demo
  // (Only reduce stock if it is enough; otherwise leave stock unchanged.)
  const itemsToAdd = [
    { book_id: books[0].id, quantity: 1, unit_price: books[0].price },
    { book_id: books[1].id, quantity: 2, unit_price: books[1].price },
  ];

  await db.exec("BEGIN");
  try {
    const o = await db.run(
      "INSERT INTO orders (customer_id, status) VALUES (?, ?)",
      [customer.id, "NEW"]
    );

    for (const it of itemsToAdd) {
      await db.run(
        "INSERT INTO order_items (order_id, book_id, quantity, unit_price) VALUES (?,?,?,?)",
        [o.lastID, it.book_id, it.quantity, it.unit_price]
      );

      const b = await db.get("SELECT stock FROM books WHERE id=?", [it.book_id]);
      if (b && Number(b.stock) >= it.quantity) {
        await db.run("UPDATE books SET stock = stock - ? WHERE id = ?", [it.quantity, it.book_id]);
      }
    }

    await db.exec("COMMIT");
    console.log(`Seeded 1 order with ${itemsToAdd.length} items.`);
  } catch (err) {
    await db.exec("ROLLBACK");
    throw err;
  }
}

// ----------------------------------------------------
// Seed helper: ensure admin + manager exist (runs if missing)
// ----------------------------------------------------
async function seedStaffIfMissing(db) {
  // ADMIN
  const adminEmail = "admin@test.com";
  const adminPass = "admin123";
  let admin = await db.get("SELECT id FROM users WHERE email=?", [adminEmail]);
  if (!admin) {
    const hash = await bcrypt.hash(adminPass, 10);
    const r = await db.run(
      "INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)",
      ["Admin", adminEmail, hash, "ADMIN"]
    );
    await db.run("INSERT OR IGNORE INTO profiles (user_id, phone) VALUES (?, ?)", [r.lastID, null]);
    console.log("Seeded ADMIN: admin@test.com / admin123");
  }

  // MANAGER = EMPLOYEE
  const managerEmail = "manager@test.com";
  const managerPass = "manager123";
  let manager = await db.get("SELECT id FROM users WHERE email=?", [managerEmail]);
  if (!manager) {
    const hash = await bcrypt.hash(managerPass, 10);
    const r = await db.run(
      "INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)",
      ["Manager", managerEmail, hash, "EMPLOYEE"]
    );
    await db.run("INSERT OR IGNORE INTO profiles (user_id, phone) VALUES (?, ?)", [r.lastID, null]);
    console.log("Seeded MANAGER: manager@test.com / manager123");
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

  // Enforce FKs in SQLite
  await db.exec("PRAGMA foreign_keys = ON;");

  // Create tables (safe to run multiple times)
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
      unit_price REAL,
      PRIMARY KEY (order_id, book_id),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE RESTRICT
    );
  `);

  // Lightweight “migrations” (in case older db exists)
  await db.exec("ALTER TABLE books ADD COLUMN description TEXT DEFAULT ''").catch(() => {});
  await db.exec("ALTER TABLE order_items ADD COLUMN unit_price REAL").catch(() => {});

  // Seed (books first, then orders)
  await seedBooksIfEmpty(db);
  await seedStaffIfMissing(db);
  await seedOrdersIfEmpty(db);

  return db;
}

module.exports = { initDb };
