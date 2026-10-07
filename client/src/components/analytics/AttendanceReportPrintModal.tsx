import type { CompanyAttendanceAnalyticsData } from "../../types/analytics";
import { Printer, X } from "lucide-react";

interface AttendanceReportPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: CompanyAttendanceAnalyticsData;
  companyName: string;
}

export function AttendanceReportPrintModal({
  isOpen,
  onClose,
  data,
  companyName,
}: AttendanceReportPrintModalProps) {
  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      className="attendance-print-modal-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
        overflowY: "auto",
      }}
    >
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #attendance-printable-report, #attendance-printable-report * {
            visibility: visible;
          }
          #attendance-printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "850px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
          overflow: "hidden",
        }}
      >
        {/* Modal Action Bar (hidden in print) */}
        <div
          className="no-print"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1rem 1.5rem",
            borderBottom: "1px solid #e2e8f0",
            background: "#f8fafc",
          }}
        >
          <div style={{ fontWeight: 600, color: "#1e293b", fontSize: "1.1rem" }}>
            Printable Attendance & Work Schedule Report
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              onClick={handlePrint}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 1rem",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              <Printer size={16} /> Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                padding: "0.25rem",
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Content Area */}
        <div
          id="attendance-printable-report"
          style={{
            padding: "2rem",
            overflowY: "auto",
            color: "#1e293b",
            fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
            lineHeight: 1.5,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              borderBottom: "2px solid #0f172a",
              paddingBottom: "1.25rem",
              marginBottom: "1.5rem",
            }}
          >
            <div>
              <h1 style={{ margin: "0 0 0.25rem 0", fontSize: "1.5rem", fontWeight: 800, color: "#0f172a" }}>
                {companyName || data.company.name}
              </h1>
              <div style={{ fontSize: "1rem", color: "#475569", fontWeight: 600 }}>
                Work Schedule & Attendance Analytics Report
              </div>
            </div>
            <div style={{ textAlign: "right", fontSize: "0.8rem", color: "#64748b" }}>
              <div><strong>Period:</strong> {data.range.from} to {data.range.to}</div>
              <div><strong>Generated:</strong> {currentDate}</div>
              <div><strong>Platform:</strong> Nectar Hub</div>
            </div>
          </div>

          {/* KPI Summary Grid */}
          <div style={{ marginBottom: "1.75rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 0.75rem 0", color: "#0f172a" }}>
              Executive Attendance KPIs
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "0.75rem",
              }}
            >
              <div style={{ border: "1px solid #e2e8f0", padding: "0.75rem", borderRadius: "6px", background: "#f8fafc" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Total Logs</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a" }}>{data.kpis.totalAttendance}</div>
              </div>
              <div style={{ border: "1px solid #e2e8f0", padding: "0.75rem", borderRadius: "6px", background: "#f8fafc" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Completed Shifts</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#10b981" }}>{data.kpis.completedShifts}</div>
              </div>
              <div style={{ border: "1px solid #e2e8f0", padding: "0.75rem", borderRadius: "6px", background: "#f8fafc" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>On-Time Rate</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#2563eb" }}>{data.compliance.onTimeRate}%</div>
              </div>
              <div style={{ border: "1px solid #e2e8f0", padding: "0.75rem", borderRadius: "6px", background: "#f8fafc" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Avg Completion</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#059669" }}>{data.compliance.avgShiftCompletionPercentage}%</div>
              </div>
              <div style={{ border: "1px solid #e2e8f0", padding: "0.75rem", borderRadius: "6px", background: "#f8fafc" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Late Arrivals</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#d97706" }}>
                  {data.kpis.lateCount} ({data.compliance.lateRate}%)
                </div>
              </div>
              <div style={{ border: "1px solid #e2e8f0", padding: "0.75rem", borderRadius: "6px", background: "#f8fafc" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Early Departures</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#e11d48" }}>
                  {data.kpis.earlyDepartureCount} ({data.compliance.earlyDepartureRate}%)
                </div>
              </div>
              <div style={{ border: "1px solid #e2e8f0", padding: "0.75rem", borderRadius: "6px", background: "#f8fafc" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Avg Worked Hours</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a" }}>{data.kpis.avgWorkedHours}h</div>
              </div>
              <div style={{ border: "1px solid #e2e8f0", padding: "0.75rem", borderRadius: "6px", background: "#f8fafc" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Avg Late Minutes</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#d97706" }}>{data.compliance.avgLateMinutes} min</div>
              </div>
            </div>
          </div>

          {/* Department Breakdown Table */}
          <div style={{ marginBottom: "1.75rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 0.75rem 0", color: "#0f172a" }}>
              Department Schedule Adherence
            </h3>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.85rem",
                textAlign: "left",
              }}
            >
              <thead>
                <tr style={{ background: "#f1f5f9", borderBottom: "1px solid #cbd5e1" }}>
                  <th style={{ padding: "8px 10px" }}>Department</th>
                  <th style={{ padding: "8px 10px" }}>Attendance</th>
                  <th style={{ padding: "8px 10px" }}>On-Time %</th>
                  <th style={{ padding: "8px 10px" }}>Late</th>
                  <th style={{ padding: "8px 10px" }}>Early Dep.</th>
                  <th style={{ padding: "8px 10px" }}>Avg Hours</th>
                  <th style={{ padding: "8px 10px" }}>Completion %</th>
                </tr>
              </thead>
              <tbody>
                {data.departments.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "12px", textAlign: "center", color: "#94a3b8" }}>
                      No department attendance recorded.
                    </td>
                  </tr>
                ) : (
                  data.departments.map((d) => (
                    <tr key={d.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "8px 10px", fontWeight: 600 }}>{d.name}</td>
                      <td style={{ padding: "8px 10px" }}>{d.attendanceCount}</td>
                      <td style={{ padding: "8px 10px", color: d.onTimeRate >= 80 ? "#15803d" : "#b45309", fontWeight: 600 }}>
                        {d.onTimeRate}%
                      </td>
                      <td style={{ padding: "8px 10px", color: d.lateCount > 0 ? "#d97706" : "#64748b" }}>{d.lateCount}</td>
                      <td style={{ padding: "8px 10px", color: d.earlyDepartureCount > 0 ? "#e11d48" : "#64748b" }}>
                        {d.earlyDepartureCount}
                      </td>
                      <td style={{ padding: "8px 10px" }}>{d.avgWorkedHours}h</td>
                      <td style={{ padding: "8px 10px", fontWeight: 600 }}>{d.avgCompletionPercentage}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Schedule Breakdown Table */}
          <div style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 0.75rem 0", color: "#0f172a" }}>
              Work Schedule Adherence & Punctuality
            </h3>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.85rem",
                textAlign: "left",
              }}
            >
              <thead>
                <tr style={{ background: "#f1f5f9", borderBottom: "1px solid #cbd5e1" }}>
                  <th style={{ padding: "8px 10px" }}>Schedule Name</th>
                  <th style={{ padding: "8px 10px" }}>Type</th>
                  <th style={{ padding: "8px 10px" }}>Assigned Staff</th>
                  <th style={{ padding: "8px 10px" }}>Logs</th>
                  <th style={{ padding: "8px 10px" }}>On-Time %</th>
                  <th style={{ padding: "8px 10px" }}>Avg Late (min)</th>
                  <th style={{ padding: "8px 10px" }}>Completion %</th>
                </tr>
              </thead>
              <tbody>
                {data.schedules.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "12px", textAlign: "center", color: "#94a3b8" }}>
                      No work schedules recorded.
                    </td>
                  </tr>
                ) : (
                  data.schedules.map((s) => (
                    <tr key={s.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "8px 10px", fontWeight: 600 }}>{s.name}</td>
                      <td style={{ padding: "8px 10px", color: "#64748b" }}>{s.shiftType}</td>
                      <td style={{ padding: "8px 10px" }}>{s.assignedEmployees}</td>
                      <td style={{ padding: "8px 10px" }}>{s.attendanceCount}</td>
                      <td style={{ padding: "8px 10px", color: s.onTimeRate >= 80 ? "#15803d" : "#b45309", fontWeight: 600 }}>
                        {s.onTimeRate}%
                      </td>
                      <td style={{ padding: "8px 10px" }}>{s.avgLateMinutes} min</td>
                      <td style={{ padding: "8px 10px", fontWeight: 600 }}>{s.avgCompletionPercentage}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Note */}
          <div
            style={{
              borderTop: "1px solid #e2e8f0",
              paddingTop: "0.75rem",
              fontSize: "0.75rem",
              color: "#94a3b8",
              textAlign: "center",
            }}
          >
            Confidential — Generated by Nectar Hub Workforce Analytics Intelligence Engine
          </div>
        </div>
      </div>
    </div>
  );
}
