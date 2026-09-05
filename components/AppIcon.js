export default function AppIcon({ className = "h-9 w-9" }) {
  return (
    <svg
      viewBox="0 0 56 56"
      fill="none"
      className={className}
      role="img"
      aria-label="AgendaNet"
    >
      <rect width="56" height="56" rx="14" fill="#0f766e" />
      <rect x="13" y="13" width="9" height="9" rx="2.5" fill="#5eead4" fillOpacity="0.45" />
      <rect x="23.5" y="13" width="9" height="9" rx="2.5" fill="#5eead4" fillOpacity="0.45" />
      <rect x="34" y="13" width="9" height="9" rx="2.5" fill="#5eead4" fillOpacity="0.45" />
      <rect x="13" y="23.5" width="9" height="9" rx="2.5" fill="#5eead4" fillOpacity="0.45" />
      <rect x="23.5" y="23.5" width="9" height="9" rx="2.5" fill="#5eead4" fillOpacity="0.45" />
      <circle cx="38.5" cy="38.5" r="9.5" fill="#ffffff" />
      <path
        d="M34.7 38.5L37.3 41.1L42.3 35.9"
        stroke="#0f766e"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
