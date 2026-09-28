const { DataTypes } = require("sequelize");

module.exports = {
  async up({ context: q }) {
    await q.sequelize.transaction(async (transaction) => {
      // 1. Add is_early_departure column
      await q.addColumn(
        "attendances",
        "is_early_departure",
        {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        { transaction }
      );

      // 2. Add early_departure_minutes column
      await q.addColumn(
        "attendances",
        "early_departure_minutes",
        {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        { transaction }
      );

      // 3. Add status column
      await q.addColumn(
        "attendances",
        "status",
        {
          type: DataTypes.STRING(30),
          allowNull: false,
          defaultValue: "IN_PROGRESS",
        },
        { transaction }
      );

      // 4. Add index on [company_id, status]
      await q.addIndex("attendances", ["company_id", "status"], {
        name: "attendances_company_status_idx",
        transaction,
      });

      // 5. Backfill statuses for historical records
      await q.sequelize.query(
        `UPDATE attendances SET status = 'COMPLETED' WHERE check_out_time IS NOT NULL;`,
        { transaction }
      );
      await q.sequelize.query(
        `UPDATE attendances SET status = 'LATE' WHERE check_out_time IS NOT NULL AND is_late = true;`,
        { transaction }
      );
    });
  },

  async down({ context: q }) {
    await q.sequelize.transaction(async (transaction) => {
      await q.removeIndex("attendances", "attendances_company_status_idx", {
        transaction,
      });
      await q.removeColumn("attendances", "status", { transaction });
      await q.removeColumn("attendances", "early_departure_minutes", {
        transaction,
      });
      await q.removeColumn("attendances", "is_early_departure", {
        transaction,
      });
    });
  },
};
