// src/sections/caseStudy/DataAssistCaseStudy.jsx
import {
  BackBar,
  BehanceLink,
  CaseStudyBody,
  CaseStudyHeadline,
  CaseStudyMeta,
  CaseStudySlide,
  MediaPlaceholder,
  NextProjectCard,
  ProgressRail,
  usePaginatedSlides,
} from './CaseStudyKit'
import { work } from '../data'

// Same light, light, dark rhythm as the other three case studies: dark
// lands on "Brand & visual direction" and "Reflection" - the same two
// roles dark slides play across every case study on this site, each
// flanked by light slides on both sides rather than sitting on its own.
const SLIDE_COUNT = 7

const behanceHref = work.find((item) => item.id === '04')?.behanceHref

export default function DataAssistCaseStudy() {
  const { containerRef, index: activeIndex, reduce, goTo } = usePaginatedSlides(SLIDE_COUNT)

  const slide = (index, props) => ({ index, activeIndex, reduce, ...props })

  const slides = (
    <>
      <CaseStudySlide {...slide(0, { eyebrow: 'Introduction', tone: 'tint' })}>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-deep">DataAssist</p>
        <CaseStudyHeadline tone="tint">A product experience shaped by its first impression.</CaseStudyHeadline>
        <CaseStudyBody tone="tint">
          DataAssist explores the visual presentation of an AI-powered SaaS product across laptop and mobile. The
          focus of this case study is the hero section — its brand identity, value proposition, visual hierarchy,
          and product presentation.
        </CaseStudyBody>
        <CaseStudyMeta
          tone="tint"
          items={[
            { label: 'Role', value: 'UI/UX Designer' },
            { label: 'Platform', value: 'Web & Mobile' },
            { label: 'Project', value: 'AI-Powered SaaS Dashboard' },
          ]}
        />
        {/* Native 1560x1008. */}
        <MediaPlaceholder
          tone="tint"
          aspect="aspect-[1560/1008]"
          image="/dataassist-hero-laptop-phone.webp"
          imageAlt="DataAssist hero design shown on laptop and phone"
        />
      </CaseStudySlide>

      <CaseStudySlide {...slide(1, { eyebrow: 'The challenge', tone: 'light' })}>
        <CaseStudyHeadline>Communicating value at a glance.</CaseStudyHeadline>
        <CaseStudyBody>
          The hero section brings together the product&apos;s key message, supporting information, and visual
          elements in a single first impression. The challenge is to establish a clear hierarchy so visitors can
          understand the offering and identify the primary action.
        </CaseStudyBody>
        {/* Native 1500x1900 (portrait) - a wide, tall box so the full
            annotated mobile screen and its side callouts show uncropped. */}
        <MediaPlaceholder
          aspect="aspect-[1500/1900]"
          image="/dataassist-interface-callouts.webp"
          imageAlt="DataAssist mobile interface with numbered callouts for header, overview, analytics cards and AI assistant"
        />
      </CaseStudySlide>

      {/* Dark here (and again at the reflection) is the same deliberate
          rhythm used on every case study on this site: each dark beat
          sits with light slides on both sides of it. */}
      <CaseStudySlide {...slide(2, { eyebrow: 'Brand & visual direction', tone: 'dark' })}>
        <CaseStudyHeadline tone="dark">A visual language built around DataAssist.</CaseStudyHeadline>
        <CaseStudyBody tone="dark">
          The brand identity, typography, colour palette, and card styling work together to create a recognisable
          and consistent presentation — examined here as it&apos;s actually used within the hero, rather than an
          unrelated or invented design system.
        </CaseStudyBody>
        {/* Native 5680x4352 - a single wide panel, not a 2-up grid, so the
            full colour and typography sheet stays legible. */}
        <MediaPlaceholder
          tone="dark"
          aspect="aspect-[5680/4352]"
          image="/dataassist-typography-colors.webp"
          imageAlt="DataAssist typography and colour system"
        />
      </CaseStudySlide>

      <CaseStudySlide {...slide(3, { eyebrow: 'Brand mark', tone: 'light' })}>
        <CaseStudyHeadline>A brand that holds up off-screen too.</CaseStudyHeadline>
        <CaseStudyBody>
          The DataAssist mark and card carry the same identity — citron, dark olive charcoal, and Poppins — into a
          physical presentation.
        </CaseStudyBody>
        {/* Native 5580x3936. */}
        <MediaPlaceholder
          aspect="aspect-[5580/3936]"
          image="/dataassist-business-card.webp"
          imageAlt="DataAssist logo on a business card mockup"
        />
      </CaseStudySlide>

      <CaseStudySlide {...slide(4, { eyebrow: 'Feature spotlight', tone: 'tint' })}>
        <CaseStudyHeadline tone="tint">Stay informed. Act faster.</CaseStudyHeadline>
        <CaseStudyBody tone="tint">
          DataAssist surfaces the moments that matter on its own — flagging a conversion dip or a revenue jump the
          instant it's detected, so the next action is obvious on any screen.
        </CaseStudyBody>
        {/* Native 5680x5276. */}
        <MediaPlaceholder
          tone="tint"
          aspect="aspect-[5680/5276]"
          image="/dataassist-feature-spotlight.webp"
          imageAlt="DataAssist's attention-area alert, surfaced on mobile and shown as a standalone card"
        />
      </CaseStudySlide>

      <CaseStudySlide {...slide(5, { eyebrow: 'Reflection', tone: 'dark' })}>
        <CaseStudyHeadline tone="dark">Shaping a first impression.</CaseStudyHeadline>
        <CaseStudyBody tone="dark">
          The project explores how brand identity, content hierarchy, and product presentation work together to
          shape the first impression of an AI-powered SaaS experience.
        </CaseStudyBody>
        {/* Native 1536x1024 (3:2). */}
        <MediaPlaceholder
          tone="dark"
          aspect="aspect-[1536/1024]"
          image="/dataassist-hero-device-mockup-dark.webp"
          imageAlt="DataAssist hero design shown on laptop and phone, closing composition"
        />
      </CaseStudySlide>

      <CaseStudySlide {...slide(6, { eyebrow: 'Next project', tone: 'sky', className: 'text-center' })}>
        <div className="mx-auto max-w-md">
          <CaseStudyHeadline tone="sky">Explore another case study</CaseStudyHeadline>
          <NextProjectCard
            title="Bhoomi Foundation"
            description="A smart waste-management platform, rebuilt for an entire city."
            href="/work/bhoomi"
            image="/bhoomi.webp"
            imageAlt="Bhoomi Foundation smart waste-management platform: collection truck, bins and admin dashboard"
          />
        </div>
      </CaseStudySlide>
    </>
  )

  return (
    <div className="case-study-page">
      <BackBar />
      <BehanceLink href={behanceHref} />
      {!reduce && <ProgressRail count={SLIDE_COUNT} active={activeIndex} onSelect={goTo} />}

      <div
        ref={containerRef}
        className={reduce ? 'relative' : 'relative h-screen overflow-hidden overscroll-contain'}
      >
        {slides}
      </div>
    </div>
  )
}
