import { motion } from 'framer-motion'
import { footer, profile } from '../data'

const EASE = [0.16, 1, 0.3, 1]

// A bare mailto opens a blank compose window - pre-filling the subject and
// an opening line makes the click actually feel like starting a
// conversation instead of just handing over an address.
function talkMailto(email) {
  return (
    `mailto:${email}` +
    `?subject=${encodeURIComponent("Let's work together")}` +
    `&body=${encodeURIComponent("Hi Sakshi,\n\nI'd love to talk about ")}`
  )
}

function MagneticIcon({ children, href }) {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noreferrer"
      whileHover={{ scale: 1.15, y: -3 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15 backdrop-blur"
    >
      {children}
    </motion.a>
  )
}

export default function Footer() {
  return (
    <footer
      id="contact"
      className="relative overflow-hidden pb-28 pt-56 text-white"
      style={{
        background: 'linear-gradient(180deg, rgba(234, 245, 255, 0) 0px, #8fb8ec 70px, #2a4b95 150px, #163372 210px, #0e1d4a 260px, #0b1638 320px, #0b1638 100%)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 -z-0 opacity-60"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 0%, rgba(47,127,242,0.25) 0%, transparent 70%)',
        }}
      />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: 0.6 }}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-brand-light"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-brand-light" />
          {footer.eyebrow}
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
          className="font-serif text-balance text-4xl font-extrabold leading-tight sm:text-6xl"
        >
          {footer.heading.map((seg, i) => (
            <span key={i} className={seg.emphasis ? 'italic text-brand-light' : ''}>
              {seg.text}
            </span>
          ))}
        </motion.h2>

        <motion.a
          href={talkMailto(profile.email)}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          whileHover={{ scale: 1.04 }}
          className="mt-8 inline-block rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink shadow-xl"
        >
          {profile.email}
        </motion.a>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-8 flex items-center gap-4"
        >
          <MagneticIcon href={profile.socials.linkedin}>in</MagneticIcon>
          <MagneticIcon href={profile.socials.behance}>Be</MagneticIcon>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 1.08 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1.2, ease: EASE }}
        className="pointer-events-none absolute -bottom-10 inset-x-0 select-none overflow-hidden text-center sm:-bottom-16"
      >
        <span className="block whitespace-nowrap font-sans text-[22vw] font-black leading-none tracking-tighter text-white/5 sm:text-[16vw]">
          {footer.watermark}
        </span>
      </motion.div>

      <p className="relative mt-16 text-center text-xs text-white/30">{footer.copyright}</p>
    </footer>
  )
}
