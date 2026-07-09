/**
 * Database migration runner.
 * Run this script once to set up your Neon database:
 *
 *   npx tsx lib/db/migrate.ts
 */

import { readFileSync } from "fs";
import { join } from "path";
import { sql } from "./index";

async function migrate() {
  console.log("🚀 Running BondsMaster database migrations...\n");

  const schemaPath = join(process.cwd(), "lib/db/schema.sql");
  const seedPath = join(process.cwd(), "lib/db/seed.sql");

  // Run schema
  console.log("📐 Applying schema...");
  const schema = readFileSync(schemaPath, "utf-8");
  await sql.call(null, [schema] as any);
  console.log("   ✅ Schema applied.\n");

  // Run seed
  console.log("🌱 Seeding default data...");
  const seed = readFileSync(seedPath, "utf-8");
  await sql.call(null, [seed] as any);
  console.log("   ✅ Seed data inserted.\n");

  console.log("✨ Migration complete!");
  console.log("   Default admin: admin@bondsmaster.com / admin123");
}

migrate().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
