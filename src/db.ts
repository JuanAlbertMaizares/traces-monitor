// aca se exportan tanto esquemas como un pool

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { pgTable, text, integer } from "drizzle-orm/pg-core";
import "dotenv/config";

// se exporta un esquema de una tabla
export const traces = pgTable("traces", {
  id: text("id").primaryKey(),
  method: text("method").notNull(),
  path: text("path").notNull(),
  status: integer("status"),
  durationMs: integer("duration_ms"),
  createdAt: text("created_at").notNull(),
});

// Conexión usando pg Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
// exportamos un pool de conexion
export const db = drizzle(pool);

console.log("[db] PostgreSQL (Neon) listo con el ORM Drizzle");