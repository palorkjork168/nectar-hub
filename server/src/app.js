const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const sequelize = require("./config/database");

const authRoutes = require("./routes/auth.routes");
const errorHandler = require("./middleware/error.middleware");
const companyRoutes = require("./routes/company.routes");
const jobRoutes = require("./routes/job.routes");
const applicationRoutes = require("./routes/application.routes");
const profileRoutes = require("./routes/profile.routes");
const jobSkillRoutes = require("./routes/jobSkill.routes");
const matchingRoutes = require("./routes/matching.routes");
const savedJobRoutes = require("./routes/savedJob.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const employeeRoutes = require("./routes/employee.routes");
const interviewRoutes = require("./routes/interview.routes");
const departmentRoutes = require("./routes/department.routes");
const positionRoutes = require("./routes/position.routes");
const leaveRoutes = require("./routes/leave.routes");
const adminRoutes = require("./routes/admin.routes");
const roleRoutes = require("./routes/role.routes");
const teamRoutes = require("./routes/team.routes");
const notificationRoutes = require("./routes/notification.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const employmentRoutes = require("./routes/employment.routes");
const shiftRoutes = require("./routes/shift.routes");
const auditRoutes = require("./routes/audit.routes");

const app = express();

// Security Headers via Helmet
app.use(helmet({ contentSecurityPolicy: false }));

// CORS configuration (configured origin with credentials support)
const isProduction = process.env.NODE_ENV === "production";
const configuredOrigins = (process.env.CLIENT_URL || "")
  .split(",").map((origin) => origin.trim()).filter(Boolean);
const developmentOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
const allowedOrigins = new Set(isProduction ? configuredOrigins : [...configuredOrigins, ...developmentOrigins]);
app.use(
  cors({
    origin: (origin, callback) => {
      // No-Origin clients (curl, Postman, server-to-server tests) are intentionally allowed.
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS origin is not allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Rate Limiter for Authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 attempts per window
  message: {
    success: false,
    message: "Too many authentication requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Lightweight Health Check Endpoint with DB probe
app.get("/api/health", async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      success: true,
      status: "ok",
      database: "connected",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: "error",
      database: "disconnected",
      message: "Database service unavailable",
    });
  }
});

// Apply rate limiter to auth endpoints
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// Authentication routes
app.use("/api/auth", authRoutes);

// Companies & Teams
app.use("/api/companies", teamRoutes);
app.use("/api/companies", companyRoutes);

// Attendance & Employees
app.use("/api/attendance", attendanceRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/employment", employmentRoutes);

// Jobs, Skills, Matches, Saves
app.use("/api/jobs", matchingRoutes);
app.use("/api/jobs", savedJobRoutes);
app.use("/api/jobs", jobSkillRoutes);
app.use("/api/jobs", jobRoutes);

// Applications & Profiles
app.use("/api/applications", applicationRoutes);
app.use("/api/profile", profileRoutes);

// Interviews, Departments, Positions, Leaves
app.use("/api/interviews", interviewRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/positions", positionRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/shifts", shiftRoutes);

// Administration & Notifications
app.use("/api/admin", roleRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);

// Analytics & Reporting
app.use("/api/analytics", analyticsRoutes);

// Security & Audit Logs
app.use("/api/audit", auditRoutes);

// 404 Fallback for unhandled API routes (JSON response, never HTML)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API route ${req.method} ${req.originalUrl} not found`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;



