import type { Metadata } from "next";
import { ArrowDownToLine, ArrowLeft } from "lucide-react";
import styles from "./practice-songs.module.css";

export const metadata: Metadata = {
  title: "Practice Song Downloads | South Haven Thriller",
  description: "Download Thriller at 90% tempo and three Michael Jackson songs at original speed.",
  robots: { index: false, follow: false },
};

const songs = [
  { title: "Thriller", speed: "90% tempo", href: "/audio/thriller-michael-jackson-90-tempo.mp3", file: "MP3 · slowed for practice" },
  { title: "Billie Jean", speed: "Original speed", href: "/audio/billie-jean.mp3", file: "MP3 · original recording" },
  { title: "Beat It", speed: "Original speed", href: "/audio/beat-it.mp3", file: "MP3 · original recording" },
  { title: "Wanna Be Startin’ Somethin’", speed: "Original speed", href: "/audio/wanna-be-startin-somethin.mp3", file: "MP3 · original recording" },
  { title: "P.Y.T. (Pretty Young Thing)", speed: "Original speed", href: "/audio/pyt.mp3", file: "MP3 · original recording" },
];

export default function PracticeSongs() {
  return <main className={styles.page}>
    <header className={styles.header}>
      <a href="/practice" className={styles.back}><ArrowLeft size={16} aria-hidden="true" /> Back to practice</a>
      <p>SOUTH HAVEN THRILLER FLASH MOB</p>
    </header>
    <section className={styles.content}>
      <p className="eyebrow">PRACTICE MUSIC</p>
      <h1>Take the songs<br /><em>with you.</em></h1>
      <p className={styles.intro}>Download a track to practice at home. Thriller is slowed to 90%; the other songs are at original speed.</p>
      <div className={styles.list}>
        {songs.map((song, index) => <article className={styles.song} key={song.href}>
          <div className={styles.number}>{String(index + 1).padStart(2, "0")}</div>
          <div className={styles.songInfo}>
            <h2>{song.title}</h2>
            <p>{song.speed} <span>·</span> {song.file}</p>
          </div>
          <a className={styles.download} href={song.href} download aria-label={`Download ${song.title}`}>
            <span>Download</span><ArrowDownToLine size={18} aria-hidden="true" />
          </a>
        </article>)}
      </div>
    </section>
    <footer className={styles.footer}><a href="/practice">Return to the practice page</a></footer>
  </main>;
}
