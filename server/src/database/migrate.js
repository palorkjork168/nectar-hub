require("dotenv").config();
const path = require("path");
const { Umzug, SequelizeStorage } = require("umzug");
const sequelize = require("../config/database");

const migrator = new Umzug({
  migrations: { glob: ["migrations/*.js", { cwd: __dirname }], resolve: ({ name, path: migrationPath, context }) => {
    const migration = require(migrationPath);
    return { name, up: () => migration.up({ context }), down: () => migration.down({ context }) };
  } },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize, tableName: "SequelizeMeta" }),
  logger: console,
});

async function main() {
  const command = process.argv[2] || "up";
  try {
    await sequelize.authenticate();
    if (command === "status") {
      const [executed, pending] = await Promise.all([migrator.executed(), migrator.pending()]);
      console.log(`Executed migrations (${executed.length}): ${executed.map((m) => m.name).join(", ") || "none"}`);
      console.log(`Pending migrations (${pending.length}): ${pending.map((m) => m.name).join(", ") || "none"}`);
    } else if (command === "up") {
      const migrations = await migrator.up();
      console.log(`Applied migrations: ${migrations.map((m) => m.name).join(", ") || "none"}`);
    } else if (command === "down") {
      const migration = await migrator.down();
      console.log(`Reverted migration: ${migration ? migration.name : "none"}`);
    } else throw new Error("Usage: migrate.js [up|status|down]");
  } finally { await sequelize.close(); }
}
main().catch((error) => { console.error("Migration failed:", error.message); process.exitCode = 1; });
