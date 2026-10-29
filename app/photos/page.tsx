import type { Metadata } from "next";
import { Moon } from "lucide-react";
import PhotoAlbum from "./photo-album";
import styles from "./photos.module.css";

export const metadata: Metadata = { title: "Event Photos & Videos | South Haven Thriller", description: "Share your South Haven Thriller Flash Mob photos and videos, and browse the event album." };

export default function PhotosPage() {
  return <main className={styles.page}>
    <header className={styles.header}><a className={styles.brand} href="/"><Moon size={22}/><span>SOUTH HAVEN <b>AFTER DARK</b></span></a><a href="/">Back to the event</a></header>
    <section className={styles.intro}><p className="eyebrow">THE NIGHT, THROUGH YOUR LENS</p><h1>Our Thriller<br/><em>after dark.</em></h1><p>Share a favorite photo or video from the flash mob. The organizer will choose which submissions become part of the public album.</p></section>
    <PhotoAlbum/>
    <footer className={styles.footer}>SOUTH HAVEN THRILLER FLASH MOB · THANK YOU FOR BEING PART OF IT</footer>
  </main>;
}
