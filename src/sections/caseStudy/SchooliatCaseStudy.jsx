// src/sections/caseStudy/SchooliatCaseStudy.jsx
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

const SLIDE_COUNT = 8 // 00-06 plus the closing "next project" panel

export default function SchooliatCaseStudy() {
  const { containerRef, index: activeIndex, reduce, goTo } = usePaginatedSlides(SLIDE_COUNT)

  const slide = (index, props) => ({ index, activeIndex, reduce, ...props })

  const slides = (
    <>
      <CaseStudySlide {...slide(0, { eyebrow: 'Project introduction', tone: 'tint' })}>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-deep">SchooliAT</p>
        <CaseStudyHeadline tone="tint">A connected experience for modern school management.</CaseStudyHeadline>
        <CaseStudyBody tone="tint">
          Behind every school is a system of people, responsibilities and everyday operations. SchooliAT brings
          these moving parts together through a multi-tenant school management platform designed for web and
          mobile.
        </CaseStudyBody>
        <CaseStudyMeta
          tone="tint"
          items={[
            { label: 'Role', value: 'UI/UX Designer' },
            { label: 'Scope', value: 'End-to-end UX/UI' },
            { label: 'Platform', value: 'Web & Mobile' },
            { label: 'Domain', value: 'Education · SaaS' },
          ]}
        />
        {/* schooliat.webp is 1536x1024 (3:2) - aspect-video (16:9) would
            crop its top/bottom under object-cover, so the box matches the
            image's own ratio instead. */}
        <MediaPlaceholder
          tone="tint"
          aspect="aspect-[3/2]"
          image="/schooliat.webp"
          imageAlt="SchooliAT desktop dashboard and mobile app screens"
        />
      </CaseStudySlide>

      <CaseStudySlide {...slide(1, { eyebrow: 'The challenge', tone: 'light' })}>
        <CaseStudyHeadline>One school. Many moving parts.</CaseStudyHeadline>
        <CaseStudyBody>
          {[
            'Running a school involves much more than managing student records. Administration, attendance, fees, staff, timetables and classroom activities all form part of a larger operational system.',
            'Different people interact with different parts of that system, each with their own responsibilities.',
            'The challenge was to bring these experiences together without making everyday school operations feel more complicated.',
          ]}
        </CaseStudyBody>
        <MediaPlaceholder
          image="/schooliat-fragmented-workflow.webp"
          imageAlt="Fragmented school management workflow: scattered spreadsheets, WhatsApp, paper forms and manual reports across roles"
        />
      </CaseStudySlide>

      {/* Dark here (and again at the "outcome" slide below) is deliberate
          rhythm, not random variety: each dark beat sits with a light slide
          on either side of it (1 -> 2 -> 3 and 5 -> 6 -> 7), so scrolling
          through the case study alternates in a repeating light, light,
          dark pattern instead of staying on one tone too long. */}
      <CaseStudySlide {...slide(2, { eyebrow: 'The design direction', tone: 'dark' })}>
        <CaseStudyHeadline tone="dark">Different roles. Different priorities.</CaseStudyHeadline>
        <CaseStudyBody tone="dark">
          {[
            'A school administrator needs a clear view of operations. A teacher needs access to classroom-related tasks. A student needs relevant academic information.',
            'Treating every user the same would overlook these differences.',
            'The design direction was to organise the experience around user roles, making each interface relevant to the person using it while keeping the overall platform connected.',
          ]}
        </CaseStudyBody>
        {/* Native 1932x814 (~2.37:1) - wider than aspect-video, so the
            default box would crop its left/right edges under object-cover. */}
        <MediaPlaceholder
          tone="dark"
          aspect="aspect-[1932/814]"
          video="/schooliat-role-map.mp4"
          imageAlt="SchooliAT role-based experience map: Super Admin, School Admin, Teacher and Student journeys"
        />
      </CaseStudySlide>

      <CaseStudySlide {...slide(3, { eyebrow: 'My contribution', tone: 'light' })}>
        <CaseStudyHeadline>From workflows to interfaces.</CaseStudyHeadline>
        <CaseStudyBody>
          I worked across the SchooliAT ecosystem, designing experiences for different users and touchpoints. My
          contribution covered:
        </CaseStudyBody>
        <CaseStudyList
          items={[
            'Super-admin portal — platform-level management experience',
            'School-admin portal — school operations and administration',
            'Teacher portal — teacher-facing workflows',
            'Student portal — student-facing experience',
            'Admin mobile app — administrative tasks on mobile',
          ]}
        />
        <CaseStudyBody>
          The focus was to create distinct experiences for each role while maintaining consistency across the
          wider product.
        </CaseStudyBody>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Native 1280x720 (16:9), in a 4:3 box so this cell's height
              matches the mobile-app cell beside it instead of sizing to
              its own native (and shorter) ratio. fit="contain" keeps the
              recording uncropped - letterboxed top/bottom instead - with a
              light peach backdrop filling that space. */}
          <MediaPlaceholder
            aspect="aspect-[4/3]"
            video="/schooliat-admin-dashboard.mp4"
            imageAlt="SchooliAT web admin and super-admin portal"
            fit="contain"
            className="mt-10 bg-orange-50"
          />
          {/* There's no separate admin mobile app to record - the admin
              and school-admin apps share the same login screen, so that
              recording stands in here. This is the polished version: a
              clean phone mockup (device + soft decorative circles) already
              composed on its own pale-yellow backdrop, native 1080x1350
              (4:5) - a lot narrower than this 4:3 box. fit="contain" keeps
              it uncropped, letterboxed left/right; the box's own backdrop
              is matched to the mockup's own background colour (#f4efbc) so
              that letterboxing reads as a continuation of it rather than a
              visible seam. */}
          <MediaPlaceholder
            aspect="aspect-[4/3]"
            video="/schooliat-mobile-login-clean.mp4"
            imageAlt="SchooliAT mobile app login screen, shared by the admin and school-admin apps"
            fit="contain"
            className="mt-10 bg-[#f4efbc]"
          />
          {/* Portrait phone recordings, native 1080x1350 (4:5) - a 4:3 box
              would crop top/bottom under object-cover. The student-portal
              recording (next cell) already has soft decorative circles
              built into its own background, matching the mobile-login
              mockup above it; this teacher-portal one is a plain pale-blue
              gradient with nothing added, so the grid read unevenly - a
              few circles in the same soft style, in blue tones to match
              this recording's own backdrop, laid over the margins around
              the phone (not the device itself) bring it in line with its
              neighbours. */}
          <div className="relative mt-10">
            <MediaPlaceholder
              aspect="aspect-[4/5]"
              video="/schooliat-teacher-portal.mp4"
              imageAlt="SchooliAT teacher portal mobile app"
              className="mt-0"
            />
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
              <span className="absolute left-[3%] top-[6%] h-[16%] w-[16%] rounded-full bg-sky-200/70" />
              <span className="absolute right-[10%] top-[4%] h-[3%] w-[3%] rounded-full bg-white/80" />
              <span className="absolute -right-[6%] bottom-[8%] h-[22%] w-[22%] rounded-full bg-blue-200/60" />
              <span className="absolute left-[4%] bottom-[18%] h-[2%] w-[9%] rounded-full bg-sky-100/80" />
            </div>
          </div>
          <MediaPlaceholder
            aspect="aspect-[4/5]"
            video="/schooliat-student-portal.mp4"
            imageAlt="SchooliAT student portal mobile app"
          />
        </div>
      </CaseStudySlide>

      <CaseStudySlide {...slide(4, { eyebrow: 'Inside the experience', tone: 'tint' })}>
        <CaseStudyHeadline tone="tint">Designed for the work people do every day.</CaseStudyHeadline>
        <CaseStudyBody tone="tint">Each portal serves a different purpose within the same school management ecosystem.</CaseStudyBody>

        <div className="mt-10 space-y-8">
          <div>
            <h3 className="font-serif text-xl font-bold text-ink">School administration</h3>
            <p className="mt-2 max-w-2xl text-ink/70">
              A central interface for managing school operations and administrative information.
            </p>
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-ink">Teacher experience</h3>
            <p className="mt-2 max-w-2xl text-ink/70">
              A dedicated space for teacher-related activities and student workflows.
            </p>
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-ink">Student experience</h3>
            <p className="mt-2 max-w-2xl text-ink/70">
              An interface focused on student-facing academic information and services.
            </p>
          </div>
        </div>

        <div className="mt-10 space-y-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/45">01 — Admin dashboard</p>
            <MediaPlaceholder
              tone="tint"
              video="/schooliat-admin-dashboard.mp4"
              imageAlt="School administration dashboard walkthrough"
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/45">
              02 — Teacher &amp; student portals
            </p>
            {/* Native 1600x1300 - narrower than aspect-video, so the box
                matches its own ratio instead of cropping top/bottom. */}
            <MediaPlaceholder
              tone="tint"
              aspect="aspect-[1600/1300]"
              image="/schooliat-student-teacher.webp"
              imageAlt="SchooliAT student and teacher portal side by side"
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/45">03 — Product walkthrough</p>
            <MediaPlaceholder
              tone="tint"
              video="/schooliat-role-flow.mp4"
              imageAlt="SchooliAT product walkthrough: Super Admin to School Admin to Teacher to Student"
            />
          </div>
        </div>
      </CaseStudySlide>

      <CaseStudySlide {...slide(5, { eyebrow: 'The connected system', tone: 'light' })}>
        <CaseStudyHeadline>One platform. Multiple perspectives.</CaseStudyHeadline>
        <CaseStudyBody>
          {[
            'SchooliAT brings different user experiences together within a shared school management ecosystem.',
            "Rather than forcing every user into the same interface, the platform separates experiences by responsibility while serving a common purpose: making school-related operations accessible through one connected product.",
          ]}
        </CaseStudyBody>
        {/* Native 1536x1024 (3:2) - aspect-video would crop top/bottom. */}
        <MediaPlaceholder
          aspect="aspect-[3/2]"
          image="/schooliat-ecosystem.webp"
          imageAlt="SchooliAT role-based ecosystem connecting Student, Teacher and Admin portals"
        />
      </CaseStudySlide>

      <CaseStudySlide {...slide(6, { eyebrow: 'The outcome', tone: 'dark' })}>
        <CaseStudyHeadline tone="dark">Designed beyond the concept.</CaseStudyHeadline>
        <CaseStudyBody tone="dark">
          {[
            'SchooliAT extended my experience in designing complex, multi-role SaaS products — balancing different user needs within one connected system.',
            'The admin and super-admin portals are live in production, bringing the platform’s core administrative experiences into use.',
            'For me, this project was about more than designing individual screens. It was about shaping a connected experience across roles, workflows and devices.',
          ]}
        </CaseStudyBody>
        {/* Native 1536x1024 (3:2) - aspect-video would crop top/bottom. */}
        <MediaPlaceholder
          tone="dark"
          aspect="aspect-[3/2]"
          image="/schooliat-closing.webp"
          imageAlt="SchooliAT closing composition: one platform, a stronger school community"
        />
      </CaseStudySlide>

      <CaseStudySlide {...slide(7, { eyebrow: 'Next project', tone: 'sky', className: 'text-center' })}>
        <div className="mx-auto max-w-md">
          <CaseStudyHeadline tone="sky">Explore another case study</CaseStudyHeadline>
          <NextProjectCard
            title="Kora"
            description="A personal healthcare records app, designed from zero to one."
            href="/work/kora"
            image="/kora-card-crop.webp"
            imageAlt="Kora mobile app shown on a phone, holding a patient bill"
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
