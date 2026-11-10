import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { work, workHeading } from '../data'
import { SkyClouds } from '../../components/SkyClouds'
import BurstHeading from './BurstHeading'

// Kora (03) and DataAssist (04): the hand-held phone is a smaller fraction
// of their source photo than Bhoomi/SchooliAT's dashboard shots, so the
// same height cap as the other two renders visibly smaller - these get a
// larger cap instead of raising every card's and overflowing the wider ones.
const BIGGER_MOCKUP_IDS = new Set(['03', '04'])

function CardClouds() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-70">
      <SkyClouds compact />
    </div>
  )
}

// All cards share one continuous scroll progress and live in the same
// pinned viewport, layered by z-index. Card `index` slides up from below
// to cover the previous one during its own [start, end] slice of that
// progress; once the *next* card's slice begins, this one recedes slightly
// — but since it's already fully covered (lower z-index), that recede is
// invisible until it peeks out at the very edges, which is the point: a
// real stack, not a series of separate hand-offs.
// The slide-in only spends this fraction of a card's own segment actually
// moving; the rest is a held, fully-settled plateau before the next card's
// segment begins. Without that plateau, a card's reveal used to finish at
// the exact same progress value where the next card's reveal (and this
// one's own recede) started, so there was never a moment of "it's just
// sitting there" — only a hand-off straight into the next transition. That
// read as the stack advancing the instant you'd scrolled enough to see a
// card at all, which is what made scrolling to look at one image feel like
// it skipped straight to the next slide.
const REVEAL_FRACTION = 0.55

function StackCard({ item, index, total, progress, reduce }) {
  const segment = 1 / total
  const start = index * segment
  const end = (index + 1) * segment
  const isFirst = index === 0
  const isLast = index === total - 1

  // The first card has nothing to slide up over — it should already be
  // there the moment the section pins, not reveal itself over another
  // ~25% of the scroll track. Sliding it in too used to read as a long,
  // empty gap between the heading and any visible card content.
  const revealEnd = start + segment * REVEAL_FRACTION
  const revealY = useTransform(progress, [start, revealEnd], ['100%', '0%'])
  const y = isFirst ? '0%' : revealY
  // Recede still starts exactly when the next card's own segment begins
  // (= end) — but that boundary now arrives well after this card finished
  // settling at revealEnd, not in the same instant, so there's a genuine
  // held gap in between where nothing moves.
  const recedeStart = end
  const recedeEnd = Math.min(1, end + segment * 0.6)
  const scale = useTransform(progress, [recedeStart, recedeEnd], [1, isLast ? 1 : 0.94])
  const brightness = useTransform(progress, [recedeStart, recedeEnd], [1, isLast ? 1 : 0.85])
  const filter = useTransform(brightness, (v) => `brightness(${v})`)

  return (
    <motion.div
      style={reduce ? undefined : { y, zIndex: index + 1 }}
      className={`${reduce ? 'relative min-h-[36rem]' : 'absolute inset-0'} flex items-stretch justify-center px-3 pb-10 pt-20 sm:px-5 sm:pb-16 sm:pt-24`}
    >
      <motion.div style={reduce ? undefined : { scale, filter }} className="relative w-full max-w-[1600px]">
        {/* the card's own surface: the hero's vivid sky, edge to edge.
            will-change promotes this rounded, overflow-hidden surface to
            its own GPU layer - without it, having a scale() transform
            animate on the *parent* every scroll frame forces the browser
            to keep re-deriving this element's rounded-corner clip against
            the parent's ever-changing scale matrix, which on some displays
            left a thin 1px seam of the page background showing through
            along one clipped edge during the animation. */}
        <div className="card-sky-gradient noise relative flex h-full flex-col overflow-hidden rounded-[2rem] shadow-2xl shadow-blue-900/30 [will-change:transform]">
          <CardClouds />

          <div className="relative z-10 flex h-full flex-col items-center justify-center gap-6 p-6 sm:p-10 md:flex-row md:items-end md:justify-between md:gap-4 md:pr-0">
            {/* glassmorphic info panel, and the card's only interactive
                element: the whole panel opens the case study, not just a
                small button inside it, so hovering/clicking anywhere on it
                works and the site's own cursor is what shows it's clickable. */}
            <a
              href={item.cta.href}
              {...(item.cta.href.startsWith('/') ? {} : { target: '_blank', rel: 'noreferrer' })}
              aria-label={`View case study: ${item.title}`}
              className="work-card-glass relative block w-full max-w-xl shrink-0 rounded-[1.75rem] p-8 sm:p-10 md:flex md:min-h-[90%] md:flex-col"
            >
              <div className="mb-8 flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white ring-1 ring-white/30">
                  {item.id}
                </span>
                <span className="text-sm font-medium text-white/60">{item.year}</span>
              </div>
              <div className="mb-8 h-px w-full bg-white/15" />

              <div className="text-center md:my-auto md:text-left">
                <h3 className="mb-5 text-2xl font-extrabold leading-tight text-white sm:text-3xl">
                  {item.title}
                </h3>

                <div className="mb-5 flex flex-wrap justify-center gap-2 md:justify-start">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/25"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <p className="mb-8 text-sm leading-relaxed text-white/95">{item.description}</p>

                {/* visual affordance only - the whole panel above is the real link */}
                {/* [text-shadow:none]: cancels the panel's inherited text-shadow -
                    this pill is solid white behind ink text, which needs no halo */}
                <span className="inline-flex items-center gap-3 rounded-full bg-white py-1.5 pl-1.5 pr-6 text-sm font-bold text-ink shadow-lg [text-shadow:none]">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-white">
                    →
                  </span>
                  {item.cta.label}
                </span>
              </div>
            </a>

            {BIGGER_MOCKUP_IDS.has(item.id) ? (
              <>
                {/* mobile: the row is too narrow for a "reaches the
                    centre" region to mean anything, so this is a plain
                    modest contain-sized image instead.
                    Built as a joined array, not a template literal with
                    "md:hidden" butted straight against the interpolation -
                    that ran the two together into a single token Tailwind's
                    scanner couldn't match, so the class silently never
                    compiled and this image stayed visible at every width,
                    stacked behind the desktop one below. */}
                <img
                  src={item.image}
                  alt={item.title}
                  className="pointer-events-none min-w-0 max-w-full object-contain w-auto max-h-72 sm:max-h-96 md:hidden"
                />
                {/* desktop: a defined region running from the card's
                    centre to its right edge, full height - object-contain
                    so the whole photo stays visible, scaled to fit rather
                    than cropped into. Kora's photo used to need a
                    cover+crop workaround here (a lot of plain vignette
                    around the hand made contain read small and centred),
                    but the vignette is cut to transparent at the source
                    now (kora-card-nobg.webp), so contain already sizes the
                    hand naturally and the card's own sky gradient shows
                    straight through instead of needing a crop to hide it.
                    Absolutely positioned (not a flex sibling) so it takes a
                    fixed proportion of the card regardless of the panel's
                    own width. Widened from w-1/2 so the mockup reads larger
                    against the card. */}
                <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[58%] md:block">
                  <img
                    src={item.image}
                    alt={item.title}
                    className={[
                      'h-full w-full object-contain',
                      item.id === '03' ? 'object-right' : '',
                      // DataAssist's laptop + phone shot filled the whole region
                      // and met the card's edges and the info panel; an inset pulls it in.
                      item.id === '04' ? 'py-10 pl-20 pr-10 object-right' : '',
                    ].filter(Boolean).join(' ')}
                  />
                </div>
              </>
            ) : (
              /* Bhoomi and SchooliAT: the mockup itself, not a framed box
                 around it - sized by height (flexbox, not absolute
                 positioning, allocates its width, so it can never overlap
                 the panel) and anchored to the row's bottom edge (items-end
                 above) so it plants itself on the card's own floor instead
                 of floating small and centered with empty space around it. */
              <img
                src={item.image}
                alt={item.title}
                className="pointer-events-none min-w-0 max-w-full object-contain w-auto max-h-72 sm:max-h-96 md:max-h-[26rem] lg:max-h-[34rem]"
              />
            )}
          </div>

          {/* fade the last card's blue into the pale sky, merging into the section below */}
          {isLast && (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
              style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(234,245,255,0.95) 100%)' }}
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function Work() {
  const containerRef = useRef(null)
  // Reduced motion: no pinned, scroll-driven card stack - just a plain list.
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: reduce ? undefined : containerRef,
    offset: ['start start', 'end end'],
  })
  // The raw scroll fraction jumps in whatever steps the input device
  // produces (e.g. discrete wheel ticks), which reads as a jerky slide.
  // Springing it smooths those steps into continuous motion without
  // meaningfully lagging behind the actual scroll position.
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 260, damping: 34, mass: 0.6 })
  const progress = reduce ? scrollYProgress : smoothProgress

  return (
    <section id="work" className="relative">
      <BurstHeading
        eyebrow={workHeading.eyebrow}
        title={workHeading.title}
        subtitle={workHeading.subtitle}
        className="relative z-[1] pb-8 pt-8 sm:pb-10 sm:pt-16"
      />
      {reduce ? (
        <div className="relative">
          {work.map((item, i) => (
            <StackCard key={item.id} item={item} index={i} total={work.length} progress={progress} reduce />
          ))}
        </div>
      ) : (
        <div ref={containerRef} className="relative" style={{ height: `${work.length * 130}vh` }}>
          <div className="sticky top-0 h-screen overflow-hidden">
            {work.map((item, i) => (
              <StackCard key={item.id} item={item} index={i} total={work.length} progress={progress} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
