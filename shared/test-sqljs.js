const initSqlJs = require('sql.js');

async function main() {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  
  // Test 1: Exception table (id is INTEGER PRIMARY KEY)
  db.run("CREATE TABLE exc (id INTEGER PRIMARY KEY, status TEXT)");
  db.run("INSERT INTO exc (id, status) VALUES (1, 'PENDING')");
  
  let stmt = db.prepare("UPDATE exc SET status = ? WHERE id = ?");
  stmt.bind(['RETRY', '1']); // Passing STRING '1' to INTEGER column
  stmt.step();
  stmt.free();
  console.log("Exception update (string '1' for integer ID):", db.getRowsModified());
  
  // Test 2: Consent table (id is TEXT)
  db.run("CREATE TABLE cons (id TEXT PRIMARY KEY, status TEXT, revoked_at TEXT)");
  db.run("INSERT INTO cons (id, status) VALUES ('uuid-123', 'ACTIVE')");
  
  stmt = db.prepare("UPDATE cons SET status = 'REVOKED', revoked_at = ? WHERE id = ? AND status = 'ACTIVE'");
  stmt.bind(['2026-09-15T12:00:00Z', 'uuid-123']);
  stmt.step();
  stmt.free();
  console.log("Consent update (UUID):", db.getRowsModified());
}

main();
