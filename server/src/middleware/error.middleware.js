const multer = require("multer");

const errorHandler = (err, req, res, next) => {
  // Always log full detailed error server-side for internal debugging
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

  let statusCode = err.statusCode || 500;
  let message = err.message || "An unexpected error occurred";

  // 1. Multer upload errors
  if (err instanceof multer.MulterError) {
    statusCode = 400;
    if (err.code === "LIMIT_FILE_SIZE") {
      message = "File size exceeds allowed limit";
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      message = "Unexpected file field in upload request";
    } else {
      message = `File upload error: ${err.message}`;
    }
  }

  // 2. Sequelize Validation Errors
  if (err.name === "SequelizeValidationError") {
    statusCode = 400;
    message = err.errors && err.errors.length > 0 ? err.errors[0].message : "Validation error";
  }

  // 3. Sequelize Unique Constraint Violations
  if (err.name === "SequelizeUniqueConstraintError") {
    statusCode = 409;
    message = "A record with this identifier already exists";
  }

  // 4. Sequelize Database Errors (e.g. invalid UUID syntax, foreign key violations)
  if (err.name === "SequelizeDatabaseError") {
    const rawMsg = String(err.message || "").toLowerCase();
    if (rawMsg.includes("invalid input syntax for type uuid") || rawMsg.includes("invalid uuid")) {
      statusCode = 400;
      message = "Invalid identifier format";
    } else {
      statusCode = 500;
      message = "A database error occurred. Please try again.";
    }
  }

  // 5. Explicit safety filter against database / filesystem leaks
  const lowerMsg = String(message).toLowerCase();
  if (
    lowerMsg.includes("select ") ||
    lowerMsg.includes("insert into") ||
    lowerMsg.includes("update ") ||
    lowerMsg.includes("delete from") ||
    lowerMsg.includes("relation \"") ||
    lowerMsg.includes("column \"") ||
    lowerMsg.includes("sqlstate") ||
    lowerMsg.includes("econnrefused") ||
    lowerMsg.includes("syntax error at or near") ||
    lowerMsg.includes("sequelize")
  ) {
    statusCode = statusCode === 400 ? 400 : 500;
    message = statusCode === 400 ? "Invalid request parameter" : "Internal server error";
  }

  // Response is ALWAYS sanitized and never exposes stack traces to clients
  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorHandler;
