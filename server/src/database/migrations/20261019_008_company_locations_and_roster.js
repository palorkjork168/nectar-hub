const { DataTypes } = require("sequelize");

module.exports = {
  async up({ context: q }) {
    await q.sequelize.transaction(async (transaction) => {
      // 1. Create company_locations table (Workplaces & Geofences)
      await q.createTable(
        "company_locations",
        {
          id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
          },
          company_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
              model: "companies",
              key: "id",
            },
            onDelete: "CASCADE",
          },
          name: {
            type: DataTypes.STRING(255),
            allowNull: false,
          },
          address: {
            type: DataTypes.TEXT,
            allowNull: true,
          },
          latitude: {
            type: DataTypes.DECIMAL(10, 8),
            allowNull: false,
          },
          longitude: {
            type: DataTypes.DECIMAL(11, 8),
            allowNull: false,
          },
          radius_meters: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 100,
          },
          is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
          },
          created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
          },
          updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
          },
        },
        { transaction }
      );

      // Indexes for company_locations
      await q.addIndex("company_locations", ["company_id", "is_active"], {
        name: "company_locations_company_active_idx",
        transaction,
      });

      // 2. Add location_id to employment_records
      await q.addColumn(
        "employment_records",
        "location_id",
        {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: "company_locations",
            key: "id",
          },
          onDelete: "SET NULL",
        },
        { transaction }
      );

      // 3. Add location_id to attendances
      await q.addColumn(
        "attendances",
        "location_id",
        {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: "company_locations",
            key: "id",
          },
          onDelete: "SET NULL",
        },
        { transaction }
      );

      // 4. Create shift_assignments table (Weekly Roster & Specific Date Assignments)
      await q.createTable(
        "shift_assignments",
        {
          id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
          },
          company_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
              model: "companies",
              key: "id",
            },
            onDelete: "CASCADE",
          },
          employment_record_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
              model: "employment_records",
              key: "id",
            },
            onDelete: "CASCADE",
          },
          user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
              model: "users",
              key: "id",
            },
            onDelete: "CASCADE",
          },
          work_schedule_id: {
            type: DataTypes.UUID,
            allowNull: true, // Null when is_rest_day = true
            references: {
              model: "work_schedules",
              key: "id",
            },
            onDelete: "SET NULL",
          },
          shift_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
          },
          is_rest_day: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          status: {
            type: DataTypes.STRING(30),
            allowNull: false,
            defaultValue: "SCHEDULED", // SCHEDULED, COMPLETED, CANCELLED
          },
          notes: {
            type: DataTypes.TEXT,
            allowNull: true,
          },
          created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
          },
          updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
          },
        },
        { transaction }
      );

      // Unique constraint: an employee cannot have multiple conflicting shift assignments on the same date
      await q.addIndex(
        "shift_assignments",
        ["employment_record_id", "shift_date"],
        {
          unique: true,
          name: "shift_assignments_emp_date_unique",
          transaction,
        }
      );

      await q.addIndex("shift_assignments", ["company_id", "shift_date"], {
        name: "shift_assignments_company_date_idx",
        transaction,
      });

      await q.addIndex("shift_assignments", ["user_id", "shift_date"], {
        name: "shift_assignments_user_date_idx",
        transaction,
      });
    });
  },

  async down({ context: q }) {
    await q.sequelize.transaction(async (transaction) => {
      await q.dropTable("shift_assignments", { transaction });
      await q.removeColumn("attendances", "location_id", { transaction });
      await q.removeColumn("employment_records", "location_id", { transaction });
      await q.dropTable("company_locations", { transaction });
    });
  },
};
