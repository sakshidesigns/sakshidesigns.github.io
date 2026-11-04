// src/components/HeroContent.tsx
export function HeroContent() {
  return (
    <div className="hero-content">
      <p className="hero-greeting">Hi, I&apos;m</p>
      <h1 className="hero-name">Sakshi Haste</h1>
      <p className="hero-role">UI/UX &amp; Product Designer</p>
      <p className="hero-bio">
        Designing clear, thoughtful digital experiences across product, UX and visual design.
      </p>
      <div className="hero-actions">
        <a className="pill pill-solid" href="/resume.pdf" target="_blank" rel="noreferrer" data-cursor-hover>
          Resume <span aria-hidden="true">→</span>
        </a>
        <a className="pill pill-outline" href="#contact" data-cursor-hover>
          Let&apos;s Talk
        </a>
      </div>
    </div>
  );
}
