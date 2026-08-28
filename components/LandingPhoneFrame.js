export default function LandingPhoneFrame({ children, compact = false }) {
  return (
    <div className={`landing-phone-device${compact ? " landing-phone-device--compact" : ""}`}>
      <div className="landing-phone">
        <span className="landing-phone-btn landing-phone-btn--silent" aria-hidden />
        <span className="landing-phone-btn landing-phone-btn--vol-up" aria-hidden />
        <span className="landing-phone-btn landing-phone-btn--vol-down" aria-hidden />
        <span className="landing-phone-btn landing-phone-btn--power" aria-hidden />
        <div className="landing-phone-screen">
          <div className="landing-phone-statusbar" aria-hidden>
            <span className="landing-phone-time">9:41</span>
            <div className="landing-phone-island">
              <span className="landing-phone-island-lens" />
            </div>
            <span className="landing-phone-status-icons">
              <svg viewBox="0 0 17 12" className="landing-phone-status-signal" aria-hidden>
                <rect x="0" y="8" width="2.4" height="4" rx="0.6" />
                <rect x="4.2" y="5.5" width="2.4" height="6.5" rx="0.6" />
                <rect x="8.4" y="3" width="2.4" height="9" rx="0.6" />
                <rect x="12.6" y="0" width="2.4" height="12" rx="0.6" />
              </svg>
              <svg viewBox="0 0 16 12" className="landing-phone-status-wifi" aria-hidden>
                <path
                  d="M1.2 4.4a9.2 9.2 0 0 1 13.6 0M3.6 6.8a5.8 5.8 0 0 1 8.8 0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.35"
                  strokeLinecap="round"
                />
                <circle cx="8" cy="10.2" r="1.15" />
              </svg>
              <svg viewBox="0 0 27 12" className="landing-phone-status-battery" aria-hidden>
                <rect
                  x="0.6"
                  y="1.4"
                  width="21.2"
                  height="9.2"
                  rx="2.4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.15"
                />
                <rect x="2.1" y="2.85" width="16.6" height="6.3" rx="1.2" />
                <path
                  d="M23.4 4.1h1.1a1.6 1.6 0 0 1 1.6 1.6v.6a1.6 1.6 0 0 1-1.6 1.6h-1.1"
                  fill="currentColor"
                  opacity="0.4"
                />
              </svg>
            </span>
          </div>
          {children}
          <div className="landing-phone-home" aria-hidden />
        </div>
      </div>
    </div>
  );
}
