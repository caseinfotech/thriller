import type { Metadata } from "next";
import { ArrowUpRight, Camera, Heart, Mail, Moon } from "lucide-react";
import styles from "./mob-links.module.css";

export const metadata: Metadata = {
  title: "South Haven Thriller Flash Mob | Quick Links",
  description: "Tip the mob, join the future event mailing list, or share your photos and videos.",
  robots: { index: false, follow: false },
};

const venmoUrl = "https://venmo.com/u/J_Lota";

export default function MobLinks() {
  return <main className={styles.page}>
    <section className={styles.content}>
      <a className={styles.brand} href="/" aria-label="South Haven Thriller Flash Mob home"><Moon size={21} /><span>SOUTH HAVEN <b>THRILLER FLASH MOB</b></span></a>
      <p className={styles.eyebrow}>KEEP THE MOB MOVING</p>
      <h1>Thanks for making<br /><em>this night special.</em></h1>
      <p className={styles.intro}>Choose a link to support the mob, hear about future events, or share your favorite memories.</p>
      <div className={styles.actions}>
        <article className={styles.action}>
          <div className={styles.icon}><Heart size={22} aria-hidden="true" /></div>
          <div className={styles.copy}><h2>Tips for the mob</h2><p>Send Jessica an optional thank-you on Venmo. Add “Tips for the mob” in the note.</p></div>
          <a className={styles.button} href={venmoUrl} target="_blank" rel="noopener noreferrer">Tip on Venmo <ArrowUpRight size={16} aria-hidden="true" /></a>
        </article>
        <article className={styles.action}>
          <div className={styles.icon}><Mail size={22} aria-hidden="true" /></div>
          <div className={styles.copy}><h2>Future event updates</h2><p>Join the separate mailing list to hear when we plan another event.</p></div>
          <a className={styles.button} href="/future-events">Join the list <ArrowUpRight size={16} aria-hidden="true" /></a>
        </article>
        <article className={styles.action}>
          <div className={styles.icon}><Camera size={22} aria-hidden="true" /></div>
          <div className={styles.copy}><h2>Share photos &amp; videos</h2><p>Send up to 3 photos or videos per email address. Submissions are reviewed before appearing in the album.</p></div>
          <a className={styles.button} href="/photos">Submit media <ArrowUpRight size={16} aria-hidden="true" /></a>
        </article>
      </div>
      <footer>Thank you for being part of the South Haven Thriller Flash Mob.</footer>
    </section>
  </main>;
}
