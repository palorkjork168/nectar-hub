import { XCircle, CheckCircle2 } from "lucide-react";

export default function FluxProblemSolution() {
  return (
    <section className="flux-contrast-section">
      <div className="flux-contrast-container">
        {/* Left Half: Problem (THE OLD WAY) */}
        <div className="flux-contrast-col flux-old-way-col">
          <div className="flux-way-heading-wrap old-accent">
            <h2 className="flux-way-title old-title">THE OLD WAY</h2>
          </div>

          <div className="flux-way-items">
            {/* Item 1 */}
            <div className="flux-way-item">
              <div className="flux-item-icon-wrap red-icon">
                <XCircle size={22} />
              </div>
              <div className="flux-item-content">
                <h3 className="flux-item-title old-text">Scattered Feedback & Resumes</h3>
                <p className="flux-item-desc old-desc">
                  Comments buried in Slack, emails, spreadsheets, and unformatted Jira tickets.
                </p>
              </div>
            </div>

            {/* Item 2 */}
            <div className="flux-way-item">
              <div className="flux-item-icon-wrap red-icon">
                <XCircle size={22} />
              </div>
              <div className="flux-item-content">
                <h3 className="flux-item-title old-text">Version Hell</h3>
                <p className="flux-item-desc old-desc">
                  final_final_v3_real.pdf and unverified timesheets causing confusion and missed hires.
                </p>
              </div>
            </div>

            {/* Item 3 */}
            <div className="flux-way-item">
              <div className="flux-item-icon-wrap red-icon">
                <XCircle size={22} />
              </div>
              <div className="flux-item-content">
                <h3 className="flux-item-title old-text">Admin Overload</h3>
                <p className="flux-item-desc old-desc">
                  Spending 40% of valuable company time on manual management, not core execution.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Half: Solution (THE NECTAR WAY / THE FLUX WAY) */}
        <div className="flux-contrast-col flux-new-way-col">
          <div className="flux-solution-card">
            <div className="flux-way-heading-wrap new-accent">
              <div className="flux-yellow-accent-bar" />
              <h2 className="flux-way-title new-title">THE NECTAR WAY</h2>
            </div>

            <div className="flux-way-items">
              {/* Item 1 */}
              <div className="flux-way-item">
                <div className="flux-item-icon-wrap yellow-icon">
                  <CheckCircle2 size={22} />
                </div>
                <div className="flux-item-content">
                  <h3 className="flux-item-title new-text">Centralized Context</h3>
                  <p className="flux-item-desc new-desc">
                    All candidate feedback, job requisitions, and shift records attached directly to one live graph.
                  </p>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flux-way-item">
                <div className="flux-item-icon-wrap yellow-icon">
                  <CheckCircle2 size={22} />
                </div>
                <div className="flux-item-content">
                  <h3 className="flux-item-title new-text">Live Sync</h3>
                  <p className="flux-item-desc new-desc">
                    Real-time workforce updates, tamper-proof GPS shifts, and automated status syncing.
                  </p>
                </div>
              </div>

              {/* Item 3 */}
              <div className="flux-way-item">
                <div className="flux-item-icon-wrap yellow-icon">
                  <CheckCircle2 size={22} />
                </div>
                <div className="flux-item-content">
                  <h3 className="flux-item-title new-text">Pure Flow</h3>
                  <p className="flux-item-desc new-desc">
                    Automated smart matching, instant digital contracts, and frictionless documentation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
