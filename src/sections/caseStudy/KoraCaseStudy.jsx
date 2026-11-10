// src/sections/caseStudy/KoraCaseStudy.jsx
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

// Same light, light, dark rhythm as SchooliAT and Bhoomi: dark lands on
// "The design direction" and "Outcome and reflection" - the same two roles
// dark slides play across every case study on this site, each flanked by
// light slides on both sides rather than sitting on its own.
const SLIDE_COUNT = 11

const behanceHref = work.find((item) => item.id === '03')?.behanceHref

export default function KoraCaseStudy() {
  const { containerRef, index: activeIndex, reduce, goTo } = usePaginatedSlides(SLIDE_COUNT)

  const slide = (index, props) => ({ index, activeIndex, reduce, ...props })

  const slides = (
    <>
      <CaseStudySlide {...slide(0, { eyebrow: 'Project introduction', tone: 'tint' })}>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-deep">Kora</p>
        <CaseStudyHeadline tone="tint">Your health records, all in one place.</CaseStudyHeadline>
        <CaseStudyBody tone="tint">
          A personal healthcare records app concept designed to make health information easier to organise,
          access, and manage.
        </CaseStudyBody>
        <CaseStudyMeta
          tone="tint"
          items={[
            { label: 'Role', value: 'UI/UX Designer' },
            { label: 'Platform', value: 'Mobile app' },
            { label: 'Domain', value: 'Healthcare' },
          ]}
        />
        <MediaPlaceholder tone="tint" aspect="aspect-[3/2]" image="/kora.webp" imageAlt="Kora mobile app shown on a phone" />
      </CaseStudySlide>

      <CaseStudySlide {...slide(1, { eyebrow: 'The problem', tone: 'light' })}>
        <CaseStudyHeadline>Health information shouldn&apos;t feel scattered.</CaseStudyHeadline>
        <CaseStudyBody>
          {[
            'Medical reports, prescriptions, and other health documents can be stored in different places. Finding the right information when it is needed can become difficult.',
            'Kora explores a mobile-first way to bring personal health information into a more organised and accessible experience.',
          ]}
        </CaseStudyBody>
        {/* Native 941x1672 (portrait, ~9:16) - aspect-[3/4] would crop
            top/bottom under object-cover. */}
        <MediaPlaceholder
          aspect="aspect-[941/1672]"
          image="/kora-problem-visual.webp"
          imageAlt="Scattered health documents contrasted with a more organised Kora mobile screen"
        />
      </CaseStudySlide>

      {/* Dark here (and again at the outcome) is the same deliberate
          rhythm used on every case study on this site: each dark beat
          sits with light slides on both sides of it. */}
      <CaseStudySlide {...slide(2, { eyebrow: 'The design direction', tone: 'dark' })}>
        <CaseStudyHeadline tone="dark">A calmer, clearer healthcare experience.</CaseStudyHeadline>
        <CaseStudyBody tone="dark">
          The interface direction focuses on clear information hierarchy, easy navigation, and a reassuring
          visual language. The goal is to help users understand where their health information belongs and how
          to access it.
        </CaseStudyBody>

        <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
          <div>
            <h3 className="font-serif text-lg font-bold text-ink">Clear hierarchy</h3>
            <p className="mt-1 text-ink/70">Organised content and readable mobile layouts.</p>
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-ink">Simple navigation</h3>
            <p className="mt-1 text-ink/70">A predictable way to move between key app areas.</p>
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-ink">Accessible records</h3>
            <p className="mt-1 text-ink/70">Health documents presented in a structured way.</p>
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-ink">Privacy in mind</h3>
            <p className="mt-1 text-ink/70">Considered handling of sensitive personal information.</p>
          </div>
        </div>

        {/* Native 1672x941 (landscape, ~16:9) - matches aspect-video closely
            enough on its own, but given exactly to avoid any crop. */}
        <MediaPlaceholder
          tone="dark"
          aspect="aspect-[1672/941]"
          image="/kora-mobile-ui-kit.webp"
          imageAlt="Kora mobile UI kit: typography, colours, buttons, form fields, cards and icons"
        />
      </CaseStudySlide>

      <CaseStudySlide {...slide(3, { eyebrow: 'Structuring the experience', tone: 'light' })}>
        <CaseStudyHeadline>Designed around everyday mobile use.</CaseStudyHeadline>
        <CaseStudyBody>
          The app&apos;s information architecture makes its main areas easy to discover and use on a phone — how
          users move between the main screen and the relevant health-information flows.
        </CaseStudyBody>
        {/* Native 586x1078 (portrait screen recording) - aspect-[16/9]
            would crop its sides under object-cover. */}
        <MediaPlaceholder
          aspect="aspect-[586/1078]"
          video="/kora-mobile-flow.mp4"
          imageAlt="Kora mobile navigation and a key task flow"
        />
      </CaseStudySlide>

      <CaseStudySlide {...slide(4, { eyebrow: 'The mobile interface — home', tone: 'tint' })}>
        <CaseStudyHeadline tone="tint">Key screens, designed as one experience.</CaseStudyHeadline>
        <CaseStudyBody tone="tint">
          A central mobile view brings the most relevant health information and key app areas into one accessible
          place.
        </CaseStudyBody>
        {/* Native 941x1672 (portrait, ~9:16). */}
        <MediaPlaceholder
          tone="tint"
          aspect="aspect-[941/1672]"
          image="/kora-home-screen.webp"
          imageAlt="Kora home screen, inside a phone mockup"
        />
      </CaseStudySlide>

      <CaseStudySlide {...slide(5, { eyebrow: 'The mobile interface — records', tone: 'light' })}>
        <CaseStudyHeadline>A structured way to browse health records.</CaseStudyHeadline>
        <CaseStudyBody>
          A structured records experience helps users browse their health documents and access relevant
          information.
        </CaseStudyBody>
        {/* Native 606x1078 (portrait screen recording). */}
        <MediaPlaceholder
          aspect="aspect-[606/1078]"
          video="/kora-health-records.mp4"
          imageAlt="Browsing and viewing health records in Kora"
        />
      </CaseStudySlide>

      <CaseStudySlide {...slide(6, { eyebrow: 'The mobile interface — a supporting flow', tone: 'tint' })}>
        <CaseStudyHeadline tone="tint">One task, without unnecessary navigation.</CaseStudyHeadline>
        <CaseStudyBody tone="tint">
          A dedicated flow helps users complete a specific task without unnecessary navigation — medicines,
          appointments, adding a record, or managing access.
        </CaseStudyBody>
        {/* Native 1024x1536 (2:3 portrait). */}
        <MediaPlaceholder
          tone="tint"
          aspect="aspect-[1024/1536]"
          image="/kora-supporting-flow.webp"
          imageAlt="A supporting Kora mobile flow"
        />
      </CaseStudySlide>

      <CaseStudySlide {...slide(7, { eyebrow: 'A considered approach to privacy', tone: 'light' })}>
        <CaseStudyHeadline>Personal health information deserves care.</CaseStudyHeadline>
        <CaseStudyBody>
          Privacy is an important consideration when designing a personal healthcare app. The interface makes
          relevant access or sharing options understandable, and keeps sensitive information easy to distinguish
          from general app content.
        </CaseStudyBody>
        {/* Native 1024x1536 (2:3 portrait). */}
        <MediaPlaceholder
          aspect="aspect-[1024/1536]"
          image="/kora-privacy-screens.webp"
          imageAlt="Kora privacy and account screens"
        />
      </CaseStudySlide>

      <CaseStudySlide {...slide(8, { eyebrow: 'The UX process', tone: 'tint' })}>
        <CaseStudyHeadline tone="tint">From discovery to validation.</CaseStudyHeadline>
        <CaseStudyBody tone="tint">
          Five stages shaped Kora from the first research conversation to a validated prototype: discovering how
          people actually manage medical records today, defining the core problem and goals, structuring the
          information architecture, designing the calm, card-based interface, and validating the key flows through
          prototyping.
        </CaseStudyBody>
        {/* Native 870x1808 (portrait). */}
        <MediaPlaceholder
          tone="tint"
          aspect="aspect-[870/1808]"
          image="/kora-ux-roadmap.webp"
          imageAlt="Kora's UX process: Discover, Define, Structure, Design, Validate"
        />
      </CaseStudySlide>

      <CaseStudySlide {...slide(9, { eyebrow: 'Outcome and reflection', tone: 'dark' })}>
        <CaseStudyHeadline tone="dark">Making personal health information feel more manageable.</CaseStudyHeadline>
        <CaseStudyBody tone="dark">
          Kora explores how a mobile-first healthcare experience can bring health records and related information
          into a clearer, more organised interface. The design focuses on accessible navigation, readable
          information, and thoughtful treatment of sensitive personal data.
        </CaseStudyBody>
        {/* Native 1024x1536 (2:3 portrait). */}
        <MediaPlaceholder
          tone="dark"
          aspect="aspect-[1024/1536]"
          image="/kora-final-composition.webp"
          imageAlt="Final composition of the strongest Kora mobile screens"
        />
      </CaseStudySlide>

      <CaseStudySlide {...slide(10, { eyebrow: 'Next project', tone: 'sky', className: 'text-center' })}>
        <div className="mx-auto max-w-md">
          <CaseStudyHeadline tone="sky">Explore another case study</CaseStudyHeadline>
          <NextProjectCard
            title="DataAssist"
            description="Designing an AI-powered experience for web and mobile."
            href="/work/dataassist"
            image="/dataassist-hero-laptop-phone.webp"
            imageAlt="DataAssist hero design shown on laptop and phone"
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
