import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
export const signups = sqliteTable("signups",{id:text("id").primaryKey(),name:text("name").notNull(),email:text("email").notNull(),phone:text("phone").notNull(),source:text("source").notNull().default("existing"),createdAt:text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)});

export const noticePinAttempts = sqliteTable("notice_pin_attempts", { bucket: text("bucket").primaryKey(), attempts: integer("attempts").notNull().default(0) });

export const attendance = sqliteTable("attendance",{sessionId:text("session_id").notNull(),participantEmail:text("participant_email").notNull(),signupId:text("signup_id").notNull(),checkedInAt:text("checked_in_at").notNull().default(sql`CURRENT_TIMESTAMP`)},table=>[primaryKey({columns:[table.sessionId,table.signupId]})]);
