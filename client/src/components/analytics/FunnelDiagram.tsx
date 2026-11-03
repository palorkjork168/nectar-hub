interface FunnelProps {
  funnel: {
    applications: number;
    reviewing: number;
    interview: number;
    accepted: number;
    hired: number;
    conversionRates: {
      applicationToReviewRate: number | null;
      reviewToInterviewRate: number | null;
      interviewToAcceptedRate: number | null;
      acceptedToHireRate: number | null;
      overallConversionRate: number | null;
    };
  };
}

export function FunnelDiagram({ funnel }: FunnelProps) {
  const stages = [
    {
      label: "Applications",
      count: funnel.applications,
      color: "#3b82f6", // blue
      subtext: "Received for company jobs",
    },
    {
      label: "Reviewing",
      count: funnel.reviewing,
      color: "#8b5cf6", // purple
      subtext: "Passed initial screening",
      rate: funnel.conversionRates.applicationToReviewRate,
      rateLabel: "App → Review",
    },
    {
      label: "Interview",
      count: funnel.interview,
      color: "#f59e0b", // amber
      subtext: "Interview scheduled/held",
      rate: funnel.conversionRates.reviewToInterviewRate,
      rateLabel: "Review → Interview",
    },
    {
      label: "Accepted",
      count: funnel.accepted,
      color: "var(--color-primary-text)", // green
      subtext: "Offer/status accepted",
      rate: funnel.conversionRates.interviewToAcceptedRate,
      rateLabel: "Interview → Accepted",
    },
    {
      label: "Hired",
      count: funnel.hired,
      color: "var(--color-primary-text)", // emerald
      subtext: "Active employee converted",
      rate: funnel.conversionRates.acceptedToHireRate,
      rateLabel: "Accepted → Hired",
    },
  ];

  return (
    <div
      style={{
        background: "var(--color-bg-card, #ffffff)",
        borderRadius: "var(--radius-lg, 12px)",
        border: "1px solid var(--color-border, #e2e8f0)",
        padding: "1.5rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "var(--color-text-main, #1e293b)" }}>
            Recruitment Funnel
          </h3>
          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.8rem", color: "var(--color-text-muted, #64748b)" }}>
            Tracking candidates from job application to confirmed workforce onboarding
          </p>
        </div>
        {funnel.conversionRates.overallConversionRate !== null && (
          <div
            style={{
              padding: "0.35rem 0.75rem",
              background: "rgba(255, 225, 124, 0.1)",
              color: "var(--color-primary-text)",
              borderRadius: "999px",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            Overall Conversion: {funnel.conversionRates.overallConversionRate}%
          </div>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "1rem",
        }}
      >
        {stages.map((stage, idx) => (
          <div
            key={stage.label}
            style={{
              background: "var(--color-bg-subtle, #f8fafc)",
              border: "1px solid var(--color-border, #e2e8f0)",
              borderRadius: "var(--radius-md, 8px)",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              position: "relative",
              borderTop: `4px solid ${stage.color}`,
            }}
          >
            <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #64748b)", fontWeight: 500 }}>
              Step {idx + 1}
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--color-text-main, #1e293b)", marginTop: "0.25rem" }}>
              {stage.label}
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: stage.color, margin: "0.5rem 0" }}>
              {stage.count}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted, #94a3b8)", lineHeight: 1.3 }}>
              {stage.subtext}
            </div>

            {stage.rate !== undefined && (
              <div
                style={{
                  marginTop: "0.75rem",
                  paddingTop: "0.5rem",
                  borderTop: "1px dashed var(--color-border, #e2e8f0)",
                  fontSize: "0.75rem",
                  color: "var(--color-text-secondary, #475569)",
                }}
              >
                {stage.rate !== null ? (
                  <span>
                    <strong>{stage.rate}%</strong> {stage.rateLabel}
                  </span>
                ) : (
                  <span style={{ color: "var(--color-text-muted, #94a3b8)" }}>N/A (no prev)</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div
        style={{
          fontSize: "0.75rem",
          color: "var(--color-text-muted, #64748b)",
          background: "var(--color-bg-secondary, #f8fafc)",
          padding: "0.5rem 0.75rem",
          borderRadius: "6px",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <span>💡</span>
        <span>
          <strong>Recruitment Distinction:</strong> Candidates with status <em>ACCEPTED</em> are not counted as{" "}
          <em>Hired</em> until an active <strong>Employment Record</strong> has been confirmed.
        </span>
      </div>
    </div>
  );
};
