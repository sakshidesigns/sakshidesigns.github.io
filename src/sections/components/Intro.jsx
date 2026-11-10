import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { intro } from '../data'

function Word({ children, progress, range, emphasis }) {
  const color = useTransform(progress, range, ['rgba(15, 31, 77, 0.3)', '#0f1f4d'])
  const blur = useTransform(progress, range, [1.5, 0])
  const filter = useTransform(blur, (v) => `blur(${v}px)`)
  const reduce = useReducedMotion()
  if (emphasis) {
    return <span className="italic text-brand-deep">{children}</span>
  }
  // Reduced motion: show the statement at full strength, no scroll-driven blur.
  if (reduce) return <span>{children}</span>
  return <motion.span style={{ color, filter }}>{children}</motion.span>
}

export default function Intro() {
  const ref = useRef(null)
  // Give the reader a moment to see the full (grey) sentence before the
  // reveal starts, then spread the darken-to-black transition across a
  // generous scroll distance rather than resolving it too quickly.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.65', 'end 0.55'],
  })

  const words = intro.heading.flatMap((segment) =>
    segment.text.split(' ').filter(Boolean).map((word) => ({
      word,
      emphasis: segment.emphasis,
    }))
  )

  return (
    <section ref={ref} id="about" className="relative px-6 pb-16 pt-36 sm:pb-24 sm:pt-48">
      <div className="relative z-[1] mx-auto grid max-w-5xl gap-6 sm:grid-cols-[1fr_2.1fr] sm:gap-10">
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: 0.6 }}
          className="flex items-start gap-2 text-sm font-semibold uppercase tracking-widest text-brand-deep"
        >
          <span className="mt-1 h-2 w-2 rotate-45 bg-brand" />
          {intro.eyebrow}
        </motion.div>

        <p className="text-balance text-2xl font-bold leading-snug sm:text-3xl md:text-4xl lg:text-5xl">
          {words.map(({ word, emphasis }, i) => {
            const start = i / words.length
            const end = start + 1 / words.length
            return (
              <Word key={i} progress={scrollYProgress} range={[start, end]} emphasis={emphasis}>
                {word}{' '}
              </Word>
            )
          })}
        </p>
      </div>
    </section>
  )
}
