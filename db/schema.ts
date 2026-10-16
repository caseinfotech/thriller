import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, primaryKey, check } from "drizzle-orm/sqlite-core";
export const signups = sqliteTable("signups",{id:text("id").primaryKey(),name:text("name").notNull(),email:text("email").notNull(),phone:text("phone").notNull(),source:text("source").notNull().default("existing"),createdAt:text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)});

export const noticePinAttempts = sqliteTable("notice_pin_attempts", { bucket: text("bucket").primaryKey(), attempts: integer("attempts").notNull().default(0) });

export const attendance = sqliteTable("attendance",{sessionId:text("session_id").notNull(),participantEmail:text("participant_email").notNull(),signupId:text("signup_id").notNull(),checkedInAt:text("checked_in_at").notNull().default(sql`CURRENT_TIMESTAMP`)},table=>[primaryKey({columns:[table.sessionId,table.signupId]})]);

export const registrationReconciliations = sqliteTable("registration_reconciliations", {
  id: text("id").primaryKey(),
  snapshot: text("snapshot").notNull(),
  plan: text("plan").notNull(),
  signupsBefore: text("signups_before").notNull(),
  attendanceBefore: text("attendance_before").notNull(),
  consistent: integer("consistent").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, table => [check("registration_snapshot_matches", sql`${table.consistent} = 1`)]);
