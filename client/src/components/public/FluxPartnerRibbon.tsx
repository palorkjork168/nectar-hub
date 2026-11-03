export default function FluxPartnerRibbon() {
  return (
    <section className="flux-ribbon-section">
      <div className="flux-ribbon-container">
        <div className="flux-ribbon-label">TRUSTED BY DESIGN & HIGH-VELOCITY TEAMS AT</div>
        <div className="flux-ribbon-logos">
          {/* Figma icon */}
          <div className="flux-ribbon-item" title="Figma">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12a3 3 0 1 1 3-3 3 3 0 0 1-3 3zm0 0a3 3 0 1 1-3-3 3 3 0 0 1 3 3zm0 6a3 3 0 1 1-3-3 3 3 0 0 1 3 3zm0-12a3 3 0 1 1 3-3 3 3 0 0 1-3 3zm0 0a3 3 0 1 1-3-3 3 3 0 0 1 3 3z" />
            </svg>
            <span className="flux-logo-name">Figma</span>
          </div>

          {/* Dribbble icon */}
          <div className="flux-ribbon-item" title="Dribbble">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
              <path d="M19.13 5.09C15.22 9.14 10 10.44 2.25 10.94" stroke="currentColor" strokeWidth="2" fill="none" />
              <path d="M21.75 12.84c-4.9-1.22-9.67-.14-13.62 3.19" stroke="currentColor" strokeWidth="2" fill="none" />
              <path d="M8.5 2.5c2.3 4.2 3.8 8.8 4.2 13.5" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
            <span className="flux-logo-name">Dribbble</span>
          </div>

          {/* Behance icon */}
          <div className="flux-ribbon-item" title="Behance">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.2 11.2c1.2-.4 1.9-1.3 1.9-2.6 0-2.3-1.8-3.6-4.5-3.6H1v14h4.8c2.9 0 4.9-1.5 4.9-4.1 0-1.8-1-3.1-2.5-3.7zM4.1 7.4h1.4c1.1 0 1.9.5 1.9 1.6 0 1-.7 1.6-1.9 1.6H4.1V7.4zm1.6 9.2H4.1v-3.7h1.6c1.3 0 2.2.6 2.2 1.8 0 1.3-.9 1.9-2.2 1.9zm12.5-6.8c-3 0-5.2 2.2-5.2 5.5 0 3.4 2.2 5.6 5.3 5.6 2.4 0 4.1-1.2 4.8-3.1h-2.5c-.4.7-1.2 1.1-2.3 1.1-1.6 0-2.6-1-2.7-2.6h7.6c.1-.4.1-.9.1-1.3 0-3.1-2-5.2-5.1-5.2zm-2.6 4.3c.2-1.3 1.1-2.2 2.6-2.2 1.4 0 2.3.9 2.5 2.2h-5.1zm.5-6.6h4.3v1.5h-4.3V7.5z" />
            </svg>
            <span className="flux-logo-name">Behance</span>
          </div>

          {/* Notion icon */}
          <div className="flux-ribbon-item" title="Notion">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4.5 3.5h15l-1.5 17h-12z" stroke="currentColor" strokeWidth="2" fill="none" />
              <path d="M8.5 7.5v9l7-9v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
            <span className="flux-logo-name">Notion</span>
          </div>

          {/* Framer icon */}
          <div className="flux-ribbon-item" title="Framer">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 2h16v7h-8zM4 9h8l8 7H4zM4 16h8v6z" />
            </svg>
            <span className="flux-logo-name">Framer</span>
          </div>

          {/* Stripe icon */}
          <div className="flux-ribbon-item" title="Stripe">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.97 15.698.4 12.522.4 6.78.4 2.877 3.393 2.877 8.358c0 4.79 3.896 6.812 7.747 8.23 2.502.932 3.396 1.677 3.396 2.673 0 .973-.895 1.57-2.378 1.57-2.583 0-5.467-1.127-7.393-2.217l-.936 5.589c1.944.975 4.887 1.6 8.329 1.6 6.275 0 10.428-2.923 10.428-8.114.004-4.872-3.805-6.732-8.094-8.549z" />
            </svg>
            <span className="flux-logo-name">Stripe</span>
          </div>
        </div>
      </div>
    </section>
  );
}
