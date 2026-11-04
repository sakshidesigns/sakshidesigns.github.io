// src/components/SummaryCards.tsx
import type { ReactElement } from "react";

type Card = {
  id: "focus" | "location" | "experience" | "craft";
  label: string;
  value: string;
  detail?: string;
  icon: ReactElement;
};

const iconProps = {
  width: 26,
  height: 26,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const CARDS: Card[] = [
  {
    id: "focus",
    label: "Currently focused on",
    value: "AI-powered experiences",
    icon: (
      <svg {...iconProps}>
        <rect x="4" y="5" width="16" height="11" rx="1.5" />
        <path d="M2 19h20" />
      </svg>
    ),
  },
  {
    id: "location",
    label: "Based in",
    value: "Pune, India",
    icon: (
      <svg {...iconProps}>
        <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
        <circle cx="12" cy="10" r="2.3" />
      </svg>
    ),
  },
  {
    id: "experience",
    label: "Experience",
    value: "3+ Years",
    detail: "AI products, SaaS and digital platforms",
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 13h18" />
      </svg>
    ),
  },
  {
    id: "craft",
    label: "What I do",
    value: "Simplify complex workflows",
    icon: (
      <svg {...iconProps}>
        <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" />
      </svg>
    ),
  },
];

export function SummaryCards() {
  return (
    <ul className="summary-cards" aria-label="Summary">
      {CARDS.map((card) => (
        <li key={card.id} className={`summary-card summary-card-${card.id}`}>
          <span className="summary-card-icon" aria-hidden="true">
            {card.icon}
          </span>
          <div className="summary-card-text">
            <p className="summary-card-label">{card.label}</p>
            <p className="summary-card-value">{card.value}</p>
            {card.detail ? <p className="summary-card-detail">{card.detail}</p> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
