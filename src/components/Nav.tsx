// src/components/Nav.tsx
export function Nav() {
  return (
    <nav className="site-nav" aria-label="Primary">
      <a href="#work" data-cursor-hover>
        Work
      </a>
      <a href="#about" data-cursor-hover>
        About
      </a>
      <a href="#experience" data-cursor-hover>
        Experience
      </a>
      <a href="#contact" data-cursor-hover>
        Contact
      </a>
    </nav>
  );
}
