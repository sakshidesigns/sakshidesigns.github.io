import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SkyClouds } from '../../components/SkyClouds'
import { testimonials } from '../data'
import BurstHeading from './BurstHeading'

function Arrow({ dir, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      data-cursor-hover
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-ink shadow-[0_8px_24px_-12px_rgba(15,31,77,0.35)] ring-1 ring-ink/[0.08] transition hover:scale-105 hover:bg-brand hover:text-white"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d={dir === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
      </svg>
    </button>
  )
}

// One testimonial on screen at a time; the arrows slide to the previous / next
// one (wrapping round), so adding another entry to data.js just works.
export default function Testimonials() {
  const [[index, dir], setPage] = useState([0, 1])
  const items = testimonials.items
  const go = (step) => setPage([(index + step + items.length) % items.length, step])
  const item = items[index]

  return (
    <section id="testimonials" className="relative overflow-hidden px-4 pb-24 pt-32 sm:px-6 sm:pb-32 sm:pt-44">
      {/* A light version of the hero's sky with its drifting clouds, faded at the top and bottom into the page. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(180deg,transparent,#000_26%,#000_78%,transparent)]"
        style={{ background: 'linear-gradient(180deg, #8ec9fa 0%, #b5dcfc 55%, #cfe8ff 100%)' }}
      >
        <div className="absolute inset-0 opacity-90">
          <SkyClouds compact />
        </div>
      </div>
      <BurstHeading eyebrow={testimonials.eyebrow} title={testimonials.heading} subtitle={testimonials.subheading} className="relative z-10 pb-4" />

      <div className="relative z-10 mx-auto mt-8 flex max-w-5xl items-center gap-3 sm:mt-16 sm:gap-6">
        <Arrow dir="left" label="Previous testimonial" onClick={() => go(-1)} />
        <div className="relative min-w-0 flex-1 overflow-hidden px-1 py-10">
          <AnimatePresence mode="wait" initial={false} custom={dir}>
            <motion.figure
              key={index}
              custom={dir}
              initial={{ opacity: 0, x: dir * 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -60 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto flex max-w-2xl flex-col items-center"
            >
              {/* One frosted glass card holds the words and, under them, who said them. */}
              <div className="relative w-full rounded-[1.75rem] border border-white/70 bg-white/50 shadow-[0_24px_60px_-24px_rgba(23,74,173,0.45)] backdrop-blur-xl px-7 pb-7 pt-8 sm:px-10 sm:pb-10 sm:pt-10">
                <span aria-hidden="true" className="pointer-events-none block h-14 select-none  font-serif text-[7rem] font-extrabold leading-[0.8] text-ink sm:h-16 sm:text-[8.5rem]">&ldquo;</span>
                <blockquote className="relative mt-2 text-left text-base leading-relaxed text-ink sm:text-lg">{item.quote}</blockquote>
                <figcaption className="mt-7 flex items-center gap-3 border-t border-ink/10 pt-5">
                  <span className="text-left leading-tight">
                    <span className="block font-bold text-ink">{item.name}</span>
                    <span className="block text-sm text-ink/65">
                      {item.role}, {item.company}
                    </span>
                  </span>
                </figcaption>
              </div>
            </motion.figure>
          </AnimatePresence>
        </div>
        <Arrow dir="right" label="Next testimonial" onClick={() => go(1)} />
      </div>

      <div className="relative z-10 mt-2 flex justify-center gap-2" role="group" aria-label="Choose testimonial">
        {items.map((it, i) => (
          <button
            key={it.name}
            type="button"
            aria-label={`Show testimonial from ${it.name}`}
            aria-current={i === index}
            onClick={() => setPage([i, i >= index ? 1 : -1])}
            className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-brand' : 'w-2 bg-ink/20'}`}
          />
        ))}
      </div>
    </section>
  )
}
