import { getDb } from "./db";

const db = getDb();
// Retire pre-auth sample rows (they belong to no user).
const retired = db
  .prepare("DELETE FROM items WHERE user_id IS NULL AND title IN ('Welcome to Enthymio', 'Sample YouTube (embed only, no download)')")
  .run();
console.log(`migrate: retired ${retired.changes} sample rows`);
console.log("enthymio.db ready at ./data/enthymio.db");
