// Self-contained SVG placeholders so the site has zero external image
// dependencies. Swap these for real photos/screens later.

function toDataUri(svg) {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export function avatarPlaceholder(initials, from = '#2f7ff2', to = '#8ec9f0') {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${from}"/>
          <stop offset="1" stop-color="${to}"/>
        </linearGradient>
      </defs>
      <rect width="80" height="80" rx="40" fill="url(#g)"/>
      <text x="50%" y="53%" text-anchor="middle" dy="0.1em" font-family="Inter, sans-serif" font-weight="700" font-size="28" fill="white">${initials}</text>
    </svg>`
  return toDataUri(svg)
}

export function photoPlaceholder(initials, from = '#2f7ff2', to = '#0f1115') {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${from}"/>
          <stop offset="1" stop-color="${to}"/>
        </linearGradient>
      </defs>
      <rect width="240" height="240" fill="url(#g)"/>
      <circle cx="120" cy="95" r="38" fill="white" fill-opacity="0.9"/>
      <path d="M40 220 C 40 160, 200 160, 200 220 Z" fill="white" fill-opacity="0.9"/>
      <text x="50%" y="230" text-anchor="middle" font-family="Inter, sans-serif" font-weight="700" font-size="14" fill="white" opacity="0.6">${initials}</text>
    </svg>`
  return toDataUri(svg)
}

export function idPhotoPlaceholder(from = '#8ec9f0', to = '#2f7ff2') {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="520" viewBox="0 0 400 520">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${from}"/>
          <stop offset="1" stop-color="${to}"/>
        </linearGradient>
      </defs>
      <rect width="400" height="520" fill="url(#g)"/>
      <circle cx="200" cy="190" r="80" fill="#eef6ff"/>
      <path d="M60 480 C 60 350, 340 350, 340 480 Z" fill="#eef6ff"/>
    </svg>`
  return toDataUri(svg)
}

export function appMockupPlaceholder(label, accent = '#2f7ff2') {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="320" height="640" viewBox="0 0 320 640">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#12141a"/>
          <stop offset="1" stop-color="#0a0b0e"/>
        </linearGradient>
      </defs>
      <rect width="320" height="640" fill="url(#g)"/>
      <rect x="24" y="64" width="272" height="48" rx="12" fill="white" fill-opacity="0.08"/>
      <rect x="24" y="128" width="180" height="16" rx="8" fill="white" fill-opacity="0.16"/>
      <rect x="24" y="156" width="130" height="12" rx="6" fill="white" fill-opacity="0.1"/>
      <rect x="24" y="200" width="272" height="120" rx="16" fill="${accent}" fill-opacity="0.25"/>
      <rect x="24" y="336" width="130" height="130" rx="16" fill="white" fill-opacity="0.08"/>
      <rect x="166" y="336" width="130" height="130" rx="16" fill="white" fill-opacity="0.08"/>
      <rect x="24" y="484" width="272" height="56" rx="14" fill="${accent}"/>
      <text x="160" y="518" text-anchor="middle" font-family="Inter, sans-serif" font-weight="700" font-size="16" fill="white">${label}</text>
    </svg>`
  return toDataUri(svg)
}

