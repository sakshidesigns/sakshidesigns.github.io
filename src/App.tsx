// src/App.tsx
import { MotionConfig } from "framer-motion";
import { Hero } from "./components/Hero";
import { MagneticCursor } from "./components/MagneticCursor";
import { SiteSky } from "./components/SiteSky";
import { useInteractionTracking } from "./hooks/useInteractionTracking";
import CaseStudy from "./sections/caseStudy/CaseStudy";
import Experience from "./sections/components/Experience";
import Footer from "./sections/components/Footer";
import Intro from "./sections/components/Intro";
import ScrollProgress from "./sections/components/ScrollProgress";
import Work from "./sections/components/Work";
import Writing from "./sections/components/Writing";

// No router library for just a handful of case-study pages: a plain path
// check is enough, and a normal <a href="/work/..."> still works correctly
// on first load as long as the host rewrites unknown paths to index.html
// (the default for Vite's own SPA output on Vercel/Netlify).
function getCaseStudySlug(): string | null {
  if (typeof window === "undefined") return null;
  const match = window.location.pathname.match(/^\/work\/([a-z0-9-]+)\/?$/);
  return match ? match[1] : null;
}

export function App() {
  // Mounted once here (not in Hero) so the custom cursor - and the
  // `body { cursor: none }` rule it exists to replace - works on every
  // page this app renders, case studies included, not just the landing
  // page's hero section.
  useInteractionTracking();
  const caseStudySlug = getCaseStudySlug();
  if (caseStudySlug) {
    return (
      <MotionConfig reducedMotion="user">
        <CaseStudy slug={caseStudySlug} />
        <MagneticCursor />
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <ScrollProgress />
      <main>
        <Hero />
        <div className="site-sections">
          <SiteSky />
          <Intro />
          <Work />
          <Writing />
          <Experience />
          <Footer />
        </div>
      </main>
      <MagneticCursor />
    </MotionConfig>
  );
}
