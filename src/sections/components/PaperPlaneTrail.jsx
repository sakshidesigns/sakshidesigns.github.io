import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'

// A paper plane that flies right to left through "What I do" and into
// "Selected Work", leaving a small dashed trail. It is the last child of the
// wrapper around those two sections, so it paints over their backgrounds but
// under any content given `relative z-[1]` (the Intro text, the Work heading):
// it flies behind the section content. The layer starts where the hero ends and
// is clipped to itself, so a plane that starts above the layer's top edge slides
// out from underneath the hero, i.e. from behind the character. Two legs, each
// blurred where it goes behind something and sharp in between:
//   A: out from under the hero, one long right-to-left sweep across the top of
//      "What I do", sharpening on the way, ending behind its "WHAT I DO" heading
//      (blurred, gone);
//   B: out from behind the last word of the "What I do" sentence ("naturally")
//      heading right, a U-turn beyond the end of the line, then the same long
//      right-to-left sweep as leg A down to the "Selected Work" heading and
//      behind it (blurred, gone for good).
// Both legs are driven by a spring-smoothed copy of the scroll progress, so
// wheel ticks never make the plane jump.

const W_PLANE = 1.05 // plane scale
// Global scroll-progress windows for the two legs (the gap hides the plane).
const A = [0.02, 0.5]
const B = [0.55, 0.98]

// Anchors are measured from the real layout (relative to the layer):
// eyebrow = centre of the "WHAT I DO" label, word = just under the last word of
// the sentence ("naturally"), head = centre of the "Selected Work" heading.
function buildPaths(w, { eyebrow, word, head }) {
  // Leg A, as drawn commands over absolute points: out of the hero's right edge,
  // a long level sweep leftwards with soft waves, easing down to the heading.
  const a0 = { x: w * 0.86, y: -40 }
  const legA = [
    ['C', [w * 0.82, 30], [w * 0.72, 60], [w * 0.6, 78]],
    ['S', [w * 0.4, 96], [w * 0.3, 132]],
    ['S', [eyebrow.x + w * 0.06, eyebrow.y - 6], [eyebrow.x, eyebrow.y]],
  ]
  const aEnd = { x: eyebrow.x, y: eyebrow.y }
  // Leg B: from behind "naturally" out to the right, a U-turn below the end of
  // the line, then leg A's own shape (stretched) as the long right-to-left
  // sweep to the Selected Work heading.
  const u = { x: word.x + w * 0.05, y: word.y + w * 0.085 } // where the U-turn hands over to the sweep
  const bEnd = { x: head.x, y: head.y }
  const sx = (bEnd.x - u.x) / (aEnd.x - a0.x)
  const sy = (bEnd.y - u.y) / (aEnd.y - a0.y)
  const map = ([x, y]) => [u.x + (x - a0.x) * sx, u.y + (y - a0.y) * sy]
  const draw = (start, cmds, t = (pt) => pt) =>
    [`M ${t([start.x, start.y]).join(' ')}`, ...cmds.map(([c, ...pts]) => `${c} ${pts.map((pt) => t(pt).join(' ')).join(' ')}`)].join(' ')
  // The U-turn's own curve and the re-mapped sweep are two independently
  // shaped Beziers stitched together at u - stitching them with no regard
  // for each one's own direction at that point left a visible kink there
  // (the path arriving at one angle and immediately leaving at another).
  // legA's first control point, carried through the same map() as the
  // sweep itself, gives the exact direction the sweep departs u in; the
  // U-turn's own final control point is placed back along that same line
  // so the curve arrives already travelling that way, and the seam
  // disappears instead of just being hidden.
  const [sweepDx, sweepDy] = map(legA[0][1]).map((v, i) => v - [u.x, u.y][i])
  // Matching the sweep's exact direction at u only guarantees the two
  // pieces don't point different ways there - it says nothing about how
  // tightly the U-turn has to curve to arrive at that angle. A short pull
  // (0.6x) forces a late, tight correction right at the join, which reads
  // as a kink even though the slopes technically agree; a longer one eases
  // into the same direction gradually instead, over the visible part of
  // the curve rather than snapping to it at the very last moment.
  const pull = Math.hypot(sweepDx, sweepDy) * 1.6
  const [sweepUx, sweepUy] = [sweepDx, sweepDy].map((v) => v / (Math.hypot(sweepDx, sweepDy) || 1))
  const uTurn = [
    `M ${word.x} ${word.y}`,
    `C ${word.x + w * 0.07} ${word.y - 6} ${word.x + w * 0.17} ${word.y + 8} ${word.x + w * 0.17} ${word.y + w * 0.035}`,
    `S ${u.x - sweepUx * pull} ${u.y - sweepUy * pull} ${u.x} ${u.y}`,
  ].join(' ')
  // legA's own last leg arrives at its end point travelling almost level
  // (that's the shape of legA itself - a long, nearly-flat sweep). bEnd
  // for leg B sits almost straight *down* from where that same shape now
  // ends, not off to the side the way aEnd did for leg A - so the curve
  // has to turn roughly 70-90 degrees to get there. A single Bezier segment
  // can't ease through a turn that large without visibly elbowing partway
  // through (confirmed by sampling points along the rendered curve: it ran
  // nearly flat, then the direction flipped to nearly vertical within
  // about 1% of the path's length - a real corner, not just a tight-but-
  // smooth arc). Splitting the same turn across two shorter curves through
  // a midpoint, each handling roughly half the change of direction, reads
  // as one continuous bend instead.
  const [seg2EndX, seg2EndY] = map(legA[1][2])
  const [seg2Cp2X, seg2Cp2Y] = map(legA[1][1])
  const inLen = Math.hypot(seg2EndX - seg2Cp2X, seg2EndY - seg2Cp2Y) || 1
  const [inUx, inUy] = [(seg2EndX - seg2Cp2X) / inLen, (seg2EndY - seg2Cp2Y) / inLen]
  const mid = {
    x: seg2EndX + (bEnd.x - seg2EndX) * 0.55,
    y: seg2EndY + (bEnd.y - seg2EndY) * 0.4,
  }
  const toMidLen = Math.hypot(mid.x - seg2EndX, mid.y - seg2EndY) || 1
  const toEndLen = Math.hypot(bEnd.x - mid.x, bEnd.y - mid.y) || 1
  const [outUx, outUy] = [(bEnd.x - mid.x) / toEndLen, (bEnd.y - mid.y) / toEndLen]
  // The midpoint's own tangent blends the direction arriving with the
  // direction still needing to leave, so neither half has to carry the
  // whole turn on its own.
  const midTanLen = Math.hypot(inUx + outUx, inUy + outUy) || 1
  const [midUx, midUy] = [(inUx + outUx) / midTanLen, (inUy + outUy) / midTanLen]
  const segAcp1 = [seg2EndX + inUx * toMidLen * 0.4, seg2EndY + inUy * toMidLen * 0.4]
  const segAcp2 = [mid.x - midUx * toMidLen * 0.4, mid.y - midUy * toMidLen * 0.4]
  const segBcp1 = [mid.x + midUx * toEndLen * 0.4, mid.y + midUy * toEndLen * 0.4]
  const segBcp2 = [bEnd.x - outUx * toEndLen * 0.3, bEnd.y - outUy * toEndLen * 0.3]
  const sweep = [
    draw(a0, [legA[0], legA[1]], map).replace(/^M [^C]*/, ''),
    `C ${segAcp1[0]} ${segAcp1[1]} ${segAcp2[0]} ${segAcp2[1]} ${mid.x} ${mid.y}`,
    `C ${segBcp1[0]} ${segBcp1[1]} ${segBcp2[0]} ${segBcp2[1]} ${bEnd.x} ${bEnd.y}`,
  ].join(' ')
  return { a: draw(a0, legA), b: `${uTurn} ${sweep}` }
}

// 0 -> 1 across [from, to], clamped.
const ramp = (p, from, to) => Math.min(Math.max((p - from) / (to - from), 0), 1)

export default function PaperPlaneTrail() {
  const reduce = useReducedMotion()
  const layerRef = useRef(null)
  const trailARef = useRef(null)
  const trailBRef = useRef(null)
  const planeRef = useRef(null)
  const blurRef = useRef(null)
  const uid = useId().replace(/:/g, '')
  const [box, setBox] = useState({ w: 0, h: 0, anchors: null })

  // The layer spans from the top of the wrapper to the bottom of the Work heading.
  useLayoutEffect(() => {
    function measure() {
      const layer = layerRef.current
      const wrapper = layer?.parentElement
      const intro = wrapper?.querySelector('#about')
      const work = wrapper?.querySelector('#work')
      const heading = work?.firstElementChild
      if (!layer || !intro || !work || !heading) return
      const origin = layer.getBoundingClientRect()
      const centre = (el, fx = 0.5, fy = 0.5) => {
        const r = el.getBoundingClientRect()
        return { x: r.left - origin.left + r.width * fx, y: r.top - origin.top + r.height * fy }
      }
      const eyebrow = intro.querySelector('.uppercase')
      const sentence = intro.querySelector('p')
      const title = work.querySelector('h2')
      if (!eyebrow || !sentence || !title) return
      // The sentence's last rendered child is the word "naturally." itself
      // (each word in Intro.jsx is its own span) - its right edge is the
      // actual full stop, not a guessed fraction across the whole
      // paragraph's box. A percentage-of-width guess used to land inside
      // the word itself whenever the line wrapped differently than
      // expected, so the plane's path visibly crossed through the letters
      // instead of starting cleanly after them.
      const lastWord = sentence.lastElementChild
      const word = lastWord
        ? (() => {
            const r = lastWord.getBoundingClientRect()
            return { x: r.right - origin.left, y: r.top - origin.top + r.height * 0.5 }
          })()
        : centre(sentence, 0.64, 0.9)
      setBox({
        w: wrapper.clientWidth,
        h: work.offsetTop + heading.offsetHeight + 40,
        anchors: {
          eyebrow: centre(eyebrow, 0.5, 0.5),
          word,
          head: centre(title, 0.2, 0.5),
        },
      })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const { scrollYProgress: rawProgress } = useScroll({
    target: layerRef,
    offset: ['start end', 'end 0.6'],
  })
  const scrollYProgress = useSpring(rawProgress, { stiffness: 110, damping: 28, mass: 0.6 })

  const pathA = useTransform(scrollYProgress, A, [0, 1], { clamp: true })
  const pathB = useTransform(scrollYProgress, B, [0, 1], { clamp: true })
  // The dashed trail of each leg fades with its plane so nothing is left
  // behind once the plane has gone behind the section.
  const trailA = useTransform(scrollYProgress, [A[0], 0.1, 0.36, A[1]], [0, 1, 1, 0])
  const trailB = useTransform(scrollYProgress, [B[0], 0.58, 0.88, B[1]], [0, 1, 1, 0])

  const place = useCallback((p) => {
    const plane = planeRef.current
    const blur = blurRef.current
    const inA = p < (A[1] + B[0]) / 2
    const trail = inA ? trailARef.current : trailBRef.current
    if (!plane || !trail || !trail.getTotalLength) return
    const [from, to] = inA ? A : B
    const local = ramp(p, from, to)
    const len = trail.getTotalLength()
    const at = local * len
    const pt = trail.getPointAtLength(at)
    // A wide sampling window keeps the heading from twitching along the curve.
    const ahead = trail.getPointAtLength(Math.min(at + 14, len))
    const behind = trail.getPointAtLength(Math.max(at - 14, 0))
    // Drawn nose-left, flying right to left: heading = path tangent turned half a revolution.
    const angle = (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI - 180
    // Flying rightwards (the U-turn) would turn the plane over; mirror it so it stays upright.
    const rightwards = Math.cos(((angle + 180) * Math.PI) / 180) > 0
    plane.setAttribute('transform', `translate(${pt.x} ${pt.y}) rotate(${angle}) scale(1 ${rightwards ? -1 : 1})`)

    // Blurred and see-through where the plane is tucked behind something (the
    // start of leg A, the end of both legs, the start of leg B); sharp between.
    const span = to - from
    const smooth = (t) => t * t * (3 - 2 * t)
    const into = smooth(ramp(p, from, from + span * (inA ? 0.3 : 0.14)))
    const out = smooth(ramp(p, from + span * (inA ? 0.7 : 0.88), to))
    const opacity = Math.min(into * 1.6, 1) * (1 - out)
    const blurPx = 9 * (1 - into) + 9 * out
    plane.setAttribute('opacity', String(opacity))
    blur?.setAttribute('stdDeviation', String(blurPx))
  }, [])

  useMotionValueEvent(scrollYProgress, 'change', place)
  useEffect(() => {
    if (box.h) place(scrollYProgress.get())
  }, [box, place, scrollYProgress])

  if (reduce) return null

  if (!box.anchors) return <div ref={layerRef} aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0" style={{ height: box.h }} />
  const paths = buildPaths(box.w, box.anchors)
  const trailProps = {
    stroke: '#2f7ff2',
    strokeOpacity: 0.65,
    strokeWidth: 1.4,
    strokeLinecap: 'round',
    strokeDasharray: '1.2 7',
    fill: 'none',
  }
  return (
    <div
      ref={layerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 overflow-hidden"
      style={{ height: box.h }}
    >
      {box.h > 0 && (
        <svg width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`} fill="none">
          <defs>
            {/* Each leg's dashed trail is revealed only as far as the plane has flown. */}
            {[
              ['a', paths.a, pathA],
              ['b', paths.b, pathB],
            ].map(([key, d, progress]) => (
              <mask key={key} id={`${uid}-${key}`} maskUnits="userSpaceOnUse" x={-120} y={-80} width={box.w + 240} height={box.h + 160}>
                <motion.path d={d} stroke="#fff" strokeWidth={8} strokeLinecap="round" style={{ pathLength: progress }} />
              </mask>
            ))}
            <filter id={`${uid}-blur`} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur ref={blurRef} stdDeviation="9" />
            </filter>
          </defs>
          <motion.g style={{ opacity: trailA }}>
            <path ref={trailARef} d={paths.a} mask={`url(#${uid}-a)`} {...trailProps} />
          </motion.g>
          <motion.g style={{ opacity: trailB }}>
            <path ref={trailBRef} d={paths.b} mask={`url(#${uid}-b)`} {...trailProps} />
          </motion.g>
          <g ref={planeRef} opacity="0" filter={`url(#${uid}-blur)`} transform={`translate(${box.w * 0.82} -40)`}>
            <g transform={`scale(${W_PLANE})`} strokeLinejoin="round" strokeLinecap="round">
              <path d="M-22 0 16 -13 5 -1Z" fill="#ffffff" stroke="#174aad" strokeWidth={1.4} />
              <path d="M-22 0 5 -1 7 3 16 12Z" fill="#cfe3ff" stroke="#174aad" strokeWidth={1.4} />
              <path d="M-22 0 5 -1" stroke="#174aad" strokeWidth={1.4} />
            </g>
          </g>
        </svg>
      )}
    </div>
  )
}
