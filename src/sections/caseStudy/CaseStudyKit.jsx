// src/sections/caseStudy/CaseStudyKit.jsx
// Shared building blocks for a case-study page: a numbered full-screen
// "slide" that covers the previous one by sliding in from the right (the
// reference tour's core move - see CaseStudySlide below), plus the
// recurring content pieces (eyebrow label, serif headline, body copy, a
// media slot, a progress rail, a back link) rebuilt in the site's own type
// and colour system rather than the reference's black/cream palette.
import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { SkyClouds } from '../../components/SkyClouds'

const TONE_STYLES = {
  light: 'bg-white text-ink',
  tint: 'bg-[#eef6ff] text-ink',
  dark: 'bg-white text-ink', // was navy; the case studies now stay light like the home page
  // card-sky-gradient is the exact hero gradient (same --sky-* tokens), also
  // already used behind the Work cards - reused here rather than inventing
  // a new blue. Background only; the drifting clouds are a separate layer
  // (see CaseStudySlide) since they need their own element to animate.
  sky: 'card-sky-gradient text-white',
}
// Tones with a dark or vivid background, where the numeral/eyebrow need the
// white-based opacity classes instead of the ink-based ones.
const LIGHT_TEXT_TONES = new Set(['sky'])

// A gentler, more "decelerate into place" curve than the previous
// [0.65,0,0.35,1] (which eases in AND out, reading as a mechanical slide
// with a soft start that never quite felt smooth). [0.16,1,0.3,1] eases out
// only - near-instant launch, long soft settle - the same family of curve
// used for panel/sheet transitions in most native UI, which is what makes
// those feel smooth rather than animated.
const TRANSITION_MS = 600
const SLIDE_TRANSITION = { duration: TRANSITION_MS / 1000, ease: [0.16, 1, 0.3, 1] }

// One scroll/swipe/arrow-key gesture advances exactly one page - not a
// continuous scrubber tied to how far the wheel moved. A single ref-based
// lock swallows every extra wheel event a gesture fires (trackpads send
// dozens) until the current transition finishes, so a long scroll can't
// skip pages, and position comes from plain state (not raw scroll
// distance) so the motion is a fixed, smooth animation every time rather
// than only as smooth as the user's own scroll input.
export function usePaginatedSlides(count) {
  const [index, setIndex] = useState(0)
  const indexRef = useRef(0)
  const animatingRef = useRef(false)
  const containerRef = useRef(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    indexRef.current = index
  }, [index])

  const goTo = useCallback(
    (next) => {
      const clamped = Math.max(0, Math.min(count - 1, next))
      if (clamped === indexRef.current || animatingRef.current) return
      animatingRef.current = true
      setIndex(clamped)
      window.setTimeout(() => {
        animatingRef.current = false
      }, TRANSITION_MS)
    },
    [count],
  )

  useEffect(() => {
    if (reduce) return
    const el = containerRef.current
    if (!el) return

    // A page's own content can be taller than the screen (the bullet-list
    // + gallery pages). Wheel/swipe over one of those scrolls it normally
    // until it hits that edge, and only then counts as a page-change
    // gesture - so tall pages remain fully readable without fighting the
    // pagination.
    function innerScrollBlocks(target, delta) {
      let node = target
      while (node && node !== el) {
        if (node.dataset && node.dataset.innerScroll) {
          const atTop = node.scrollTop <= 0
          const atBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 1
          if (delta > 0 && !atBottom) return true
          if (delta < 0 && !atTop) return true
          return false
        }
        node = node.parentElement
      }
      return false
    }

    function onWheel(e) {
      if (animatingRef.current) {
        e.preventDefault()
        return
      }
      if (innerScrollBlocks(e.target, e.deltaY)) return
      if (Math.abs(e.deltaY) < 10) return
      e.preventDefault()
      goTo(indexRef.current + (e.deltaY > 0 ? 1 : -1))
    }

    let touchStartY = null
    function onTouchStart(e) {
      touchStartY = e.touches[0].clientY
    }
    function onTouchMove(e) {
      if (touchStartY == null || animatingRef.current) return
      const delta = touchStartY - e.touches[0].clientY
      if (Math.abs(delta) < 40) return
      if (innerScrollBlocks(e.target, delta)) return
      e.preventDefault()
      goTo(indexRef.current + (delta > 0 ? 1 : -1))
      touchStartY = null
    }

    function onKeyDown(e) {
      if (animatingRef.current) return
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault()
        goTo(indexRef.current + 1)
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault()
        goTo(indexRef.current - 1)
      }
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('keydown', onKeyDown)
    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [goTo, reduce])

  return { containerRef, index, count, reduce, goTo }
}

// One full-screen page. While paginated (reduce === false), it's
// absolutely positioned over every page before it; framer-motion animates
// its x between 100% (off-screen right) and 0% (in place) whenever
// `activeIndex` changes, covering the previous page by sliding in from the
// right - the reference's core move. Once a page has been reached it stays
// at rest (lower pages remain at x: 0%, simply buried under later ones by
// z-index) so navigating back is just that page animating back out to the
// right, uncovering what was always still there underneath.
export function CaseStudySlide({ index, activeIndex, reduce, eyebrow, tone = 'light', className = '', children }) {
  const isActive = index === activeIndex
  const lightText = LIGHT_TEXT_TONES.has(tone)

  const grid = (
    <div className={`relative z-10 mx-auto grid w-full max-w-6xl gap-10 px-6 py-24 sm:px-10 md:grid-cols-[minmax(0,160px)_1fr] md:px-16 ${className}`}>
      <div className="shrink-0">
        <p className={`font-serif text-6xl font-bold leading-none sm:text-7xl ${lightText ? 'text-white/15' : 'text-ink/10'}`}>
          {String(index).padStart(2, '0')}
        </p>
        <p className={`mt-3 text-xs font-semibold uppercase tracking-[0.2em] ${lightText ? 'text-white/50' : 'text-ink/45'}`}>
          {eyebrow}
        </p>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  )

  // Drifting clouds for the "sky" tone - same compact layer used behind the
  // Work cards, just pooled over a full slide instead of a card. A separate
  // absolutely-positioned element (not part of the gradient background)
  // because it needs its own layer to animate.
  const clouds = tone === 'sky' && (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-70">
      <SkyClouds compact />
    </div>
  )

  if (reduce) {
    return (
      <div className={`relative flex min-h-screen flex-col justify-center overflow-hidden ${TONE_STYLES[tone]}`}>
        {clouds}
        {grid}
      </div>
    )
  }

  // The incoming page also settles in from a hair larger than full size
  // (1.02 -> 1) alongside the slide, rather than just translating at a flat
  // 100% scale the whole way - that tiny bit of scale is what reads as a
  // page settling into place instead of a rigid panel sliding on a track.
  const covering = index <= activeIndex

  return (
    <motion.div
      initial={false}
      animate={{ x: covering ? '0%' : '100%', scale: covering ? 1 : 1.02 }}
      transition={SLIDE_TRANSITION}
      style={{ zIndex: index + 1 }}
      aria-hidden={!isActive}
      className="absolute inset-0"
    >
      {/* The scrollable viewport: a fixed 100vh frame (h-full of its
          absolutely-positioned parent) with its own background, so the
          colour stays correct at any scroll position inside a tall page.
          overflow-y-auto here (not on the centring div below) is load-
          bearing: putting justify-center on the scrolling element itself
          is a known flexbox trap - content taller than the box ends up
          centred by being pushed partly above scrollTop: 0, making that
          portion unreachable by scrolling. Centring instead lives one level
          in, on a plain block that's free to simply grow taller than its
          min-height when content doesn't fit, leaving this element to
          scroll it normally from the real top. */}
      <div data-inner-scroll="true" className={`relative h-full overflow-y-auto ${TONE_STYLES[tone]}`}>
        {clouds}
        <div className="flex min-h-full flex-col justify-center">{grid}</div>
      </div>
    </motion.div>
  )
}

export function CaseStudyHeadline({ tone = 'light', children }) {
  return (
    <h2
      className={`text-balance font-serif text-3xl font-extrabold leading-tight sm:text-4xl md:text-5xl ${
        LIGHT_TEXT_TONES.has(tone) ? 'text-white' : 'text-ink'
      }`}
    >
      {children}
    </h2>
  )
}

export function CaseStudyBody({ tone = 'light', children }) {
  const paragraphs = Array.isArray(children) ? children : [children]
  return (
    <div className={`mt-6 max-w-2xl space-y-4 text-base leading-relaxed sm:text-lg ${
      LIGHT_TEXT_TONES.has(tone) ? 'text-white/70' : 'text-ink/70'
    }`}>
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  )
}

export function CaseStudyMeta({ tone = 'light', items }) {
  return (
    <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
      {items.map(({ label, value }) => (
        <div key={label}>
          <dt className={`text-xs font-semibold uppercase tracking-[0.15em] ${tone === 'sky' ? 'text-white/40' : 'text-ink/40'}`}>
            {label}
          </dt>
          <dd className={`mt-1 text-sm font-semibold ${tone === 'sky' ? 'text-white' : 'text-ink'}`}>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function CaseStudyList({ tone = 'light', items }) {
  return (
    <ul className="mt-6 max-w-2xl space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span className={`mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full ${tone === 'sky' ? 'bg-white/50' : 'bg-brand'}`} />
          <span className={`text-base leading-relaxed sm:text-lg ${tone === 'sky' ? 'text-white/70' : 'text-ink/70'}`}>
            {item}
          </span>
        </li>
      ))}
    </ul>
  )
}

// A looping, muted clip that only downloads and plays while it is near the
// viewport. preload="none" keeps the browser from fetching every case-study
// video up front; the observer starts playback (which triggers the fetch) on
// approach and pauses it again once the clip is well off screen.
function LazyVideo(props) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play().catch(() => {})
        else el.pause()
      },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return <video ref={ref} loop muted playsInline preload="none" {...props} />
}

// A labelled placeholder standing in for a screenshot or video that hasn't
// been supplied yet - a dashed box rather than empty space, so the layout
// reads correctly before real media replaces it. `video` renders a silent,
// looping, autoplaying clip (no controls) so it behaves like a live demo
// rather than a video player embedded in the page.
export function MediaPlaceholder({
  label,
  caption,
  tone = 'light',
  aspect = 'aspect-video',
  image,
  imageAlt,
  video,
  // 'cover' (default) fills the box, cropping whatever doesn't fit the
  // aspect ratio - fine when the box roughly matches the source's own
  // shape. 'contain' is for when it doesn't (e.g. a box shared with a
  // 16:9 video next to a ~4:3 screenshot) and cropping into the screenshot
  // would trim real content off its top/bottom - the whole image stays
  // visible, letterboxed, with the box's own background (set via
  // className) showing through the letterboxing instead of being left
  // blank.
  fit = 'cover',
  // A tall/portrait aspect (a phone screen recording, say) sizing from a
  // wide desktop column's full width grows very tall - tall enough on a
  // couple of Kora's slides to push the video below the fold and need a
  // scroll just to see the rest of it. Passing a full override here (e.g.
  // "mt-0 max-h-[40vh] w-fit") lets height, not column width, be the
  // binding constraint for those: the aspect ratio then derives a narrower
  // width instead of growing the height past the cap, so the whole clip
  // fits on screen at once with its shape unchanged. The default is just
  // the plain top margin every other slide's media gets - a prop, not a
  // hardcoded class, specifically so a caller can replace rather than
  // merely add to it (Tailwind has no reliable way to cancel one margin
  // utility by appending another).
  className = 'mt-10',
  // A small scale-up on the media itself (e.g. "scale-110"), cropped by
  // the box's own overflow-hidden - for a source clip with a thin baked-in
  // border (a recording with a sliver of its own background framing the
  // device) that fit="contain" would otherwise render as a thin stripe of
  // that colour between the device and the box's backdrop.
  mediaClassName = '',
}) {
  const fitClass = fit === 'contain' ? 'object-contain' : 'object-cover'
  if (video) {
    return (
      <div className={`overflow-hidden rounded-2xl ${aspect} ${className}`}>
        <LazyVideo
          src={video}
          aria-label={imageAlt || label}
          className={`h-full w-full ${fitClass} ${mediaClassName}`}
        />
      </div>
    )
  }
  if (image) {
    return (
      <div className={`overflow-hidden rounded-2xl ${aspect} ${className}`}>
        <img src={image} alt={imageAlt || label} loading="lazy" decoding="async" className={`h-full w-full ${fitClass} ${mediaClassName}`} />
      </div>
    )
  }
  return (
    <div
      className={`mt-10 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 text-center ${aspect} ${
        tone === 'sky' ? 'border-white/20 text-white/50' : 'border-ink/15 text-ink/45'
      }`}
    >
      <p className="text-sm font-semibold">{label}</p>
      {caption && <p className="max-w-sm text-xs">{caption}</p>}
    </div>
  )
}

export function BackBar({ href = '/#work', label = 'Back to work' }) {
  return (
    <a
      href={href}
      className="fixed left-4 top-4 z-50 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-4 py-2 text-sm font-semibold text-ink shadow-lg backdrop-blur-md transition hover:bg-white sm:left-6 sm:top-6"
    >
      <span aria-hidden="true">&larr;</span>
      {label}
    </a>
  )
}

// Mirrors BackBar on the opposite corner - only rendered for case studies
// that actually have a published Behance gallery. Label kept short
// ("Behance", not "View on Behance") so the two pills don't crowd each
// other on narrow phone widths.
export function BehanceLink({ href }) {
  if (!href) return null
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="fixed right-4 top-4 z-50 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-4 py-2 text-sm font-semibold text-ink shadow-lg backdrop-blur-md transition hover:bg-white sm:right-6 sm:top-6"
    >
      Behance
      <span aria-hidden="true">&#8599;</span>
    </a>
  )
}

// The "next case study" panel, upgraded from a plain text link to a
// clickable card with a thumbnail - reuses each project's own Work-card
// image rather than inventing new art. The whole card is the link (one
// big tap target, consistent with how the Work cards themselves work),
// with a small arrow badge as the only visual affordance that it's
// clickable.
export function NextProjectCard({ title, description, href, image, imageAlt }) {
  return (
    <a
      href={href}
      className="group mx-auto mt-8 flex max-w-md items-center gap-4 rounded-2xl bg-white p-3 text-left shadow-[0_8px_24px_-12px_rgba(15,31,77,0.25)] ring-1 ring-ink/[0.06] transition hover:shadow-[0_12px_32px_-12px_rgba(15,31,77,0.32)] sm:p-4"
    >
      <span className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-ink/5 sm:h-24 sm:w-24">
        <img
          src={image}
          alt={imageAlt}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-ink/40">Next project</span>
        <span className="mt-1 block truncate font-serif text-lg font-bold text-ink">{title}</span>
        <span className="mt-0.5 line-clamp-2 block text-sm text-ink/60">{description}</span>
      </span>
      <span
        aria-hidden="true"
        className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-white transition group-hover:bg-ink/90"
      >
        &rarr;
      </span>
    </a>
  )
}

// One segment per page; clicking a segment jumps straight there via the
// same goTo used for wheel/swipe/keyboard, so it stays subject to the same
// one-transition-at-a-time lock.
export function ProgressRail({ count, active, onSelect }) {
  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-6 sm:bottom-6">
      <div className="flex w-full max-w-sm gap-1.5 rounded-full border border-white/60 bg-white/70 p-2 shadow-lg backdrop-blur-md">
        {Array.from({ length: count }).map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to page ${i + 1} of ${count}`}
            aria-current={i === active}
            onClick={onSelect ? () => onSelect(i) : undefined}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i <= active ? 'bg-brand' : 'bg-ink/15'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
