const { DataTypes } = require("sequelize");

module.exports = {
  async up({ context: q }) {
    await q.sequelize.transaction(async (transaction) => {
      // 1. Add work_schedule_id column
      await q.addColumn(
        "attendances",
        "work_schedule_id",
        {
          type: DataTypes.UUID,
          allowNull: true,
        },
        { transaction }
      );

      // 2. Add foreign key constraint for work_schedule_id
      await q.addConstraint("attendances", {
        fields: ["work_schedule_id"],
        type: "foreign key",
        name: "attendances_work_schedule_id_fkey",
        references: {
          table: "work_schedules",
          field: "id",
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
        transaction,
      });

      // 3. Add index on work_schedule_id
      await q.addIndex("attendances", ["work_schedule_id"], {
        name: "attendances_work_schedule_idx",
        transaction,
      });

      // 4. Add is_late column
      await q.addColumn(
        "attendances",
        "is_late",
        {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        { transaction }
      );

      // 5. Add late_minutes column
      await q.addColumn(
        "attendances",
        "late_minutes",
        {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        { transaction }
      );

      // 6. Add actual_hours column
      await q.addColumn(
        "attendances",
        "actual_hours",
        {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: true,
        },
        { transaction }
      );

      // 7. Add completion_percentage column
      await q.addColumn(
        "attendances",
        "completion_percentage",
        {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        { transaction }
      );
    });
  },

  async down({ context: q }) {
    await q.sequelize.transaction(async (transaction) => {
      await q.removeIndex("attendances", "attendances_work_schedule_idx", {
        transaction,
      });
      await q.removeConstraint(
        "attendances",
        "attendances_work_schedule_id_fkey",
        { transaction }
      );
      await q.removeColumn("attendances", "completion_percentage", {
        transaction,
      });
      await q.removeColumn("attendances", "actual_hours", { transaction });
      await q.removeColumn("attendances", "late_minutes", { transaction });
      await q.removeColumn("attendances", "is_late", { transaction });
      await q.removeColumn("attendances", "work_schedule_id", { transaction });
    });
  },
};
