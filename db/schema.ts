import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
export const signups = sqliteTable("signups",{id:text("id").primaryKey(),name:text("name").notNull(),email:text("email").notNull(),phone:text("phone").notNull(),createdAt:text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)});

export const noticePinAttempts = sqliteTable("notice_pin_attempts", { bucket: text("bucket").primaryKey(), attempts: integer("attempts").notNull().default(0) });
