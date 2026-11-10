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

// Light-blue cloud bank along the footer's bottom edge, drawn above the big
// name watermark. Three overlapping rows (back to front: the deeper sky blue,
// then the pale tints the hero and cards use) each drift sideways at their own
// pace. A row is two identical tiles side by side, so sliding it by exactly one
// tile (-50%) loops seamlessly; circles stay clear of the tile edges for that.
// [cx, cy, r] bumps plus the y where the solid base starts.
const CLOUD_ROWS = [
  { fill: '#a8d5f8', base: 130, duration: 80, bumps: [[100, 120, 80], [250, 105, 95], [420, 120, 85], [590, 105, 90], [770, 120, 85], [930, 100, 95], [1080, 125, 80]] },
  { fill: '#c7e3f9', base: 170, duration: 58, bumps: [[160, 160, 75], [320, 145, 90], [500, 160, 80], [680, 140, 95], [860, 160, 80], [1020, 145, 90], [1130, 175, 60]] },
  { fill: '#eaf5ff', base: 190, duration: 42, bumps: [[90, 205, 60], [240, 190, 75], [400, 205, 65], [560, 185, 85], [720, 205, 65], [880, 190, 80], [1040, 205, 65], [1160, 215, 45]] },
]

function CloudTile({ row }) {
  return (
    <svg className="h-full w-1/2 shrink-0" viewBox="0 0 1200 240" preserveAspectRatio="none">
      <g fill={row.fill}>
        {row.bumps.map(([cx, cy, r]) => (
          <circle key={cx} cx={cx} cy={cy} r={r} />
        ))}
        <rect x="0" y={row.base} width="1200" height={240 - row.base} />
      </g>
    </svg>
  )
}

function FooterClouds() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[12vw] min-h-[100px] overflow-hidden" aria-hidden="true">
      {CLOUD_ROWS.map((row) => (
        <div key={row.fill} className="footer-cloud-row" style={{ animationDuration: `${row.duration}s` }}>
          <CloudTile row={row} />
          <CloudTile row={row} />
        </div>
      ))}
    </div>
  )
}

export default function Footer() {
  return (
    <footer
      id="contact"
      className="relative overflow-hidden pt-56 text-white"
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

      {/* Decorative dusk colour: a violet-to-pink glow rising behind the clouds
          (transparent over the text area, so the navy the text sits on is
          unchanged), a soft blue bloom up top, and a scatter of faint stars. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[calc(20vw+14rem)] min-h-[22rem]"
        style={{
          background:
            'linear-gradient(180deg, rgba(11,22,56,0) 0%, rgba(58,63,158,0.55) 40%, rgba(138,99,205,0.75) 70%, rgba(244,166,206,0.9) 100%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-24 h-72 opacity-80"
        style={{
          backgroundImage:
            'radial-gradient(1.5px 1.5px at 8% 30%, #fff, transparent), radial-gradient(1px 1px at 18% 70%, #fff, transparent), radial-gradient(1.5px 1.5px at 29% 20%, #fff, transparent), radial-gradient(1px 1px at 41% 82%, #fff, transparent), radial-gradient(1.5px 1.5px at 56% 12%, #fff, transparent), radial-gradient(1px 1px at 67% 64%, #fff, transparent), radial-gradient(1.5px 1.5px at 78% 28%, #fff, transparent), radial-gradient(1px 1px at 88% 74%, #fff, transparent), radial-gradient(1.5px 1.5px at 94% 16%, #fff, transparent)',
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
        className="pointer-events-none absolute bottom-[4vw] inset-x-0 select-none overflow-hidden text-center"
      >
        <span className="block whitespace-nowrap font-sans text-[22vw] font-black leading-none tracking-tighter text-white/25 sm:text-[16vw]">
          {footer.watermark}
        </span>
      </motion.div>

      <p className="relative mt-16 text-center text-xs text-white/60">{footer.copyright}</p>

      {/* Reserves the clouds' height in the flow so nothing sits under them. */}
      <div className="h-[18vw] min-h-[130px]" />
      <FooterClouds />
    </footer>
  )
}
