// src/components/SkyClouds.tsx
// Procedural cotton-candy clouds. Each layer is a filtered rect (fractal noise
// -> soft alpha -> pastel tint -> blur) tiled three times so a horizontal
// drift of exactly one tile width loops seamlessly. Only `transform` animates,
// so the filtered art is rasterised once and composited on its own layer.
// `compact` renders a single lighter layer for use inside cards. Every instance
// gets its own filter ids so several can share a page without colliding.
import { useId } from "react";

const TILE_WIDTH = 1600;
const TILE_HEIGHT = 640;

type CloudLayer = {
  id: string;
  seed: number;
  frequency: string;
  tint: [number, number, number]; // 0-1 RGB; faint pink / lilac / white
  opacity: number;
  duration: number; // seconds for one full tile of drift
  top: string;
};

const LAYERS: CloudLayer[] = [
  { id: "cloud-a", seed: 3, frequency: "0.0032 0.0075", tint: [1.0, 0.88, 0.95], opacity: 0.5, duration: 190, top: "0%" },
  { id: "cloud-b", seed: 11, frequency: "0.0042 0.0095", tint: [0.9, 0.91, 1.0], opacity: 0.4, duration: 150, top: "9%" },
  { id: "cloud-c", seed: 27, frequency: "0.006 0.012", tint: [1.0, 0.94, 0.98], opacity: 0.32, duration: 120, top: "18%" },
];

export function SkyClouds({ compact = false }: { compact?: boolean }) {
  const uid = useId().replace(/:/g, "");
  const layers = compact ? LAYERS.slice(0, 1) : LAYERS;
  const tiles = compact ? [0, 1] : [0, 1, 2];
  const filterId = (layer: CloudLayer) => `${uid}-${layer.id}`;
  return (
    <div className={compact ? "sky-clouds sky-clouds-compact" : "sky-clouds"} aria-hidden="true">
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          {layers.map((layer) => (
            <filter
              key={layer.id}
              id={filterId(layer)}
              filterUnits="userSpaceOnUse"
              x={0}
              y={0}
              width={TILE_WIDTH}
              height={TILE_HEIGHT}
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency={layer.frequency}
                numOctaves={5}
                seed={layer.seed}
                stitchTiles="stitch"
                result="noise"
              />
              <feColorMatrix
                in="noise"
                type="matrix"
                values={`0 0 0 0 ${layer.tint[0]}  0 0 0 0 ${layer.tint[1]}  0 0 0 0 ${layer.tint[2]}  8 0 0 0 -4.6`}
              />
              <feGaussianBlur stdDeviation="6" />
            </filter>
          ))}
        </defs>
      </svg>
      {layers.map((layer) => (
        <div
          key={layer.id}
          className="sky-cloud-layer"
          style={{ top: layer.top, opacity: layer.opacity, animationDuration: `${layer.duration}s` }}
        >
          {tiles.map((copy) => (
            <svg key={copy} width={TILE_WIDTH} height={TILE_HEIGHT} viewBox={`0 0 ${TILE_WIDTH} ${TILE_HEIGHT}`}>
              <rect width={TILE_WIDTH} height={TILE_HEIGHT} fill="#ffffff" filter={`url(#${filterId(layer)})`} />
            </svg>
          ))}
        </div>
      ))}
    </div>
  );
}
