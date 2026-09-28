const { DataTypes } = require("sequelize");

module.exports = {
  async up({ context: q }) {
    await q.sequelize.transaction(async (transaction) => {
      // 1. Create work_schedules table
      await q.createTable(
        "work_schedules",
        {
          id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
          },
          company_id: {
            type: DataTypes.UUID,
            allowNull: false,
          },
          name: {
            type: DataTypes.STRING(255),
            allowNull: false,
          },
          description: {
            type: DataTypes.TEXT,
            allowNull: true,
          },
          start_time: {
            type: DataTypes.STRING(5),
            allowNull: false,
          },
          end_time: {
            type: DataTypes.STRING(5),
            allowNull: false,
          },
          grace_period_minutes: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 15,
          },
          expected_hours: {
            type: DataTypes.DECIMAL(4, 2),
            allowNull: false,
            defaultValue: 8.00,
          },
          is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
          },
          created_at: {
            type: DataTypes.DATE,
            allowNull: false,
          },
          updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
          },
        },
        { transaction }
      );

      // 2. Add foreign key constraint for company_id on work_schedules
      await q.addConstraint("work_schedules", {
        fields: ["company_id"],
        type: "foreign key",
        name: "work_schedules_company_id_fkey",
        references: {
          table: "companies",
          field: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        transaction,
      });

      // 3. Add index on work_schedules [company_id, is_active]
      await q.addIndex("work_schedules", ["company_id", "is_active"], {
        name: "work_schedules_company_active_idx",
        transaction,
      });

      // 4. Add work_schedule_id column to employment_records
      await q.addColumn(
        "employment_records",
        "work_schedule_id",
        {
          type: DataTypes.UUID,
          allowNull: true,
        },
        { transaction }
      );

      // 5. Add foreign key constraint on employment_records
      await q.addConstraint("employment_records", {
        fields: ["work_schedule_id"],
        type: "foreign key",
        name: "employment_records_work_schedule_id_fkey",
        references: {
          table: "work_schedules",
          field: "id",
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
        transaction,
      });

      // 6. Add index on employment_records [company_id, work_schedule_id]
      await q.addIndex(
        "employment_records",
        ["company_id", "work_schedule_id"],
        {
          name: "employment_records_company_schedule_idx",
          transaction,
        }
      );
    });
  },

  async down({ context: q }) {
    await q.sequelize.transaction(async (transaction) => {
      await q.removeIndex(
        "employment_records",
        "employment_records_company_schedule_idx",
        { transaction }
      );
      await q.removeConstraint(
        "employment_records",
        "employment_records_work_schedule_id_fkey",
        { transaction }
      );
      await q.removeColumn("employment_records", "work_schedule_id", {
        transaction,
      });
      await q.dropTable("work_schedules", { transaction });
    });
  },
};
