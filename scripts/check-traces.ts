import { db, traces } from "../src/db";
import { desc } from "drizzle-orm";

const rows = await db.select().from(traces).orderBy(desc(traces.createdAt)).limit(10);
console.log(rows);