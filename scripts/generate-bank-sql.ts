// Rewrites the generated bank section of the given migration from lib/bank/catalog.ts.
// Usage: npm run bank:sql -- supabase/migrations/<file>.sql
import { readFile, writeFile } from "node:fs/promises";
import { BEGIN_MARKER, END_MARKER, bankSeedSql } from "../lib/bank/sql.ts";

const file = process.argv[2];
if (!file) throw new Error("Usage: npm run bank:sql -- <migration file>");
const sql = await readFile(file, "utf8");
const start = sql.indexOf(BEGIN_MARKER);
const end = sql.indexOf(END_MARKER);
if (start < 0 || end < 0) throw new Error(`Markers not found in ${file}`);
await writeFile(file, sql.slice(0, start) + bankSeedSql() + sql.slice(end + END_MARKER.length));
console.log(`✓ bank written to ${file}`);
