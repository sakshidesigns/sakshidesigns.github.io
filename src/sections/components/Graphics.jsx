import { useEffect, useRef, useState } from 'react'
import { graphics } from '../data'

// Wave the heading rides on: one full period every 1200 units, repeated three
// times, so sliding the whole strip left by exactly one period loops seamlessly.
const PERIOD = 1200
const WAVE = Array.from({ length: 3 }, (_, i) => {
  const x = i * PERIOD
  return `${i === 0 ? `M${x} 110` : ''} C${x + 300} 40 ${x + 300} 40 ${x + 600} 110 S${x + 900} 180 ${x + 1200} 110`
}).join(' ')

function WaveHeading({ text }) {
  const run = `${text} · `.repeat(3)
  return (
    <div className="graphics-wave-clip overflow-hidden" role="heading" aria-level={2} aria-label={text}>
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${PERIOD * 3} 220`}
        width={PERIOD * 3}
        height={220}
        className="graphics-wave max-w-none"
      >
        <path id="graphics-wave-path" d={WAVE} fill="none" />
        <text className="font-serif" fontSize="68" fontWeight="800" fill="#174aad" textLength={PERIOD * 3} lengthAdjust="spacing">
          <textPath href="#graphics-wave-path">{run}</textPath>
        </text>
      </svg>
    </div>
  )
}

function GraphicCard({ item }) {
  return (
    <div className="graphics-card shrink-0 rounded-3xl bg-[#eef6ff] p-3 ring-1 ring-ink/[0.06] sm:p-4">
      <img
        src={item.src}
        alt={item.alt}
        loading="lazy"
        draggable="false"
        className="h-[260px] w-auto rounded-2xl object-cover sm:h-[380px]"
      />
    </div>
  )
}

export default function Graphics() {
  const ref = useRef(null)
  // The strip stays parked, with the first picture in view, until the section
  // scrolls on screen; only then does it start drifting. So a visitor always
  // sees it begin from the first picture instead of arriving mid-loop.
  const [started, setStarted] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setStarted(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true)
          io.disconnect()
        }
      },
      { threshold: 0.25 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section ref={ref} id="graphics" className="relative overflow-hidden pb-40 pt-20 sm:pb-52 sm:pt-28"
      style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, #fff 9%, #fff 70%, rgba(255,255,255,0) 100%)' }}>
      <WaveHeading text={graphics.heading} />
      <div className="mt-8 overflow-hidden pl-[6vw] sm:mt-12">
        {/* Two identical halves (each ends with the gap), so sliding left by exactly half loops with no seam and no arrows. */}
        <div className="graphics-track flex w-max" style={{ animationPlayState: started ? 'running' : 'paused' }}>
          {[0, 1].map((copy) => (
            <div key={copy} className="flex gap-4 pr-4 sm:gap-6 sm:pr-6" aria-hidden={copy === 1 ? 'true' : undefined}>
              {graphics.items.map((item) => (
                <GraphicCard key={item.src} item={item} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
