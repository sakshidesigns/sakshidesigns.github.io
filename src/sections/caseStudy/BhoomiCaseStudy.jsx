// src/sections/caseStudy/BhoomiCaseStudy.jsx
// Rebuilt from the real product screenshots/recordings supplied for this
// page: an admin dashboard for a city-wide smart waste-management platform
// (Overview, Areas, Vehicles, Complaints, live GPS tracking of collection
// routes) - not the marketing-website redesign this page was first written
// around, before any real assets existed to check that framing against.
import {
  BackBar,
  CaseStudyBody,
  CaseStudyHeadline,
  CaseStudyList,
  CaseStudyMeta,
  CaseStudySlide,
  MediaPlaceholder,
  NextProjectCard,
  ProgressRail,
  usePaginatedSlides,
} from './CaseStudyKit'

// Same rhythm as SchooliAT: dark slides are a deliberate beat, not evenly
// spaced for its own sake - one on "Design direction" (a pivot), one on
// "The outcome" (the close), each with light slides on both sides.
const SLIDE_COUNT = 9

export default function BhoomiCaseStudy() {
  const { containerRef, index: activeIndex, reduce, goTo } = usePaginatedSlides(SLIDE_COUNT)

  const slide = (index, props) => ({ index, activeIndex, reduce, ...props })

  const slides = (
    <>
      <CaseStudySlide {...slide(0, { eyebrow: 'Project introduction', tone: 'tint' })}>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-deep">Bhoomi Foundation</p>
        <CaseStudyHeadline tone="tint">Smart waste management, rebuilt for an entire city.</CaseStudyHeadline>
        <CaseStudyBody tone="tint">
          End-to-end UX for Bhoomi Foundation&apos;s government-affiliated smart waste-management platform —
          RFID-tracked collection fleets, a citizen complaints app, and an admin dashboard for running city-wide
          operations from one place.
        </CaseStudyBody>
        <CaseStudyMeta
          tone="tint"
          items={[
            { label: 'Role', value: 'UI/UX Designer' },
            { label: 'Scope', value: 'End-to-end UX/UI' },
            { label: 'Platform', value: 'Web' },
            { label: 'Domain', value: 'Civic-Tech · Admin Dashboards' },
          ]}
        />
        {/* The original work-card mockup (truck, bins, dashboard composite)
            stays here untouched - it's the established hero image for this
            project and isn't being swapped for the newer dashboard-only
            screenshots used further down the page. */}
        <MediaPlaceholder
          tone="tint"
          aspect="aspect-[1670/942]"
          image="/bhoomi.webp"
          imageAlt="Bhoomi Foundation smart waste-management platform: collection truck, bins and admin dashboard"
        />
      </CaseStudySlide>

      <CaseStudySlide {...slide(1, { eyebrow: 'The problem', tone: 'light' })}>
        <CaseStudyHeadline>One city. Fleets, areas and complaints, with no shared view.</CaseStudyHeadline>
        <CaseStudyBody>
          {[
            'Running waste collection across an entire city means coordinating vehicles, drivers, collection areas and citizen complaints at once — and doing it reliably, every day.',
            "Without a shared, real-time view of that operation, it's hard to know which vehicles are active, which areas have been covered, or which complaints are still open.",
            'This was a redesign of the existing admin dashboard, rebuilding it into one connected platform rather than a set of disconnected tools.',
          ]}
        </CaseStudyBody>

        <p className="mt-10 text-xs font-semibold uppercase tracking-[0.2em] text-ink/45">Before → after</p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-semibold text-ink/70">Original dashboard</p>
            {/* Native 1280x594 (~2.15:1) is a lot wider than this 4:3 box -
                kept at 4:3 to stay a matched pair with the redesign next to
                it, with fit="contain" so the screenshot isn't cropped down
                to the box's narrower shape, and a butter-yellow backdrop
                filling the letterboxing that leaves top and bottom. */}
            <MediaPlaceholder
              aspect="aspect-[4/3]"
              image="/bhoomi-original-dashboard.webp"
              imageAlt="The admin dashboard before the redesign"
              fit="contain"
              className="mt-0 bg-amber-100"
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-ink/70">Redesigned dashboard</p>
            {/* mt-0, matching the "before" cell - MediaPlaceholder's
                default mt-10 would otherwise start this one 40px further
                down than its sibling, so the two don't line up as a pair
                even though the boxes themselves are the same size. */}
            <MediaPlaceholder
              aspect="aspect-[4/3]"
              image="/bhoomi-dashboard.webp"
              imageAlt="Redesigned Bhoomi Foundation admin dashboard overview"
              className="mt-0"
            />
          </div>
        </div>
      </CaseStudySlide>

      {/* Dark here (and again at the outcome) is the same deliberate rhythm
          used across SchooliAT and this page's other slides: each dark
          beat sits with light slides on both sides of it, rather than one
          dark page dropped in on its own. */}
      <CaseStudySlide {...slide(2, { eyebrow: 'The design direction', tone: 'dark' })}>
        <CaseStudyHeadline tone="dark">One dashboard. Every part of the operation.</CaseStudyHeadline>
        <CaseStudyBody tone="dark">
          {[
            'The design direction was to organise a genuinely large operation — employees, vehicles, tags, areas, complaints, routes — into one dashboard that stays legible rather than overwhelming.',
            'A persistent sidebar keeps every module one click away; overview cards surface the numbers that matter first, with the detail underneath for anyone who needs to go further.',
            'Access is role-based — a Super Admin sees the full platform, while other roles see only what their work requires.',
          ]}
        </CaseStudyBody>
        <MediaPlaceholder
          tone="dark"
          aspect="aspect-[1452/1083]"
          image="/bhoomi-structure.webp"
          imageAlt="Annotated breakdown of the dashboard's structure: sidebar navigation, page title, top bar, overview cards, recent activity, tag activity, and the waste-collection and complaints charts"
        />
      </CaseStudySlide>

      <CaseStudySlide {...slide(3, { eyebrow: 'My contribution', tone: 'light' })}>
        <CaseStudyHeadline>From a dense operation to a usable interface.</CaseStudyHeadline>
        <CaseStudyBody>
          I designed the dashboard end to end, translating a large, multi-part civic operation into screens that
          stay clear under real daily use.
        </CaseStudyBody>
        <CaseStudyList
          items={[
            'Overview dashboard — key metrics and activity at a glance, for the person running the operation',
            'Operational data tables — areas, vehicles and complaints, built for searching, filtering and quick action',
            'Live route tracking — a real-time map of collection vehicles, drivers and routes in progress',
            'Role-based access — a Super Admin view and scoped views for other roles across the platform',
          ]}
        />
        <MediaPlaceholder
          video="/bhoomi-route-annotated.mp4"
          imageAlt="Annotated walkthrough of the Planned Route screen: route overview, map controls, and route list and filters"
        />
      </CaseStudySlide>

      <CaseStudySlide {...slide(4, { eyebrow: 'Core screens — the dashboard', tone: 'tint' })}>
        <CaseStudyHeadline tone="tint">A command centre for the whole operation.</CaseStudyHeadline>
        <CaseStudyBody tone="tint">
          Total employees, vehicles, tags and areas, alongside recent activity, tag activity, and a live read on
          waste collection and open complaints — the first thing anyone running the platform sees.
        </CaseStudyBody>
        {/* Same aspect box on both cells so the two sit side by side as a
            matched pair rather than two different-sized boxes - but the
            screenshot's own ratio (~4:3) is noticeably narrower than the
            video's 16:9, and object-cover's default crop was trimming real
            dashboard content off its top and bottom to fill that shape.
            fit="contain" keeps the whole screenshot intact instead,
            letterboxed left/right within the box; the dark green backdrop
            fills that letterboxing rather than leaving it blank. */}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MediaPlaceholder
            aspect="aspect-video"
            image="/bhoomi-dashboard.webp"
            imageAlt="Bhoomi Foundation admin dashboard overview"
            fit="contain"
            className="mt-0 bg-emerald-950"
          />
          {/* mt-0, matching the dashboard cell beside it - same reason as
              slide 01's pair. */}
          <MediaPlaceholder
            tone="tint"
            aspect="aspect-video"
            video="/bhoomi-dashboard-walkthrough.mp4"
            imageAlt="Scrolling through the dashboard overview, from the summary cards down to the waste-collection and complaints charts"
            className="mt-0"
          />
        </div>
      </CaseStudySlide>

      <CaseStudySlide {...slide(5, { eyebrow: 'Core screens — operations', tone: 'light' })}>
        <CaseStudyHeadline>Areas, vehicles and complaints, built for daily use.</CaseStudyHeadline>
        <CaseStudyBody>
          Underneath the overview sit the tables the operations team actually works from every day — searchable,
          filterable, and built to stay usable at city scale.
        </CaseStudyBody>
        {/* Three screenshots used to sit in one row of three equal columns,
            which left each one too small to read clearly for how dense
            these tables are. Area management and Complaints keep that
            side-by-side pairing; Vehicle details drops to a full-width row
            below, at roughly double the size, so it actually fills and
            reads well instead of matching the other two down to their
            cramped width. */}
        <div className="mt-10 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-semibold text-ink/70">Area management</p>
              <MediaPlaceholder aspect="aspect-[5760/4080]" image="/bhoomi-areas.webp" imageAlt="Area management table: assigned vehicles, drivers, helpers and status per collection area" className="mt-0" />
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-ink/70">Complaints</p>
              <MediaPlaceholder aspect="aspect-[5760/4080]" image="/bhoomi-complaints.webp" imageAlt="Complaints list: citizen, area, priority, status and assignment, with photo evidence" className="mt-0" />
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-ink/70">Vehicle details</p>
            <MediaPlaceholder aspect="aspect-[5760/4080]" image="/bhoomi-vehicles.webp" imageAlt="Vehicle details panel: vehicle number, RFID/QR tag, API ID and last known location" className="mt-0" />
          </div>
        </div>
      </CaseStudySlide>

      <CaseStudySlide {...slide(6, { eyebrow: 'Core screens — live tracking', tone: 'tint' })}>
        <CaseStudyHeadline tone="tint">Knowing where every vehicle is, in real time.</CaseStudyHeadline>
        <CaseStudyBody tone="tint">
          At the centre of a smart waste-management platform is visibility: a live map of each collection
          vehicle&apos;s route, its driver and helper, and its progress through the day&apos;s stops.
        </CaseStudyBody>
        <MediaPlaceholder
          tone="tint"
          video="/bhoomi-live-tracking.mp4"
          imageAlt="Live tracking map: a collection vehicle's real-time position, route, driver and helper"
        />
      </CaseStudySlide>

      <CaseStudySlide {...slide(7, { eyebrow: 'The outcome', tone: 'dark' })}>
        <CaseStudyHeadline tone="dark">A single dashboard running a city-wide operation.</CaseStudyHeadline>
        <CaseStudyBody tone="dark">
          {[
            'The redesigned dashboard brings fleet tracking, area management, complaints and reporting into one connected platform for Bhoomi Foundation.',
            'This project extended my experience designing dense, operational interfaces — making a genuinely large civic-tech system usable for the people running it every day.',
          ]}
        </CaseStudyBody>
        <MediaPlaceholder
          tone="dark"
          video="/bhoomi-full-walkthrough.mp4"
          imageAlt="Full walkthrough of the redesigned Bhoomi Foundation dashboard"
        />
      </CaseStudySlide>

      <CaseStudySlide {...slide(8, { eyebrow: 'Next project', tone: 'sky', className: 'text-center' })}>
        <div className="mx-auto max-w-md">
          <CaseStudyHeadline tone="sky">Explore another case study</CaseStudyHeadline>
          <NextProjectCard
            title="SchooliAT"
            description="A connected experience for modern school management."
            href="/work/schooliat"
            image="/schooliat.webp"
            imageAlt="SchooliAT desktop dashboard and mobile app screens"
          />
        </div>
      </CaseStudySlide>
    </>
  )

  return (
    <div className="case-study-page">
      <BackBar />
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
