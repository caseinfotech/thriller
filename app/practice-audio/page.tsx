import type { Metadata } from "next";
import PracticePlayer from "./practice-player";
import styles from "./practice.module.css";

export const metadata: Metadata = {
  title: "Practice Audio | South Haven Thriller",
  description: "Thriller rehearsal audio with adjustable tempo.",
  robots: { index: false, follow: false, noarchive: true },
};

export default function PracticeAudio() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <p className={styles.brand}>SOUTH HAVEN · THRILLER FLASH MOB</p>
        <p className={styles.eyebrow}>YOUR REHEARSAL, YOUR PACE</p>
        <h1>Find your<br /><em>Thriller tempo.</em></h1>
        <p className={styles.intro}>Slow it down. Learn the moves. Bring it up to full speed.</p>
        <PracticePlayer />
        <p className={styles.footer}>SOUTH HAVEN THRILLER · PRACTICE AUDIO</p>
      </div>
    </main>
  );
}
