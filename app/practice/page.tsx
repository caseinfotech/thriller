import type { Metadata } from "next";
import { Moon, ArrowDown, ArrowUpRight, Download } from "lucide-react";
import PracticePlayer from "../practice-audio/practice-player";
import PracticeMedia from "./practice-media";
import styles from "./practice.module.css";

export const metadata: Metadata = {
  title: "Practice with Jess | South Haven Thriller",
  description: "Practice the South Haven Thriller routine with Jess, follow the instructional videos, and rehearse with adjustable-tempo music.",
};

export default function Practice() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a className="brand" href="/"><Moon size={23} /><span>SOUTH HAVEN <b>THRILLER FLASH MOB</b></span></a>
        <a className={styles.back} href="/">Back to the event <ArrowUpRight size={15} aria-hidden="true" /></a>
      </header>
      <div className={styles.content}>
        <section className={styles.intro}>
          <p className="eyebrow">YOUR AT-HOME PRACTICE COMPANION</p>
          <h1>A little practice.<br /><em>A lot of Thriller.</em></h1>
          <p>Learn with Jess, repeat your favorite moves, and find your tempo.</p>
          <nav className={styles.shortcuts} aria-label="Practice resources">
            <a href="#jess-video">Practice with Jess</a><a href="#jess-video-2">Video 2</a><a href="#jess-video-3">Video 3</a><a href="#tempo">Thriller tempo</a><a href="#videos">Thriller reference</a><a href="/moves-cheatsheets">Moves Cheatsheets</a>
          </nav>
        </section>
        <PracticeMedia>
          <section className={styles.feature} id="jess-video" aria-labelledby="jess-heading">
            <div className={styles.featureCopy}>
              <p className="eyebrow">START HERE · VIDEO 1 · 2:07</p>
              <h2 id="jess-heading">Practice<br />with Jess.</h2>
              <p>Follow along with Jess’s latest practice video. Pause whenever you need, or drag the timeline to go over a move again.</p>
              <a className={styles.tempoLink} href="#tempo">Ready to try it to music? <ArrowDown size={18} aria-hidden="true" /></a>
              <p className={styles.small}>Use the full-screen button for a closer look.</p>
            </div>
            <div className={styles.portraitVideo}>
              <video controls playsInline preload="metadata" poster="/videos/jess-practice-1-final.jpg" aria-label="Practice with Jess: video 1">
                <source src="/videos/jess-practice-1-final.mp4" type="video/mp4" />
                Your browser does not support video playback. <a href="/videos/jess-practice-1-final.mp4">Open Jess’s practice video</a>
              </video>
            </div>
          </section>
          <section className={styles.feature} id="jess-video-2" aria-labelledby="jess-second-heading">
            <div className={styles.featureCopy}>
              <p className="eyebrow">VIDEO 2 · 1:17</p>
              <h2 id="jess-second-heading">Keep practicing<br />with Jess.</h2>
              <p>Follow along with another practice clip. Pause when you need a moment, or drag the timeline back to repeat a move.</p>
              <a className={styles.tempoLink} href="#tempo">Practice at your own tempo <ArrowDown size={18} aria-hidden="true" /></a>
            </div>
            <div className={styles.portraitVideo}>
              <video controls playsInline preload="metadata" poster="/videos/jess-practice-2-final.jpg" aria-label="Practice with Jess: video 2">
                <source src="/videos/jess-practice-2-final.mp4" type="video/mp4" />
                Your browser does not support video playback. <a href="/videos/jess-practice-2-final.mp4">Open Jess’s second practice video</a>
              </video>
            </div>
          </section>
          <section className={styles.feature} id="jess-video-3" aria-labelledby="jess-third-heading">
            <div className={styles.featureCopy}>
              <p className="eyebrow">VIDEO 3 · 1:39</p>
              <h2 id="jess-third-heading">Follow along<br />from behind.</h2>
              <p>A rear view of the routine to help you follow Jess’s direction. Pause or drag the timeline back to go over a section again.</p>
              <a className={styles.tempoLink} href="/moves-cheatsheets">Keep the move instructions handy <ArrowUpRight size={18} aria-hidden="true" /></a>
            </div>
            <div className={styles.portraitVideo}>
              <video controls playsInline preload="metadata" poster="/videos/jess-practice-3-final.jpg" aria-label="Practice with Jess: rear view">
                <source src="/videos/jess-practice-3-final.mp4" type="video/mp4" />
                Your browser does not support video playback. <a href="/videos/jess-practice-3-final.mp4">Open Jess’s rear-view practice video</a>
              </video>
            </div>
          </section>
          <section className={styles.tempo} id="tempo" aria-labelledby="tempo-heading">
            <div className={styles.tempoCopy}>
              <p className="eyebrow">SLOW IT DOWN. BUILD IT UP.</p>
              <h2 id="tempo-heading">Find your<br /><em>Thriller tempo.</em></h2>
              <p>Start slow while you learn the steps, then work your way up to the original speed. Scrub to any part of the song to practice it again.</p>
              <a className={styles.downloadTrack} href="/audio/thriller-michael-jackson-90-tempo.mp3" download>Download the song at 90% tempo <Download size={16} aria-hidden="true" /></a>
              <a href="/practice-audio">Open the tempo player on its own <ArrowUpRight size={15} aria-hidden="true" /></a>
            </div>
            <PracticePlayer />
          </section>
          <section className={styles.tutorials} id="videos" aria-labelledby="tutorials-heading">
            <p className="eyebrow">FOLLOW THE ORIGINAL</p>
            <h2 id="tutorials-heading">Thriller reference.</h2>
            <article className={styles.reference} id="technique-costume">
              <h3>Zombie Walk, Technique &amp; Costumes</h3>
              <iframe src="https://www.youtube.com/embed/4V90AmXnguw?feature=oembed&start=46" title="Reference for Zombie Walk, Technique and Costumes" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
              <a href="https://www.youtube.com/watch?v=4V90AmXnguw&t=46s" target="_blank" rel="noopener noreferrer">Watch on YouTube from 0:46 <ArrowUpRight size={15} aria-hidden="true" /></a>
            </article>
          </section>
        </PracticeMedia>
        <div className={styles.resourceLinks}><a href="/moves-cheatsheets">Moves Cheatsheets <ArrowUpRight size={16} aria-hidden="true" /></a><a href="/lesson-plan">Four-week lesson plan <ArrowUpRight size={16} aria-hidden="true" /></a></div>
      </div>
      <footer><span>SOUTH HAVEN THRILLER FLASH MOB</span><a href="https://nextdesign.dev" target="_blank" rel="noopener noreferrer">digital experience by Next Design</a></footer>
    </main>
  );
}
