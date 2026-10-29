import { desc, sql } from "drizzle-orm";
import { sqliteTable, text, integer, primaryKey, check, index } from "drizzle-orm/sqlite-core";
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

export const eventMedia = sqliteTable("event_media", {
  id: text("id").primaryKey(),
  submitterKey: text("submitter_key").notNull(),
  objectKey: text("object_key").notNull().unique(),
  contentType: text("content_type").notNull(),
  originalName: text("original_name").notNull(),
  fileSize: integer("file_size").notNull(),
  partCount: integer("part_count").notNull(),
  contributor: text("contributor").notNull().default(""),
  caption: text("caption").notNull().default(""),
  creditContributor: integer("credit_contributor").notNull().default(0),
  consentedAt: text("consented_at").notNull(),
  status: text("status").notNull().default("uploading"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  publishedAt: text("published_at"),
}, table => [
  index("event_media_status_created_idx").on(table.status, desc(table.createdAt)),
  index("event_media_submitter_idx").on(table.submitterKey),
]);

export const eventMediaSubmissionLimits = sqliteTable("event_media_submission_limits", {
  submitterKey: text("submitter_key").primaryKey(),
  used: integer("used").notNull().default(0),
});

export const eventMediaRateLimits = sqliteTable("event_media_rate_limits", {
  day: text("day").notNull(),
  fingerprint: text("fingerprint").notNull(),
  count: integer("count").notNull().default(0),
}, table => [primaryKey({ columns: [table.day, table.fingerprint] })]);
