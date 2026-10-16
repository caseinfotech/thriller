"use client";

import { useRef, useState } from "react";
import styles from "./practice.module.css";

const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

export default function PracticePlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [tempo, setTempo] = useState(100);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(357.84);
  const [error, setError] = useState("");

  function applyTempo(value: number) {
    setTempo(value);
    const audio = audioRef.current;
    if (!audio) return;
    if (value === 0) audio.pause();
    else {
      // Browsers do not consistently support playbackRate=0. Pause at zero.
      audio.defaultPlaybackRate = value / 100;
      audio.playbackRate = value / 100;
      audio.preservesPitch = true;
    }
  }

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) { audio.pause(); return; }
    if (tempo === 0) return;
    audio.playbackRate = tempo / 100;
    audio.preservesPitch = true;
    try { await audio.play(); setError(""); }
    catch { setError("Playback could not start. Please tap Play to try again."); }
  }

  return (
    <section className={styles.player} aria-label="Thriller audio player">
      <p className={styles.trackLabel}>PRACTICE TRACK</p>
      <h2>Thriller</h2>
      <p className={styles.artist}>Michael Jackson</p>
      <audio ref={audioRef} preload="metadata"
        onDurationChange={() => { const value = audioRef.current?.duration; if (value && Number.isFinite(value)) setDuration(value); }}
        onLoadedMetadata={() => { const audio = audioRef.current; if (audio) { if (Number.isFinite(audio.duration)) setDuration(audio.duration); audio.preservesPitch = true; } }}
        onTimeUpdate={() => setTime(audioRef.current?.currentTime ?? 0)}
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
        onError={() => setError("The audio could not load. Please refresh the page and try again.")}
      ><source src="/audio/thriller-michael-jackson.mp3" type="audio/mpeg" /></audio>

      <label className={styles.srOnly} htmlFor="track-position">Track position</label>
      <input className={styles.range} id="track-position" type="range" min="0" max={duration || 0} step="0.1" value={time}
        disabled={!duration} aria-valuetext={`${formatTime(time)} of ${formatTime(duration)}`}
        onChange={event => { const value = Number(event.target.value); if (audioRef.current) audioRef.current.currentTime = value; setTime(value); }} />
      <div className={styles.timestamps}><span>{formatTime(time)}</span><span>{formatTime(duration)}</span></div>
      <div className={styles.actions}>
        <button className={styles.play} onClick={togglePlayback} disabled={tempo === 0}>{playing ? "Pause" : "Play"}</button>
        <button className={styles.secondary} onClick={() => { if (audioRef.current) audioRef.current.currentTime = 0; setTime(0); }}>Restart</button>
      </div>

      <div className={styles.tempoHeading}><label htmlFor="practice-tempo">Tempo</label><output htmlFor="practice-tempo">{tempo}%</output></div>
      <input className={styles.range} id="practice-tempo" type="range" min="0" max="100" step="1" value={tempo}
        aria-describedby="tempo-help" aria-valuetext={tempo === 0 ? "0 percent, paused" : `${tempo} percent of original speed`}
        onChange={event => applyTempo(Number(event.target.value))} />
      <div className={styles.timestamps}><span>0% · Paused</span><span>100% · Original speed</span></div>
      <p className={styles.help} id="tempo-help">{tempo === 0 ? "Paused at 0%. Raise the tempo, then press Play to continue." : "Adjust the speed while you practice. The song keeps its original pitch."}</p>
      <button className={styles.reset} onClick={() => applyTempo(100)}>Reset to original speed</button>
      {error && <p className={styles.error} role="alert">{error}</p>}
    </section>
  );
}
