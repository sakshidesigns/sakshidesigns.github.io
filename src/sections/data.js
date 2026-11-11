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
    linkedin: 'https://www.linkedin.com/in/sakshi-haste-693318205',
    behance: 'https://www.behance.net/sakshihaste',
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

export const graphics = {
  heading: 'And the stuff I create otherwise!',
  items: [
    { src: '/graphics/wedding-vermala.webp', alt: 'Wedding illustration of a bride and groom exchanging garlands' },
    { src: '/graphics/celebration.webp', alt: 'A celebration post design' },
    { src: '/graphics/ergen-expo.webp', alt: 'Ergen expo event post' },
    { src: '/graphics/cheesecake-story.webp', alt: 'Cheesecake social story' },
    { src: '/graphics/battery-charger.webp', alt: 'Battery charger product post' },
    { src: '/graphics/reminder-note.webp', alt: 'Reminder note quote post' },
    { src: '/graphics/champ.webp', alt: 'Champ poster design' },
    { src: '/graphics/ergen-square.webp', alt: 'Ergen square flex design' },
    { src: '/graphics/posted.webp', alt: 'Social media post design' },
    { src: '/graphics/yummy.webp', alt: 'Food post design' },
  ],
}

export const testimonials = {
  eyebrow: 'Testimonials',
  heading: 'see what they say',
  subheading: 'Check what they have said about working with me.',
  items: [
    {
      quote:
        'Sakshi is dependable, creative, and takes genuine ownership of her work. She consistently delivers on time, communicates confidently with clients, and goes beyond her responsibilities to contribute to better design and user experiences. Her dedication and ability to handle challenges make her a strong team player.',
      name: 'Akshata Ghate',
      role: 'CEO',
      company: 'Globuzz',
    },
    {
      quote:
        'Sakshi brings a thoughtful blend of creativity and problem-solving to her work. What stood out to me was her ability to look beyond the brief, understand what a project truly needs, and turn those ideas into meaningful design experiences. Her contribution to our client projects, particularly in website design and brand consistency, reflected her initiative, adaptability, and strong sense of ownership.',
      name: 'Vaibhav Pagare',
      role: 'Co-founder',
      company: 'IFT Media',
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
