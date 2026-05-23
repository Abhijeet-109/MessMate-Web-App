const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'messmate.db'));

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ============================================================
// TABLE CREATION
// ============================================================

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    phone TEXT,
    college TEXT,
    role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student','admin')),
    mess_id TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS messes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    owner_id INTEGER,
    location TEXT,
    contact TEXT,
    thumbnail TEXT,
    is_open INTEGER DEFAULT 1,
    hours_breakfast TEXT,
    hours_lunch TEXT,
    hours_dinner TEXT,
    rating REAL DEFAULT 0,
    reviews_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (owner_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS menu_items (
    id TEXT PRIMARY KEY,
    mess_id TEXT NOT NULL,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    meal_type TEXT NOT NULL CHECK(meal_type IN ('breakfast','lunch','dinner')),
    food_type TEXT DEFAULT 'veg' CHECK(food_type IN ('veg','non-veg')),
    is_available INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (mess_id) REFERENCES messes(id)
  );

  CREATE TABLE IF NOT EXISTS slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mess_id TEXT NOT NULL,
    meal_type TEXT NOT NULL CHECK(meal_type IN ('breakfast','lunch','dinner')),
    time TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 15,
    booked INTEGER DEFAULT 0,
    FOREIGN KEY (mess_id) REFERENCES messes(id)
  );

  CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    mess_id TEXT,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    total_meals INTEGER NOT NULL,
    meal_types TEXT NOT NULL,
    is_recommended INTEGER DEFAULT 0,
    FOREIGN KEY (mess_id) REFERENCES messes(id)
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    mess_id TEXT NOT NULL,
    plan_id TEXT NOT NULL,
    meals_remaining INTEGER NOT NULL,
    total_meals INTEGER NOT NULL,
    no_show_count INTEGER DEFAULT 0,
    max_no_shows INTEGER DEFAULT 3,
    status TEXT DEFAULT 'active' CHECK(status IN ('active','expired','cancelled')),
    starts_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (mess_id) REFERENCES messes(id),
    FOREIGN KEY (plan_id) REFERENCES plans(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    mess_id TEXT NOT NULL,
    subscription_id INTEGER,
    meal_type TEXT NOT NULL,
    slot_time TEXT NOT NULL,
    order_type TEXT NOT NULL CHECK(order_type IN ('Dine-in','Parcel')),
    total INTEGER NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'Placed' CHECK(status IN ('Placed','Accepted','Preparing','Ready','Completed','Cancelled','No-show')),
    payment_method TEXT NOT NULL CHECK(payment_method IN ('Subscription','UPI','Card','Pay on Site')),
    payment_id TEXT,
    notes TEXT,
    estimated_ready_time TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (mess_id) REFERENCES messes(id),
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    menu_item_id TEXT NOT NULL,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price INTEGER NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    subscription_id INTEGER,
    order_id TEXT,
    date TEXT NOT NULL,
    status TEXT CHECK(status IN ('attended','no-show','upcoming')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id),
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    order_id TEXT,
    menu_item_id TEXT,
    mess_id TEXT,
    rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id),
    FOREIGN KEY (mess_id) REFERENCES messes(id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT,
    user_id INTEGER,
    mess_id TEXT,
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    amount INTEGER NOT NULL,
    status TEXT DEFAULT 'created' CHECK(status IN ('created','captured','failed')),
    type TEXT CHECK(type IN ('order','subscription')),
    remarks TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (mess_id) REFERENCES messes(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT CHECK(type IN ('success','warning','error','info')),
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// ============================================================
// MIGRATIONS — Update constraints for existing databases
// ============================================================

// Check if orders table has old CHECK constraint (missing 'Pay on Site')
try {
  const tableInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='orders'").get();
  if (tableInfo && tableInfo.sql && !tableInfo.sql.includes('Pay on Site')) {
    console.log('🔄 Migrating orders table: adding "Pay on Site" payment method...');
    db.exec(`
      PRAGMA foreign_keys=off;
      BEGIN TRANSACTION;
      ALTER TABLE orders RENAME TO orders_old;
      CREATE TABLE orders (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        mess_id TEXT NOT NULL,
        subscription_id INTEGER,
        meal_type TEXT NOT NULL,
        slot_time TEXT NOT NULL,
        order_type TEXT NOT NULL CHECK(order_type IN ('Dine-in','Parcel')),
        total INTEGER NOT NULL DEFAULT 0,
        status TEXT DEFAULT 'Placed' CHECK(status IN ('Placed','Accepted','Preparing','Ready','Completed','Cancelled','No-show')),
        payment_method TEXT NOT NULL CHECK(payment_method IN ('Subscription','UPI','Card','Pay on Site')),
        payment_id TEXT,
        notes TEXT,
        estimated_ready_time TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (mess_id) REFERENCES messes(id),
        FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
      );
      INSERT INTO orders SELECT * FROM orders_old;
      DROP TABLE orders_old;
      COMMIT;
      PRAGMA foreign_keys=on;
    `);
    console.log('✅ Orders table migrated successfully.');
  }
} catch (migrationErr) {
  console.error('⚠️ Orders migration check (non-fatal):', migrationErr.message);
}

// Fix order_items FK if it still references 'orders_old' from a previous migration
try {
  const oiInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='order_items'").get();
  if (oiInfo && oiInfo.sql && oiInfo.sql.includes('orders_old')) {
    console.log('🔄 Fixing order_items foreign key reference...');
    db.pragma('foreign_keys = OFF');
    db.exec(`
      BEGIN TRANSACTION;
      CREATE TABLE order_items_fixed (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT NOT NULL,
        menu_item_id TEXT NOT NULL,
        name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price INTEGER NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
      );
      INSERT INTO order_items_fixed SELECT * FROM order_items;
      DROP TABLE order_items;
      ALTER TABLE order_items_fixed RENAME TO order_items;
      COMMIT;
    `);
    db.pragma('foreign_keys = ON');
    console.log('✅ order_items FK fixed successfully.');
  }
} catch (oiErr) {
  console.error('⚠️ order_items FK fix (non-fatal):', oiErr.message);
}

// Fix attendance FK if it references 'orders_old'
try {
  const attInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='attendance'").get();
  if (attInfo && attInfo.sql && attInfo.sql.includes('orders_old')) {
    console.log('🔄 Fixing attendance foreign key reference...');
    db.pragma('foreign_keys = OFF');
    db.exec(`
      BEGIN TRANSACTION;
      CREATE TABLE attendance_fixed (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        subscription_id INTEGER,
        order_id TEXT,
        date TEXT NOT NULL,
        status TEXT CHECK(status IN ('attended','no-show','upcoming')),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (subscription_id) REFERENCES subscriptions(id),
        FOREIGN KEY (order_id) REFERENCES orders(id)
      );
      INSERT INTO attendance_fixed SELECT * FROM attendance;
      DROP TABLE attendance;
      ALTER TABLE attendance_fixed RENAME TO attendance;
      CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, date);
      COMMIT;
    `);
    db.pragma('foreign_keys = ON');
    console.log('✅ attendance FK fixed successfully.');
  }
} catch (err) {
  console.error('⚠️ attendance FK fix (non-fatal):', err.message);
}

// Fix reviews FK if it references 'orders_old'
try {
  const revInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='reviews'").get();
  if (revInfo && revInfo.sql && revInfo.sql.includes('orders_old')) {
    console.log('🔄 Fixing reviews foreign key reference...');
    db.pragma('foreign_keys = OFF');
    db.exec(`
      BEGIN TRANSACTION;
      CREATE TABLE reviews_fixed (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        order_id TEXT,
        menu_item_id TEXT,
        mess_id TEXT,
        rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
        comment TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id),
        FOREIGN KEY (mess_id) REFERENCES messes(id)
      );
      INSERT INTO reviews_fixed SELECT * FROM reviews;
      DROP TABLE reviews;
      ALTER TABLE reviews_fixed RENAME TO reviews;
      COMMIT;
    `);
    db.pragma('foreign_keys = ON');
    console.log('✅ reviews FK fixed successfully.');
  }
} catch (err) {
  console.error('⚠️ reviews FK fix (non-fatal):', err.message);
}

// Fix payments FK if it references 'orders_old'
try {
  const payInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='payments'").get();
  if (payInfo && payInfo.sql && payInfo.sql.includes('orders_old')) {
    console.log('🔄 Fixing payments foreign key reference...');
    db.pragma('foreign_keys = OFF');
    
    // Check if new columns exist in current payments table to carry them over safely
    const paymentCols = db.prepare("PRAGMA table_info(payments)").all().map(c => c.name);
    const hasMessId = paymentCols.includes('mess_id');
    const hasRemarks = paymentCols.includes('remarks');
    
    db.exec(`
      BEGIN TRANSACTION;
      CREATE TABLE payments_fixed (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT,
        user_id INTEGER,
        mess_id TEXT,
        razorpay_order_id TEXT,
        razorpay_payment_id TEXT,
        razorpay_signature TEXT,
        amount INTEGER NOT NULL,
        status TEXT DEFAULT 'created' CHECK(status IN ('created','captured','failed')),
        type TEXT CHECK(type IN ('order','subscription')),
        remarks TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (mess_id) REFERENCES messes(id)
      );
    `);
    
    if (hasMessId && hasRemarks) {
        db.exec("INSERT INTO payments_fixed (id, order_id, user_id, mess_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, status, type, remarks, created_at) SELECT id, order_id, user_id, mess_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, status, type, remarks, created_at FROM payments;");
    } else {
        db.exec("INSERT INTO payments_fixed (id, order_id, user_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, status, type, created_at) SELECT id, order_id, user_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, status, type, created_at FROM payments;");
    }
    
    db.exec(`
      DROP TABLE payments;
      ALTER TABLE payments_fixed RENAME TO payments;
      COMMIT;
    `);
    db.pragma('foreign_keys = ON');
    console.log('✅ payments FK fixed successfully.');
  }
} catch (err) {
  console.error('⚠️ payments FK fix (non-fatal):', err.message);
}

// Add payment_collected column for postpaid tracking
try {
  const cols = db.prepare("PRAGMA table_info(orders)").all();
  const hasCol = cols.some(c => c.name === 'payment_collected');
  if (!hasCol) {
    db.exec("ALTER TABLE orders ADD COLUMN payment_collected INTEGER DEFAULT 0");
    console.log('✅ Added payment_collected column to orders.');
  }
} catch (pcErr) {
  console.error('⚠️ payment_collected migration (non-fatal):', pcErr.message);
}

// Add mess_id and remarks to payments table
try {
  const paymentCols = db.prepare("PRAGMA table_info(payments)").all();
  if (!paymentCols.some(c => c.name === 'mess_id')) {
    db.exec("ALTER TABLE payments ADD COLUMN mess_id TEXT");
    console.log('✅ Added mess_id column to payments.');
  }
  if (!paymentCols.some(c => c.name === 'remarks')) {
    db.exec("ALTER TABLE payments ADD COLUMN remarks TEXT");
    console.log('✅ Added remarks column to payments.');
  }
} catch (pErr) {
  console.error('⚠️ payments table migration (non-fatal):', pErr.message);
}

// Add todays_special column to messes table
try {
  const messCols = db.prepare("PRAGMA table_info(messes)").all();
  if (!messCols.some(c => c.name === 'todays_special')) {
    db.exec("ALTER TABLE messes ADD COLUMN todays_special TEXT");
    console.log('✅ Added todays_special column to messes.');
  }
} catch (tsErr) {
  console.error('⚠️ todays_special migration (non-fatal):', tsErr.message);
}

// ============================================================
// INDEXES
// ============================================================

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);
  CREATE INDEX IF NOT EXISTS idx_orders_mess_status ON orders(mess_id, status);
  CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, date);
`);

// ============================================================
// SEED DATA (only if tables are empty)
// ============================================================

const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

if (userCount === 0) {
  require('./seed')(db);
}

module.exports = db;

