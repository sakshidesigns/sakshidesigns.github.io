// src/sections/caseStudy/CaseStudy.jsx
// Looks up a case-study page by slug. Any slug without an entry here gets a
// plain "not ready yet" panel with a way back, rather than a blank page.
import { BackBar } from './CaseStudyKit'
import BhoomiCaseStudy from './BhoomiCaseStudy'
import DataAssistCaseStudy from './DataAssistCaseStudy'
import KoraCaseStudy from './KoraCaseStudy'
import SchooliatCaseStudy from './SchooliatCaseStudy'

const CASE_STUDIES = {
  bhoomi: BhoomiCaseStudy,
  dataassist: DataAssistCaseStudy,
  kora: KoraCaseStudy,
  schooliat: SchooliatCaseStudy,
}

export default function CaseStudy({ slug }) {
  const Page = CASE_STUDIES[slug]

  if (!Page) {
    return (
      <div className="case-study-page flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
        <BackBar />
        <p className="font-serif text-2xl font-bold text-ink">This case study isn&apos;t published yet.</p>
        <a href="/#work" className="mt-4 text-sm font-semibold text-brand-deep underline">
          Back to work
        </a>
      </div>
    )
  }

  return <Page />
}
