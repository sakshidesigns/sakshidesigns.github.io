import { motion } from 'framer-motion'

function BurstWord({ children, index }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 1.8, filter: 'blur(10px)', y: 14 }}
      whileInView={{ opacity: 1, scale: 1, filter: 'blur(0px)', y: 0 }}
      viewport={{ once: true, amount: 0.8 }}
      transition={{
        duration: 0.7,
        delay: index * 0.045,
        type: 'spring',
        stiffness: 180,
        damping: 16,
      }}
      className="inline-block"
    >
      {children}&nbsp;
    </motion.span>
  )
}

export default function BurstHeading({ eyebrow, title, subtitle, className = '' }) {
  const words = title.split(' ')
  return (
    <div className={`mx-auto max-w-4xl px-6 text-center ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ duration: 0.6 }}
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-brand-deep"
      >
        <span className="h-2 w-2 rotate-45 bg-brand" />
        {eyebrow}
      </motion.div>

      <h2 className="font-serif text-balance text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl md:text-6xl">
        {words.map((w, i) => (
          <BurstWord key={i} index={i}>
            {w}
          </BurstWord>
        ))}
      </h2>

      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-6 text-base text-ink/70 sm:text-lg"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  )
}
