import axios from "axios";

/**
 * Safely extracts a user-friendly error message from an unknown error object.
 * Sanitizes and strips any accidental internal SQL / Sequelize / stack trace exposures.
 */
export function getErrorMessage(error: unknown, fallback = "An unexpected error occurred"): string {
  if (!error) return fallback;

  let message = fallback;

  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data) {
      if (typeof data === "string") {
        message = data;
      } else if (typeof data.message === "string") {
        message = data.message;
      } else if (typeof data.error === "string") {
        message = data.error;
      } else if (Array.isArray(data.errors) && data.errors.length > 0) {
        const first = data.errors[0];
        message = typeof first === "string" ? first : first.message || fallback;
      }
    } else if (error.message) {
      message = error.message;
    }
  } else if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "string") {
    message = error;
  }

  // Safety filter: ensure no database queries or stack traces leak to users
  const rawLower = message.toLowerCase();
  if (
    rawLower.includes("sequelize") ||
    rawLower.includes("sqlstate") ||
    rawLower.includes("syntax error at or near") ||
    rawLower.includes("relation \"") ||
    rawLower.includes("column \"") ||
    rawLower.includes("econnrefused") ||
    rawLower.includes("pg_")
  ) {
    return "A server error occurred. Please try again later.";
  }

  return message;
}
