function Svg({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-[1em] w-[1em]">
      {children}
    </svg>
  );
}

export function SalesIcon() {
  return (
    <Svg>
      <circle cx="12" cy="12" r="8.2" stroke="currentColor" strokeWidth={1.8} />
      <path
        d="M12 7.5v9M9.3 9.6c0-1.1 1.1-1.9 2.7-1.9s2.7.8 2.7 1.8c0 2.4-5.4 1.5-5.4 3.9 0 1 1.1 1.8 2.7 1.8s2.7-.8 2.7-1.8"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function ProfitUpIcon() {
  return (
    <Svg>
      <path
        d="M4 16l5.2-5.2 3.6 3.6L20 7"
        stroke="currentColor"
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14.5 7h5.5v5.5" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ProfitDownIcon() {
  return (
    <Svg>
      <path
        d="M4 8l5.2 5.2 3.6-3.6L20 17"
        stroke="currentColor"
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14.5 17h5.5v-5.5" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function VaultIcon() {
  return (
    <Svg>
      <rect x="4.5" y="10.5" width="15" height="9.5" rx="2" stroke="currentColor" strokeWidth={1.8} />
      <circle cx="12" cy="15.25" r="1.6" stroke="currentColor" strokeWidth={1.6} />
      <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function CardPlaceholderIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${className} text-amber-300`}>
      <rect x="4" y="2.5" width="16" height="19" rx="2.2" stroke="currentColor" strokeWidth={1.5} />
      <circle cx="8.3" cy="7.2" r="1.3" stroke="currentColor" strokeWidth={1.3} />
      <path d="M7 16.5h10M7 19h6" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" />
    </svg>
  );
}
