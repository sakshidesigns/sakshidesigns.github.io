// Single source of truth lives in ./angle, which also derives the frame
// indices used to read the rotation frames -- re-exported here for
// convenience so array length and index can never drift apart.
import { FRAME_COUNT } from "./angle";
import { FRAME_PIXELS_PER_UNIT, bitmapPixelSize, type SourceRect } from "./coverTransform";
export { FRAME_COUNT };

export const CENTER_FRAME_PATH = "/frames/center.webp";

/** Path for rotation frame `index`, wrapping into the valid 0-63 range. */
export function framePath(index: number): string {
  const wrapped = ((index % FRAME_COUNT) + FRAME_COUNT) % FRAME_COUNT;
  return `/frames/frame_${String(wrapped).padStart(2, "0")}.webp`;
}

/** The downloaded, still-encoded frame files. Kept so frames can be re-decoded after a resize. */
export interface FrameBlobs {
  rotation: Blob[];
  center: Blob;
}

/** Decoded, screen-sized frames ready to blit with no decode or rescale at draw time. */
export interface PreparedFrames {
  rotation: ImageBitmap[];
  center: ImageBitmap;
  /** The part of the source frame these bitmaps cover, in 1280x720 source units. */
  rect: SourceRect;
}

async function fetchBlob(path: string): Promise<Blob> {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`failed to load ${path} (${response.status})`);
  return response.blob();
}

/**
 * Downloads the center frame and all 64 rotation frames as blobs.
 *
 * Individual rotation-frame failures (a dropped request on a flaky
 * connection) are tolerated: the gap is filled with the nearest
 * successfully-loaded neighbour, so tracking degrades to slightly chunkier
 * angular steps in that region instead of blanking the hero entirely. The
 * center frame has no reasonable substitute, so a failure there rejects --
 * CharacterCanvas logs it and leaves the sky empty.
 *
 * `onProgress(loaded, total)` fires once as each file completes so a loader
 * can show real progress.
 */
export async function loadFrameBlobs(onProgress?: (loaded: number, total: number) => void): Promise<FrameBlobs> {
  const total = FRAME_COUNT + 1;
  let loaded = 0;
  const tick = () => onProgress?.(++loaded, total);

  const centerPromise = fetchBlob(CENTER_FRAME_PATH).then(
    (blob) => {
      tick();
      return blob;
    },
    (error: Error) => {
      throw new Error(`center frame: ${error.message}`);
    }
  );
  const rotationResults = await Promise.all(
    Array.from({ length: FRAME_COUNT }, (_, i) =>
      fetchBlob(framePath(i)).then(
        (blob) => {
          tick();
          return blob;
        },
        () => {
          tick();
          return null;
        }
      )
    )
  );
  const center = await centerPromise;

  const rotation = rotationResults.map((blob, index) => {
    if (blob) return blob;
    for (let offset = 1; offset < FRAME_COUNT; offset++) {
      const before = rotationResults[(index - offset + FRAME_COUNT) % FRAME_COUNT];
      if (before) return before;
      const after = rotationResults[(index + offset) % FRAME_COUNT];
      if (after) return after;
    }
    return center;
  });
  return { rotation, center };
}

/**
 * Decodes every frame off the main thread, cropped to the part of the frame
 * that is actually visible and resized to its on-screen pixel size, so each
 * later draw is a 1:1 blit. This removes the stall the browser otherwise
 * takes to decode a large frame the first time it is drawn.
 */
export async function prepareFrames(blobs: FrameBlobs, rect: SourceRect, scale: number, devicePixelRatio: number): Promise<PreparedFrames> {
  const { width, height } = bitmapPixelSize(rect, scale, devicePixelRatio);
  const crop = {
    sx: Math.round(rect.sx * FRAME_PIXELS_PER_UNIT),
    sy: Math.round(rect.sy * FRAME_PIXELS_PER_UNIT),
    sw: Math.max(1, Math.round(rect.sw * FRAME_PIXELS_PER_UNIT)),
    sh: Math.max(1, Math.round(rect.sh * FRAME_PIXELS_PER_UNIT)),
  };
  const decode = (blob: Blob) =>
    createImageBitmap(blob, crop.sx, crop.sy, crop.sw, crop.sh, {
      resizeWidth: width,
      resizeHeight: height,
      resizeQuality: "high",
    });
  const [center, ...rotation] = await Promise.all([blobs.center, ...blobs.rotation].map(decode));
  return { center, rotation, rect };
}

/** Frees the GPU/CPU memory held by a prepared set (e.g. after a resize replaces it). */
export function disposeFrames(frames: PreparedFrames): void {
  frames.center.close();
  frames.rotation.forEach((bitmap) => bitmap.close());
}
