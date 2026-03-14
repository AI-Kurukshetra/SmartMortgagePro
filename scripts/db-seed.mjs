import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import { ensureRoleSeedUsers } from "./seed-role-users.mjs";

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  throw new Error("SUPABASE_DB_URL is missing. Add it to .env and retry.");
}
if (connectionString.includes("YOUR_DB_PASSWORD")) {
  throw new Error("SUPABASE_DB_URL still has placeholder password. Replace YOUR_DB_PASSWORD in .env.");
}

const seedPath = path.join(process.cwd(), "supabase", "seed.sql");
const seedSql = await fs.readFile(seedPath, "utf8");

const seededUsers = await ensureRoleSeedUsers();

const sql = postgres(connectionString, { ssl: "require" });
await sql.begin(async (tx) => {
  await tx.unsafe(seedSql);
});
await sql.end();

for (const user of seededUsers) {
  console.log(
    `Seeded role user: ${user.role} -> ${user.email} / ${user.password} (${user.userId})`,
  );
}

console.log("Seed complete.");
