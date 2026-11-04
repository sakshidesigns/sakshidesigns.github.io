// Central place for all portfolio content.
// Swap these values out later — components just read from here.
// (Trimmed when lifted from old-portfolio: the old hero-only exports were removed.)

export const profile = {
  name: 'Sakshi Haste',
  role: 'UI/UX & Product Designer',
  email: 'sakshihaste1008@gmail.com',
  location: 'Pune, India',
  experience: '3+ Years',
  socials: {
    linkedin: 'https://linkedin.com/',
    behance: 'https://behance.net/',
  },
}

export const intro = {
  eyebrow: 'What I do',
  heading: [
    { text: 'I make sense of complicated products ', emphasis: false },
    { text: '— shaping', emphasis: true },
    { text: ' workflows, interfaces, and systems people can navigate naturally.', emphasis: false },
  ],
}

export const workHeading = {
  eyebrow: 'Selected Work',
  title: 'check out some of my work',
  subtitle: "A few products I've helped shape, and the thinking behind them.",
}

export const work = [
  {
    id: '01',
    year: '2024',
    title: 'Smart waste management, rebuilt for an entire city',
    tags: ['Civic-Tech', 'Admin Dashboards'],
    description:
      "End-to-end UX for Bhoomi Foundation's government-affiliated smart waste-management platform — RFID-tracked collection fleets, a citizen complaints app, and an admin dashboard now adopted across most households in its pilot city.",
    cta: { label: 'View Case Study', type: 'primary', href: '/work/bhoomi' },
    image: '/bhoomi.webp',
  },
  {
    id: '02',
    year: '2024',
    title: 'A school ERP, rebuilt for admins, teachers & students',
    tags: ['EdTech', 'Admin Dashboards'],
    description:
      'End-to-end UI/UX for SchooliAT, a school ERP platform — admin and super-admin dashboards now live in production, plus teacher, student, and admin mobile app designs.',
    cta: { label: 'View Case Study', type: 'primary', href: '/work/schooliat' },
    image: '/schooliat.webp',
  },
  {
    id: '03',
    year: '2023',
    title: 'Personal healthcare records, finally in one place',
    tags: ['Healthcare', 'Zero to One'],
    description:
      'Kora is a mobile Health Data Vault that centralizes prescriptions, lab reports, and scan documents in one secure place, with permission-based sharing so patients stay in control of exactly who sees their records — well received on Behance, and has since drawn acquisition interest from prospective buyers.',
    cta: { label: 'View Case Study', type: 'primary', href: '/work/kora' },
    // kora.webp's own studio backdrop (a black-to-bright-glow-to-black
    // radial vignette, not a flat colour) cut to a transparent alpha
    // channel via subject segmentation (rembg's bria-rmbg model - a plain
    // brightness cutoff couldn't tell the bright glow around the hand from
    // the hand itself, and left a soft grey halo where it tried), then
    // cropped to the resulting opaque content's own bounding box - without
    // that, the margin that used to be backdrop was still part of the
    // image's width once transparent, so object-right aligned to that
    // empty edge instead of the phone itself.
    image: '/kora-card-nobg.webp',
    behanceHref: 'https://www.behance.net/gallery/242575653/Kora-Personal-Healthcare-Records-App-UX-Case-Study',
  },
  {
    id: '04',
    year: '2025',
    title: 'An AI-powered dashboard that explains your data, not just charts',
    tags: ['AI / SaaS', 'Analytics Dashboard'],
    description:
      'An independent UX/UI concept for DataAssist, an AI-powered SaaS analytics dashboard — a built-in assistant surfaces revenue, conversion, and traffic insights in plain language, flagging issues like checkout friction before they become problems.',
    cta: { label: 'View Case Study', type: 'primary', href: '/work/dataassist' },
    image: '/dataassist-hero-laptop-phone.webp',
    behanceHref: 'https://www.behance.net/gallery/247351403/DataAssist-AI-Powered-SaaS-Dashboard-UXUI-Case-Study',
  },
]

export const writingHeading = {
  eyebrow: 'Writing',
  title: 'notes from the process',
  subtitle: 'Thinking written down, alongside the shipped work.',
}

export const writing = [
  {
    title: 'First Touch of Trust',
    subtitle: 'An authentication UX case study',
    description:
      'How thoughtful authentication design shapes user confidence from the very first interaction — a look at designing sign-up and login flows people trust.',
    // Native 1248x2216, transparent background.
    image: '/writing-first-touch-of-trust.webp',
    imageAlt: 'A mobile sign-in screen from the First Touch of Trust case study',
    behanceHref: 'https://www.behance.net/gallery/243517103/First-Touch-of-Trust-Authentication-UX-Case-Study',
    mediumHref:
      'https://medium.com/design-bootcamp/first-touch-of-trust-how-thoughtful-authentication-design-shapes-user-confidence-from-the-first-81faeff1f90e',
  },
]

export const experience = {
  eyebrow: 'Experience',
  heading: 'the journey so far',
  subheading: 'From enterprise SAP apps to civic-tech platforms to brand-led agency work — three+ years, and counting.',
  items: [
    {
      period: "Mar '21 – Present",
      current: true,
      role: 'Freelance UI/UX Designer',
      company: 'Independent',
      location: 'Remote',
      points: [
        'Designed end-to-end UX for **SaaS, civic-tech, healthcare, real estate & NGO** products.',
        'Built complex **dashboards, role-based workflows, mobile apps** and design systems.',
        'Turned business requirements into clear, **scalable digital experiences**.',
      ],
    },
    {
      period: "Feb '24 – Sep '25",
      current: false,
      role: 'Packaged App Development Associate',
      company: 'Accenture',
      location: 'India',
      points: [
        'Improved UX for **enterprise SAP-based applications**.',
        'Designed and tested UI components using **SAPUI5, HTML & CSS**.',
        'Worked with cross-functional teams to translate complex workflows into **usable interfaces**.',
      ],
    },
    {
      period: "Sep '23 – Jan '24",
      current: false,
      role: 'UI/UX Designer & Brand Lead',
      company: 'IFT Media',
      location: 'India',
      points: [
        "Led the redesign of **Kiosk Kaffee's** website and digital presence.",
        'Created brand, UI and visual systems across **multiple client projects**.',
        'Helped drive **15–20% growth** in website traffic for Kiosk Kaffee.',
      ],
    },
    {
      period: "Jan '23 – Aug '23",
      current: false,
      role: 'UI/UX Designer & Digital Lead',
      company: 'Globuzz Inc.',
      location: 'India',
      points: [
        'Led **UI/UX, graphic design and video** for digital campaigns.',
        'Aligned website and social experiences with **brand direction**.',
        'Collaborated with developers to improve **website UX and performance**.',
      ],
    },
  ],
}

export const footer = {
  eyebrow: 'Contact',
  heading: [
    { text: "let's ", emphasis: false },
    { text: 'build', emphasis: true },
    { text: ' incredible work together.', emphasis: false },
  ],
  watermark: 'SAKSHI',
  copyright: `© ${new Date().getFullYear()} Design Sakshi`,
}
