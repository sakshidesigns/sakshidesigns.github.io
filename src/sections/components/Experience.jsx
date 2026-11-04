import { useLayoutEffect, useRef, useState } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { experience } from '../data'
import BurstHeading from './BurstHeading'

// Points are written as plain text with **this** marking the phrase that
// should stand out (project names, metrics) - cheaper to edit in data.js
// than nested segment objects, and matches the reference's bolded key
// phrases inside each bullet.
function HighlightedPoint({ text }) {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-ink">
        {part}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  )
}

// Each card's own entrance, on its own short slice of the section's
// scroll progress - sliding in from the right and fading up, independent
// of however far the track itself happens to have panned underneath it.
// Relying on the track's pan alone to "reveal" a card (its natural flex
// position simply becoming visible as the row slides left) meant a card
// could already be sitting fully in place the moment any part of it came
// into view, with nothing that actually read as motion - this gives every
// card its own explicit, guaranteed slide-in beat.
const REVEAL_FRACTION = 0.5

function TimelineCard({ item, index, total, progress }) {
  const segment = 1 / total
  const start = index * segment
  const revealEnd = start + segment * REVEAL_FRACTION
  const x = useTransform(progress, [start, revealEnd], [140, 0])
  const opacity = useTransform(progress, [start, revealEnd], [0, 1])
  return (
    <motion.div style={{ x, opacity }}>
      <ExperienceCard item={item} />
    </motion.div>
  )
}

function ExperienceCard({ item }) {
  return (
    <div className="flex w-64 shrink-0 flex-col items-center sm:w-72">
      <span className="mb-2 text-lg font-light text-ink/20">+</span>
      <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-green-100 px-4 py-1.5 text-sm font-bold text-green-700">
        {item.period}
      </span>
      <span className="relative h-8 w-px bg-ink/15">
        <span className="absolute -left-[5px] -top-[5px] flex h-[11px] w-[11px] items-center justify-center rounded-full bg-brand ring-4 ring-white/70">
          {item.current && (
            <motion.span
              animate={{ scale: [1, 2.4], opacity: [0.6, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
              className="absolute inline-flex h-full w-full rounded-full bg-brand"
            />
          )}
        </span>
      </span>

      {/* A narrow column rather than a wide strip - no logo, just the
          company name leading (it's the headline fact), the role under it,
          and three highlighted bullets, the way the reference reads. */}
      <div className="w-full rounded-2xl bg-white p-6 shadow-[0_8px_24px_-12px_rgba(15,31,77,0.18)] ring-1 ring-ink/[0.06] sm:p-7">
        <div className="mb-4">
          <h3 className="text-lg font-bold leading-snug text-ink">{item.company}</h3>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="truncate text-sm text-ink/50">{item.role}</p>
            <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-ink/40">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
                <circle cx="12" cy="10" r="2.3" />
              </svg>
              {item.location}
            </span>
          </div>
        </div>
        <div className="mb-4 h-px w-full bg-ink/5" />
        <ul className="space-y-4 text-left text-sm leading-relaxed text-ink/70">
          {item.points.map((point, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink/30" />
              <span>
                <HighlightedPoint text={point} />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default function Experience() {
  const wrapperRef = useRef(null)
  const trackRef = useRef(null)
  const [panDistance, setPanDistance] = useState(0)
  const reduce = useReducedMotion() // reduced motion: a plain vertical list instead of the pinned horizontal pan

  useLayoutEffect(() => {
    function measure() {
      if (!trackRef.current) return
      setPanDistance(Math.max(trackRef.current.scrollWidth - document.documentElement.clientWidth, 0))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const { scrollYProgress } = useScroll({
    target: reduce ? undefined : wrapperRef,
    offset: ['start start', 'end end'],
  })
  const x = useTransform(scrollYProgress, [0, 1], [0, -panDistance])

  return (
    <section id="experience" className="relative">
      <BurstHeading
        eyebrow={experience.eyebrow}
        title={experience.heading}
        subtitle={experience.subheading}
        className="pb-8 pt-24 sm:pb-10 sm:pt-32"
      />

      {reduce ? (
        <div className="mx-auto flex flex-col items-center gap-10 px-4 pb-20 sm:px-6 [&>div]:w-full [&>div]:max-w-xs">
          {experience.items.map((item) => (
            <ExperienceCard key={item.company + item.period} item={item} />
          ))}
        </div>
      ) : (
        <div ref={wrapperRef} className="relative" style={{ height: `${experience.items.length * 70 + 30}vh` }}>
          <div className="sticky top-0 flex h-screen items-center overflow-hidden">
            {/* The track still pans horizontally (panDistance = its
                scrollWidth minus the viewport width) so cards beyond the
                first screenful can be reached at all on narrower viewports
                where the full row doesn't fit at once. The leading padding
                keeps the row's starting position off to the right at
                progress 0, but the visible "slides in" motion itself now
                comes from each TimelineCard's own entrance below, not from
                this pan alone - a value here that's too large relative to
                the real card content used to spend most of the scroll
                track just clearing blank space before anything moved, and
                one too small left cards already sitting on screen with no
                entrance at all. */}
            <motion.div
              ref={trackRef}
              style={{ x }}
              className="relative flex shrink-0 items-start gap-4 pl-[60vw] pr-[15vw] sm:gap-6"
            >
              {/* One continuous spine behind every dot, instead of each card
                  owning its own short, disconnected stub of line - matching
                  the reference's single timeline running the whole length. */}
              <div className="absolute inset-x-0 top-[80px] -z-10 h-px bg-ink/15" aria-hidden="true" />
              {experience.items.map((item, i) => (
                <TimelineCard
                  key={item.company + item.period}
                  item={item}
                  index={i}
                  total={experience.items.length}
                  progress={scrollYProgress}
                />
              ))}
            </motion.div>
          </div>
        </div>
      )}
    </section>
  )
}
