type TickCallback = (timestamp: number) => void;

const subscribers = new Set<TickCallback>();
let rafId: number | null = null;

function loop(timestamp: number) {
  subscribers.forEach((callback) => callback(timestamp));
  if (subscribers.size > 0) {
    rafId = requestAnimationFrame(loop);
  } else {
    rafId = null;
  }
}

/**
 * Subscribes to a single shared requestAnimationFrame loop (rather than
 * each caller starting its own rAF timer) so CharacterCanvas and
 * MagneticCursor stay in lockstep on one 60fps tick. Returns an
 * unsubscribe function; the underlying rAF loop stops once the last
 * subscriber unsubscribes and restarts on the next new subscription.
 */
export function subscribeTick(callback: TickCallback): () => void {
  subscribers.add(callback);
  if (rafId === null) {
    rafId = requestAnimationFrame(loop);
  }
  return () => {
    subscribers.delete(callback);
    if (subscribers.size === 0 && rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };
}
