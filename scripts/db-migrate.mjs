import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  throw new Error("SUPABASE_DB_URL is missing. Add it to .env and retry.");
}
if (connectionString.includes("YOUR_DB_PASSWORD")) {
  throw new Error("SUPABASE_DB_URL still has placeholder password. Replace YOUR_DB_PASSWORD in .env.");
}

const migrationDir = path.join(process.cwd(), "supabase", "migrations");
const sql = postgres(connectionString, { ssl: "require" });

await sql`
  create table if not exists public.schema_migrations (
    version text primary key,
    applied_at timestamptz not null default now()
  )
`;

const files = (await fs.readdir(migrationDir))
  .filter((name) => name.endsWith(".sql"))
  .sort();

for (const file of files) {
  const version = file.replace(/\.sql$/, "");
  const exists = await sql`
    select exists(
      select 1 from public.schema_migrations where version = ${version}
    ) as exists
  `;

  if (exists[0]?.exists) {
    continue;
  }

  const fullPath = path.join(migrationDir, file);
  const content = await fs.readFile(fullPath, "utf8");
  await sql.begin(async (tx) => {
    await tx.unsafe(content);
    await tx`
      insert into public.schema_migrations(version)
      values (${version})
      on conflict (version) do nothing
    `;
  });
  console.log(`Applied migration: ${file}`);
}

await sql.end();
console.log("Migrations complete.");
