"use client";

import type { ReactNode } from "react";

export default function PracticeMedia({ children }: { children: ReactNode }) {
  return <div onPlayCapture={event => {
    const playing = event.target;
    if (!(playing instanceof HTMLMediaElement)) return;
    event.currentTarget.querySelectorAll<HTMLMediaElement>("audio, video").forEach(media => {
      if (media !== playing) media.pause();
    });
  }}>{children}</div>;
}
