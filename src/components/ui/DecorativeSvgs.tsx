/* Tiny reusable static SVG ornaments. */

/* 📖 Small open-book icon */
export function DecoBook({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 32"
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
    >
      <path d="M20,4 C20,4 12,6 12,8 L12,28 C12,28 20,26 20,26Z" fill="var(--color-primary)" opacity="0.18" />
      <path d="M20,4 C20,4 28,6 28,8 L28,28 C28,28 20,26 20,26Z" fill="var(--color-primary)" opacity="0.12" />
      <path d="M20,4 L20,26" stroke="var(--color-primary)" strokeWidth="0.6" opacity="0.3" />
      <line x1="14" y1="12" x2="19" y2="11" stroke="var(--color-primary)" strokeWidth="0.5" opacity="0.25" />
      <line x1="14" y1="16" x2="18" y2="15" stroke="var(--color-primary)" strokeWidth="0.5" opacity="0.2" />
      <line x1="22" y1="11" x2="27" y2="12" stroke="var(--color-primary)" strokeWidth="0.5" opacity="0.25" />
      <line x1="22" y1="15" x2="26" y2="16" stroke="var(--color-primary)" strokeWidth="0.5" opacity="0.2" />
    </svg>
  )
}

/* 💬 Small speech bubble */
export function DecoBubble({ className = '', text = 'Hi' }: { className?: string; text?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 50 40"
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
    >
      <path
        d="M5,8 C5,4 9,2 14,2 L36,2 C41,2 45,4 45,8 L45,22 C45,26 41,28 36,28 L22,28 L16,36 L14,28 L14,28 C9,28 5,26 5,22Z"
        fill="var(--color-primary)"
        opacity="0.12"
      />
      <path
        d="M5,8 C5,4 9,2 14,2 L36,2 C41,2 45,4 45,8 L45,22 C45,26 41,28 36,28 L22,28 L16,36 L14,28 L14,28 C9,28 5,26 5,22Z"
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="1"
        opacity="0.25"
      />
      <text
        x="25"
        y="19"
        textAnchor="middle"
        fill="var(--color-primary)"
        fontFamily="Inter, Arial, sans-serif"
        fontSize="10"
        fontWeight="700"
        opacity="0.5"
      >
        {text}
      </text>
    </svg>
  )
}

/* ⭐ Small star / sparkle */
export function DecoStar({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
    >
      <path
        d="M12,2 L14.5,9 L22,9 L16,14 L18,21 L12,17 L6,21 L8,14 L2,9 L9.5,9Z"
        fill="var(--color-primary)"
        opacity="0.15"
      />
    </svg>
  )
}

/* 🎓 Small graduation cap */
export function DecoGradCap({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 28"
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
    >
      <polygon points="0,14 20,4 40,14 20,24" fill="var(--color-primary)" opacity="0.15" />
      <polygon points="0,14 20,24 20,26 0,16" fill="var(--color-primary)" opacity="0.10" />
      <polygon points="40,14 20,24 20,26 40,16" fill="var(--color-primary)" opacity="0.12" />
      <line x1="20" y1="4" x2="20" y2="8" stroke="var(--color-accent)" strokeWidth="1" opacity="0.3" />
      <circle cx="20" cy="4" r="1.5" fill="var(--color-accent)" opacity="0.3" />
    </svg>
  )
}

/* 🌍 Small globe */
export function DecoGlobe({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 30 30"
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
    >
      <circle cx="15" cy="15" r="12" fill="var(--color-primary)" opacity="0.10" />
      <circle cx="15" cy="15" r="12" fill="none" stroke="var(--color-primary)" strokeWidth="0.8" opacity="0.2" />
      <ellipse cx="15" cy="15" rx="12" ry="6" fill="none" stroke="var(--color-primary)" strokeWidth="0.5" opacity="0.15" />
      <ellipse cx="15" cy="15" rx="6" ry="12" fill="none" stroke="var(--color-primary)" strokeWidth="0.5" opacity="0.15" />
      <line x1="3" y1="15" x2="27" y2="15" stroke="var(--color-primary)" strokeWidth="0.4" opacity="0.15" />
    </svg>
  )
}

/* ✏️ Small pencil */
export function DecoPencil({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 36 10"
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
    >
      <rect x="8" y="1" width="24" height="8" rx="1" fill="var(--color-accent)" opacity="0.18" />
      <polygon points="8,1 2,5 8,9" fill="var(--color-primary)" opacity="0.12" />
      <polygon points="4,4 2,5 4,6" fill="var(--color-text)" opacity="0.15" />
      <rect x="30" y="1" width="4" height="8" rx="1.5" fill="var(--color-primary)" opacity="0.12" />
    </svg>
  )
}

/* 🎧 Small headphones */
export function DecoHeadphones({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 28"
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
    >
      <path
        d="M4,18 C4,10 9,4 16,4 C23,4 28,10 28,18"
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.18"
      />
      <rect x="1" y="16" width="6" height="10" rx="3" fill="var(--color-primary)" opacity="0.15" />
      <rect x="25" y="16" width="6" height="10" rx="3" fill="var(--color-primary)" opacity="0.15" />
    </svg>
  )
}

/* 💡 Small lightbulb */
export function DecoLightbulb({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 22 30"
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
    >
      <path
        d="M11,2 C5,2 1,7 1,12 C1,16 4,19 6,22 L6,25 L16,25 L16,22 C18,19 21,16 21,12 C21,7 17,2 11,2Z"
        fill="var(--color-accent)"
        opacity="0.15"
      />
      <rect x="7" y="25" width="8" height="2" rx="1" fill="var(--color-accent)" opacity="0.12" />
      <line x1="11" y1="-2" x2="11" y2="0" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.2" />
    </svg>
  )
}

/* ☀️ Small sun — same petal language as the home lawn flowers */
export function DecoSun({ className = '' }: { className?: string }) {
  const ray =
    'M0,0 C-2.2,-2.8 -4.4,-7.5 0,-15.5 C4.4,-7.5 2.2,-2.8 0,0 Z'
  const stroke = { stroke: '#1C1915', strokeWidth: 0.75, strokeOpacity: 0.28, strokeLinejoin: 'round' as const }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 80 80"
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
    >
      <g opacity="0.72">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <g key={angle} transform={`translate(40,40) rotate(${angle})`}>
            <path d={ray} fill="#FFD54F" {...stroke} transform="translate(0,-17)" />
          </g>
        ))}
        <circle cx="40" cy="40" r="11" fill="#FFD54F" {...stroke} />
        <circle cx="40" cy="40" r="5.5" fill="#FFE082" {...stroke} />
      </g>
    </svg>
  )
}

/* ✅ Small checkmark circle */
export function DecoCheck({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
    >
      <circle cx="12" cy="12" r="10" fill="var(--color-primary)" opacity="0.12" />
      <path d="M7,12 L10,15 L17,8" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.25" />
    </svg>
  )
}

/* 🏆 Small trophy */
export function DecoTrophy({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 28 30"
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
    >
      <path d="M8,4 L20,4 L18,18 L10,18Z" fill="var(--color-accent)" opacity="0.16" />
      <path d="M8,4 C8,4 3,5 3,10 C3,14 7,14 8,12" fill="var(--color-accent)" opacity="0.10" />
      <path d="M20,4 C20,4 25,5 25,10 C25,14 21,14 20,12" fill="var(--color-accent)" opacity="0.10" />
      <rect x="11" y="18" width="6" height="4" fill="var(--color-accent)" opacity="0.12" />
      <rect x="8" y="22" width="12" height="3" rx="1" fill="var(--color-accent)" opacity="0.14" />
    </svg>
  )
}

/* ABC floating letters */
export function DecoABC({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 50 20"
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
    >
      <text x="6" y="16" fill="var(--color-primary)" fontFamily="Inter, Arial, sans-serif" fontSize="14" fontWeight="800" opacity="0.18">A</text>
      <text x="20" y="14" fill="var(--color-accent)" fontFamily="Inter, Arial, sans-serif" fontSize="11" fontWeight="800" opacity="0.14">B</text>
      <text x="33" y="16" fill="var(--color-primary)" fontFamily="Inter, Arial, sans-serif" fontSize="12" fontWeight="800" opacity="0.16">C</text>
    </svg>
  )
}
