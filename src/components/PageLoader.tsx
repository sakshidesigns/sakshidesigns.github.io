// src/components/PageLoader.tsx
// Full-screen sky-coloured splash shown until every character frame is
// downloaded and decoded, so the first mouse movement never hits a cold frame.
// The plane recreates the reference clip (trim.mp4) as a native line-art SVG
// icon instead of a recoloured video: same silhouette, wing, tail fin, motion
// trail and clouds, but resolution-independent and in the site's own blue.
function LoaderPlane() {
  return (
    <svg
      className="loader-plane-scene"
      width="140"
      height="108"
      viewBox="0 0 72 56"
      fill="none"
      aria-hidden="true"
    >
      <g className="loader-trail">
        <line x1="4" y1="20" x2="15" y2="20" />
        <line x1="2" y1="42" x2="13" y2="42" />
        <line x1="7" y1="50" x2="16" y2="50" />
      </g>

      {/* Position via the SVG transform attribute on an outer group, and
          animate via CSS transform on an inner one: a CSS `animation` that
          touches `transform` replaces the attribute entirely rather than
          composing with it, which previously stacked both clouds at (0,0). */}
      <g transform="translate(53 8)">
        <g className="loader-cloud loader-cloud-a">
          <path d="M1.5 7.5a3 3 0 0 1 .9-5.9A3.7 3.7 0 0 1 9.3 2 2.6 2.6 0 0 1 8.7 7z" />
        </g>
      </g>
      <g transform="translate(50 40)">
        <g className="loader-cloud loader-cloud-b">
          <path d="M2 9a3.6 3.6 0 0 1 1.1-7.1A4.4 4.4 0 0 1 11.5 2a3.1 3.1 0 0 1-.7 7z" />
        </g>
      </g>

      {/* One continuous outline - nose, fuselage top, tail-fin spike, tail,
          wing spike, fuselage bottom, back to nose - the way side-view plane
          glyphs are normally drawn, so nothing crosses or double-draws the
          way separate overlapping shapes did. */}
      <g className="loader-plane">
        <path d="M56 29 48 25 26 25 18 13 24 25 20 33 10 46 18 46 28 33 46 33Z" />
        <path d="M36 29h6" />
      </g>
    </svg>
  );
}

export function PageLoader({ progress, done }: { progress: number; done: boolean }) {
  const clamped = Math.min(1, Math.max(0, progress));
  return (
    <div className={`page-loader${done ? " is-done" : ""}`} role="status" aria-live="polite" aria-hidden={done}>
      <LoaderPlane />
      <p className="page-loader-caption">Preparing to take off</p>
      <div className="page-loader-track" aria-hidden="true">
        <div className="page-loader-bar" style={{ transform: `scaleX(${clamped})` }} />
      </div>
    </div>
  );
}
