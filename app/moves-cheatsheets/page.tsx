import type { Metadata } from "next";
import { Moon, FileText } from "lucide-react";
import { choreography } from "./choreography";
export const metadata: Metadata = { title: "Move Instructions | South Haven Thriller Flash Mob", description: "Jess Lotak’s original two-page Thriller move instructions, presented in their supplied format, with an optional text version by block." };
export default function MovesCheatsheets() {
  return <main className="lesson-plan moves-cheatsheets">
    <header className="organizer-header"><a className="brand" href="/"><Moon size={23} /><span>SOUTH HAVEN <b>THRILLER FLASH MOB</b></span></a><a href="/practice">Back to practice</a></header>
    <section className="choreography" id="choreography" aria-labelledby="choreography-title">
      <p className="eyebrow">YOUR AT-HOME PRACTICE COMPANION</p>
      <h1 id="choreography-title">Move Instructions</h1>
      <p className="choreography-intro">Jess Lotak’s original two-page instructions, in the format provided. Open the PDF to zoom, download, or print.</p>
      <a className="instructions-pdf-link" href="/moves-cheatsheets/thriller-move-instructions.pdf" target="_blank" rel="noopener noreferrer"><FileText size={19} aria-hidden="true" /> Open the full move instructions (PDF)</a>
      <div className="original-instructions" aria-label="Original move instructions">
        {[1, 2].map(page => <figure className="original-instructions-page" key={page}>
          <a href={`/moves-cheatsheets/thriller-move-instructions.pdf#page=${page}`} target="_blank" rel="noopener noreferrer" aria-label={`Open original instructions page ${page} in the PDF`}>
            <img src={`/moves-cheatsheets/instructions-page-${page}.png`} width={1131} height={1600} alt={`Jess Lotak’s original Thriller Flash Mob move instructions, page ${page} of 2. A text version is available below.`} loading={page === 1 ? "eager" : "lazy"} />
          </a>
          <figcaption>Page {page} of 2 · Select the page to open the PDF</figcaption>
        </figure>)}
      </div>
      <details className="instructions-text-version">
        <summary>Text version by block</summary>
        <nav className="block-nav" aria-label="Choreography blocks">{choreography.map(block => <a href={`#${block.id}`} key={block.id}>{block.title}</a>)}</nav>
      <div className="handwritten-cards instruction-blocks">{choreography.map(block => <article className="handwritten-card" id={block.id} key={block.id}>
        <h2>{block.title}</h2><div className="typed-notes"><p className="block-setup">{block.setup}</p>
          {block.sections.map(section => <section className="move-subsection" key={section.title}><h3>{section.title}</h3><dl>{section.steps.map(([counts, cue], i) => <div className="choreography-step" key={i}><dt>{counts}</dt><dd>{cue}</dd></div>)}</dl></section>)}
          {block.note && <p className="block-note">{block.note}</p>}
        </div>
      </article>)}</div>
      </details>
      <div className="lesson-links"><a className="lesson-video-link" href="/practice">Practice videos &amp; Thriller tempo</a><a className="lesson-video-link" href="/lesson-plan">View the four-week lesson plan</a></div>
    </section><footer><span>SOUTH HAVEN THRILLER FLASH MOB</span><a href="https://nextdesign.dev" target="_blank" rel="noopener noreferrer">digital experience by Next Design</a></footer>
  </main>;
}
