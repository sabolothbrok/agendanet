// Renders the AppIcon mark (same design as components/AppIcon.js and
// app/icon.svg) as ImageResponse-compatible JSX for the code-generated
// icon/manifest/OG routes. Uses a raw <svg> — Satori (the renderer behind
// next/og) supports the basic SVG presentational elements — instead of a
// "✓" glyph (Satori resolves text via a live Google Fonts request the build
// sandbox can't reach, so the glyph silently renders blank) or CSS bars
// (rounded end-caps don't join cleanly into a crisp checkmark).
export function appIconMark(px) {
  return (
    <svg width={px} height={px} viewBox="0 0 56 56" fill="none">
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
