// src/components/Hero.tsx
import { useState } from "react";
import { CharacterCanvas } from "./CharacterCanvas";
import { HeroContent } from "./HeroContent";
import { Nav } from "./Nav";
import { PageLoader } from "./PageLoader";
import { SkyClouds } from "./SkyClouds";
import { SummaryCards } from "./SummaryCards";

// Interaction tracking and the custom cursor itself are mounted once in
// App.tsx, not here - both the landing page and the case-study pages need
// the cursor, and CharacterCanvas is the only piece of this section that
// actually requires pointer tracking to exist first.
export function Hero() {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  return (
    <section id="top" className="hero" aria-label="Introduction">
      <SkyClouds />
      <CharacterCanvas onProgress={setProgress} onReady={() => setReady(true)} />
      <div className="hero-mist" aria-hidden="true" />
      <Nav />
      <SummaryCards />
      <HeroContent />
      <PageLoader progress={progress} done={ready} />
    </section>
  );
}
