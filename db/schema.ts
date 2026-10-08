import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
export const signups = sqliteTable("signups",{id:text("id").primaryKey(),name:text("name").notNull(),email:text("email").notNull(),phone:text("phone").notNull(),createdAt:text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)});
