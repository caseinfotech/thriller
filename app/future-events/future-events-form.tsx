"use client";
import { FormEvent, useState } from "react";
import { ArrowUpRight, Check, Moon } from "lucide-react";
import { readJsonResponse } from "../../lib/client-api-response";
import styles from "./future-events.module.css";

export default function FutureEventsForm() {
  const [status, setStatus] = useState<"idle" | "saving" | "success">("idle");
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("saving");
    const form = event.currentTarget;
    const values = new FormData(form);
    try {
      const response = await fetch("/api/future-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: String(values.get("email") || ""), name: String(values.get("name") || ""), consent: values.get("consent") === "on", website: String(values.get("website") || "") }),
      });
      const data = await readJsonResponse<{ error?: string }>(response, "The mailing-list service is temporarily unavailable. Please try again later.");
      if (!response.ok) throw new Error(data.error || "Please try again.");
      setStatus("success");
      form.reset();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn’t save your email. Please try again.");
      setStatus("idle");
    }
  }
  return <main className={styles.page}>
    <section className={styles.content}>
      <a href="/mob-links" className={styles.brand}><Moon size={21} /><span>SOUTH HAVEN <b>THRILLER FLASH MOB</b></span></a>
      <p className={styles.eyebrow}>STAY IN THE LOOP</p>
      <h1>Hear about the<br /><em>next Thriller.</em></h1>
      {status === "success" ? <div className={styles.success} role="status"><Check size={24} /><div><h2>You’re on the list.</h2><p>We’ll email you about future South Haven Thriller Flash Mob events.</p></div></div> : <>
        <p className={styles.intro}>Get an occasional email when we plan another event. This list is separate from event signups.</p>
        <form className={styles.form} onSubmit={submit}>
          <label>Preferred name <span>Optional</span><input name="name" autoComplete="given-name" maxLength={80} placeholder="Your name" disabled={status === "saving"} /></label>
          <label>Email address<input name="email" type="email" autoComplete="email" maxLength={254} required placeholder="you@example.com" disabled={status === "saving"} /></label>
          <div className={styles.trap} aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
          <label className={styles.consent}><input type="checkbox" name="consent" required disabled={status === "saving"} /><span>I agree to receive occasional email updates about future South Haven Thriller Flash Mob events.</span></label>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <button type="submit" disabled={status === "saving"}>{status === "saving" ? "Saving…" : "Join the mailing list"}<ArrowUpRight size={17} aria-hidden="true" /></button>
        </form>
        <p className={styles.privacy}>Submitting this form adds your email to the future-events list only; it does not register you for an event.</p>
      </>}
      <a className={styles.return} href="/mob-links">Back to event links</a>
    </section>
  </main>;
}
