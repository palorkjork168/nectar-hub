require("dotenv").config();

// Startup Environment Validation
const REQUIRED_ENV_VARS = ["JWT_SECRET"];
const missingEnvs = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
if (missingEnvs.length > 0) {
  console.error(`FATAL CONFIGURATION ERROR: Missing required environment variable(s): ${missingEnvs.join(", ")}`);
  process.exit(1);
}

const app = require("./app");
const sequelize = require("./config/database");
const seedRoles = require("./database/seedRoles");
const { seedPermissions } = require("./database/seedPermissions");

require("./models");

const PORT = process.env.PORT || 5000;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

let server;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully!");

    if (!IS_PRODUCTION) {
      await sequelize.sync();
      console.log("Database models synchronized (development mode).");
    } else {
      console.log("Production mode: Skipping auto-sync. Database schema is managed via migrations.");
    }

    await seedRoles();
    await seedPermissions();

    server = app.listen(PORT, () => {
      console.log(`Nectar Hub API running on port ${PORT} [Mode: ${process.env.NODE_ENV || "development"}]`);
    });
  } catch (error) {
    console.error("Unable to start server or connect to database:", error.message);
    process.exit(1);
  }
};

// Graceful Shutdown
const handleShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Initiating graceful shutdown...`);
  if (server) {
    server.close(async () => {
      console.log("HTTP server closed.");
      try {
        await sequelize.close();
        console.log("Database connection pool closed successfully.");
        process.exit(0);
      } catch (err) {
        console.error("Error closing database connection pool:", err);
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }
};

process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));

startServer();