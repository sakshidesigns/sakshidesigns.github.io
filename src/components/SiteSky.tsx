// src/components/SiteSky.tsx
// The drifting hero clouds, fixed behind the lifted sections. Clipped to the
// sections wrapper (see .site-sections) so they never paint over the hero.
import { SkyClouds } from "./SkyClouds";

export function SiteSky() {
  return (
    <div className="site-sky" aria-hidden="true">
      <SkyClouds />
    </div>
  );
}
