import { motion } from 'framer-motion'
import { writing, writingHeading } from '../data'
import BurstHeading from './BurstHeading'

// A real screen from the case study itself (the article's own sign-in
// mockup, transparent background) stands in for the pencil-mark icon this
// started with - sized and aligned like a small product shot next to the
// text, the same way the Work cards pair a mockup with their info panel.
function WritingCard({ item }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.6 }}
      className="mx-auto flex max-w-xl flex-col items-center gap-5 rounded-2xl bg-white p-7 text-left shadow-[0_8px_24px_-12px_rgba(15,31,77,0.18)] ring-1 ring-ink/[0.06] sm:flex-row sm:p-8"
    >
      <motion.img
        src={item.image}
        alt={item.imageAlt}
        className="h-40 w-auto shrink-0 sm:h-56"
        whileHover={{ scale: 1.05, y: -4 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      />

      <div className="min-w-0 flex-1 text-center sm:text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/40">{item.subtitle}</p>
        <h3 className="mt-1 font-serif text-xl font-bold leading-snug text-ink sm:text-2xl">{item.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink/70 sm:text-base">{item.description}</p>

        <div className="mt-5 flex flex-wrap justify-center gap-3 sm:justify-start">
          <a
            href={item.behanceHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-ink/90"
          >
            View on Behance
            <span aria-hidden="true">&#8599;</span>
          </a>
          <a
            href={item.mediumHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-5 py-2.5 text-sm font-bold text-ink transition hover:bg-ink/5"
          >
            Read on Medium
            <span aria-hidden="true">&#8599;</span>
          </a>
        </div>
      </div>
    </motion.div>
  )
}

export default function Writing() {
  return (
    <section id="writing" className="relative px-6 py-20 sm:py-28">
      <BurstHeading
        eyebrow={writingHeading.eyebrow}
        title={writingHeading.title}
        subtitle={writingHeading.subtitle}
        className="pb-12 sm:pb-16"
      />
      <div className="flex flex-col gap-6">
        {writing.map((item) => (
          <WritingCard key={item.title} item={item} />
        ))}
      </div>
    </section>
  )
}
