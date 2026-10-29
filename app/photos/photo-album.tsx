"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Camera, Check, ImagePlus, Play, X } from "lucide-react";
import styles from "./photos.module.css";

type MediaItem = { id: string; type: "photo" | "video"; contentType: string; caption: string; contributor: string; createdAt: string; url: string };
type AlbumResponse = { items: MediaItem[]; error?: string };
const MAX_CHUNK = 4 * 1024 * 1024;

export default function PhotoAlbum() {
  const [items, setItems] = useState<MediaItem[]>([]), [loading, setLoading] = useState(true), [albumError, setAlbumError] = useState("");
  const [busy, setBusy] = useState(false), [progress, setProgress] = useState(""), [formError, setFormError] = useState(""), [success, setSuccess] = useState("");
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    setLoading(true); setAlbumError("");
    try { const response = await fetch("/api/event-media", { cache: "no-store" }); const data = await response.json() as AlbumResponse; if (!response.ok) throw new Error(data.error || "The album is temporarily unavailable."); setItems(data.items || []); }
    catch (error) { setAlbumError(error instanceof Error ? error.message : "The album is temporarily unavailable."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void refresh(); }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setFormError(""); setSuccess("");
    const form = event.currentTarget, data = new FormData(form), files = (data.getAll("media") as File[]).filter(file => file.size > 0);
    if (!files.length) { setFormError("Choose at least one photo or video."); return; }
    if (files.length > 3) { setFormError("Choose up to 3 files at a time. The 3-file limit applies to your email address."); return; }
    setBusy(true);
    let completed = 0;
    try {
      for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
        const file = files[fileIndex]; setProgress(`Preparing ${file.name} (${fileIndex + 1} of ${files.length})…`);
        const startResponse = await fetch("/api/event-media/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileName: file.name, contentType: file.type, size: file.size, email: String(data.get("email") || ""), contributor: String(data.get("contributor") || ""), caption: String(data.get("caption") || ""), creditContributor: data.get("credit") === "on", consent: data.get("consent") === "on" }) });
        const start = await startResponse.json() as { id?: string; chunkSize?: number; error?: string };
        if (!startResponse.ok || !start.id) throw new Error(start.error || `Could not start ${file.name}.`);
        try {
          const chunkSize = start.chunkSize || MAX_CHUNK, parts = Math.ceil(file.size / chunkSize);
          for (let part = 0; part < parts; part++) {
            setProgress(`Uploading ${file.name} · ${Math.round(((part + 1) / parts) * 100)}%`);
            const chunk = file.slice(part * chunkSize, Math.min(file.size, (part + 1) * chunkSize));
            const response = await fetch(`/api/event-media/upload?id=${encodeURIComponent(start.id)}&part=${part}`, { method: "POST", headers: { "Content-Type": "application/octet-stream", "x-part-number": String(part) }, body: chunk });
            const result = await response.json() as { error?: string };
            if (!response.ok) throw new Error(result.error || `Could not upload ${file.name}.`);
          }
          setProgress(`Finishing ${file.name}…`);
          const finish = await fetch(`/api/event-media/upload?id=${encodeURIComponent(start.id)}&complete=1`, { method: "POST" });
          const result = await finish.json() as { error?: string };
          if (!finish.ok) throw new Error(result.error || `Could not finish ${file.name}.`);
          completed++;
        } catch (error) {
          await fetch(`/api/event-media/upload?id=${encodeURIComponent(start.id)}&abort=1`, { method: "POST" }).catch(() => undefined);
          throw error;
        }
      }
      form.reset(); setSuccess(`${files.length} ${files.length === 1 ? "submission was" : "submissions were"} sent to the organizer for review. The limit is 3 files per email address.`); setProgress("");
    } catch (error) { const message = error instanceof Error ? error.message : "Your upload could not be confirmed. Please try again."; if (completed) setSuccess(`${completed} ${completed === 1 ? "file was" : "files were"} submitted. ${message}`); else setFormError(message); setProgress(""); }
    finally { setBusy(false); if (inputRef.current) inputRef.current.value = ""; }
  }

  return <>
    <section className={styles.uploadSection} id="share">
      <div className={styles.uploadHeading}><div className={styles.icon}><ImagePlus size={23}/></div><div><p className="eyebrow">SEND US YOUR FAVORITE MOMENT</p><h2>Share your photos &amp; videos</h2></div></div>
      <p className={styles.uploadCopy}>Photos up to 25 MB and videos up to 100 MB. Submissions stay private until the organizer selects them for the album.</p>
      <form onSubmit={submit} className={styles.form}>
        <label className={styles.filePicker}><input ref={inputRef} name="media" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" multiple required disabled={busy}/><Camera size={19}/><span>Choose photos or videos</span><small>JPEG, PNG, WebP, GIF, MP4, WebM, QuickTime</small></label>
        <div className={styles.fields}><div><label htmlFor="email">Email address <span>(used only for the 3-file limit)</span></label><input id="email" name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" disabled={busy}/><small className={styles.privacyNote}>We keep only a private one-way count key, not the email address.</small></div><div><label htmlFor="contributor">Your name <span>(optional)</span></label><input id="contributor" name="contributor" maxLength={80} placeholder="How should we credit you?" disabled={busy}/></div><div><label htmlFor="caption">Caption <span>(optional)</span></label><input id="caption" name="caption" maxLength={300} placeholder="Add a note about this moment" disabled={busy}/></div></div>
        <label className={styles.check}><input name="credit" type="checkbox" disabled={busy}/><span>Show my name as the contributor if this is selected for the album.</span></label>
        <label className={styles.check}><input name="consent" type="checkbox" required disabled={busy}/><span>I have permission to share these files, and anyone clearly identifiable in them has agreed to their possible public display.</span></label>
        {formError&&<p className={styles.error} role="alert">{formError}</p>}{success&&<p className={styles.success} role="status"><Check size={17}/>{success}</p>}{progress&&<p className={styles.progress} role="status" aria-live="polite">{progress}</p>}
        <button className={styles.submit} disabled={busy}>{busy?"Uploading…":"Send to the organizer"}<ArrowUpRight size={18}/></button>
      </form>
    </section>

    <section className={styles.albumSection} aria-labelledby="album-title"><div className={styles.albumHeading}><div><p className="eyebrow">THE COMMUNITY ALBUM</p><h2 id="album-title">Thriller, through your eyes.</h2></div><span>{items.length} {items.length === 1 ? "moment" : "moments"}</span></div>
      {loading?<p className={styles.empty}>Loading the album…</p>:albumError?<div className={styles.empty}><p>{albumError}</p><button className={styles.retry} onClick={() => void refresh()}>Try again</button></div>:items.length===0?<div className={styles.empty}><div className={styles.emptyIcon}><Camera size={25}/></div><h3>The album is waiting for its first memories.</h3><p>Share a photo or video above. Selected submissions will appear here.</p><a href="#share">Share a moment <ArrowUpRight size={16}/></a></div>:<div className={styles.grid}>{items.map(item=><button className={styles.tile} key={item.id} onClick={() => setSelected(item)} aria-label={`${item.type === "video" ? "Play video" : "View photo"}${item.caption ? `: ${item.caption}` : ""}`}>
        {item.type === "video"?<><video src={item.url} preload="metadata" muted playsInline/><span className={styles.play}><Play size={19} fill="currentColor"/></span></>:<img src={item.url} alt={item.caption || "South Haven Thriller Flash Mob memory"} loading="lazy"/>}
        {(item.caption||item.contributor)&&<span className={styles.tileCaption}>{item.caption&&<strong>{item.caption}</strong>}{item.contributor&&<small>Photo by {item.contributor}</small>}</span>}
      </button>)}</div>}
    </section>
    {selected&&<div className={styles.lightbox} role="dialog" aria-modal="true" aria-label="Album item" onClick={() => setSelected(null)}><button className={styles.close} aria-label="Close" onClick={() => setSelected(null)}><X/></button><div className={styles.lightboxContent} onClick={event => event.stopPropagation()}>{selected.type === "video"?<video src={selected.url} controls autoPlay playsInline/>:<img src={selected.url} alt={selected.caption || "South Haven Thriller Flash Mob memory"}/ >}{(selected.caption||selected.contributor)&&<p>{selected.caption}{selected.contributor&&<small>Photo by {selected.contributor}</small>}</p>}</div></div>}
  </>;
}
