import { classes, easternDay } from "./check-in";

// QR registration counts only for the class on its actual Eastern signup date.
// A paper import supplies its class explicitly, independent of its upload date.
export function classForSignup(createdAt: string) {
  const instant = new Date(createdAt.includes("T") ? createdAt : createdAt.replace(" ", "T") + "Z");
  if (!Number.isFinite(instant.getTime())) throw new Error("Invalid signup date.");
  const day = easternDay(instant);
  return classes.find(session => session.day === day);
}

export function signupTimestamp(now = new Date()) {
  return now.toISOString().slice(0, 19).replace("T", " ");
}

// Match the existing same-full-name participant policy. A second QR signup,
// sheet entry, or later duplicate cannot add another visit for the same class.
export function attendanceInsert(name: string, email: string, sessionId: string, checkedInAt: string) {
  return {
    sql: "INSERT OR IGNORE INTO attendance(session_id,participant_email,signup_id,checked_in_at) SELECT ?,?,(SELECT MIN(id) FROM signups WHERE LOWER(TRIM(name))=LOWER(TRIM(?))),? WHERE NOT EXISTS(SELECT 1 FROM attendance a JOIN signups s ON s.id=a.signup_id WHERE a.session_id=? AND LOWER(TRIM(s.name))=LOWER(TRIM(?)))",
    args: [sessionId, email.trim().toLowerCase(), name, checkedInAt, sessionId, name],
  };
}

export const participantAttendanceCountSql = "SELECT COUNT(DISTINCT a.session_id) AS count FROM attendance a JOIN signups s ON s.id=a.signup_id WHERE LOWER(TRIM(s.name))=LOWER(TRIM(?))";
export const classAttendanceCountsSql = "SELECT a.session_id,COUNT(DISTINCT LOWER(TRIM(s.name))) AS count FROM attendance a JOIN signups s ON s.id=a.signup_id GROUP BY a.session_id";
export const attendanceDistributionSql = "SELECT visits,COUNT(*) AS people FROM (SELECT LOWER(TRIM(s.name)),COUNT(DISTINCT a.session_id) AS visits FROM signups s LEFT JOIN attendance a ON a.signup_id=s.id GROUP BY LOWER(TRIM(s.name))) GROUP BY visits ORDER BY visits";
