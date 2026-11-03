const { DataTypes } = require("sequelize");

module.exports = {
  async up({ context: q }) {
    await q.sequelize.transaction(async (transaction) => {
      // 1. Alter attendances table to support manual corrections & GPS distinction
      await q.addColumn(
        "attendances",
        "is_corrected",
        {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        { transaction }
      );

      await q.addColumn(
        "attendances",
        "location_status",
        {
          type: DataTypes.STRING(40),
          allowNull: true,
          defaultValue: "VERIFIED_GPS",
        },
        { transaction }
      );

      await q.addColumn(
        "attendances",
        "original_check_in_time",
        {
          type: DataTypes.DATE,
          allowNull: true,
        },
        { transaction }
      );

      await q.addColumn(
        "attendances",
        "original_check_out_time",
        {
          type: DataTypes.DATE,
          allowNull: true,
        },
        { transaction }
      );

      // Make check_in_lat and check_in_long nullable for manual historical punch corrections
      await q.changeColumn(
        "attendances",
        "check_in_lat",
        {
          type: DataTypes.DECIMAL(10, 8),
          allowNull: true,
        },
        { transaction }
      );

      await q.changeColumn(
        "attendances",
        "check_in_long",
        {
          type: DataTypes.DECIMAL(11, 8),
          allowNull: true,
        },
        { transaction }
      );

      // 2. Create attendance_correction_requests table
      await q.createTable(
        "attendance_correction_requests",
        {
          id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
          },
          attendance_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
              model: "attendances",
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
            allowNull: true,
            references: {
              model: "employment_records",
              key: "id",
            },
            onDelete: "SET NULL",
          },
          work_schedule_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
              model: "work_schedules",
              key: "id",
            },
            onDelete: "SET NULL",
          },
          correction_type: {
            type: DataTypes.STRING(30),
            allowNull: false, // MISSING_CHECK_OUT, MISSING_CHECK_IN, INCORRECT_TIMES, MISSED_SHIFT
          },
          requested_check_in_time: {
            type: DataTypes.DATE,
            allowNull: true,
          },
          requested_check_out_time: {
            type: DataTypes.DATE,
            allowNull: true,
          },
          original_check_in_time: {
            type: DataTypes.DATE,
            allowNull: true,
          },
          original_check_out_time: {
            type: DataTypes.DATE,
            allowNull: true,
          },
          reason: {
            type: DataTypes.TEXT,
            allowNull: false,
          },
          status: {
            type: DataTypes.STRING(30),
            allowNull: false,
            defaultValue: "PENDING", // PENDING, APPROVED, REJECTED
          },
          reviewed_by: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
              model: "users",
              key: "id",
            },
            onDelete: "SET NULL",
          },
          reviewed_at: {
            type: DataTypes.DATE,
            allowNull: true,
          },
          review_note: {
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

      // Indexes
      await q.addIndex(
        "attendance_correction_requests",
        ["company_id", "status"],
        {
          name: "attendance_corrections_company_status_idx",
          transaction,
        }
      );

      await q.addIndex(
        "attendance_correction_requests",
        ["user_id", "status"],
        {
          name: "attendance_corrections_user_status_idx",
          transaction,
        }
      );

      await q.addIndex(
        "attendance_correction_requests",
        ["attendance_id"],
        {
          name: "attendance_corrections_attendance_id_idx",
          transaction,
        }
      );

      // Partial unique index preventing duplicate pending requests for the same attendance record
      await q.sequelize.query(
        `CREATE UNIQUE INDEX attendance_corrections_unique_pending_att 
         ON attendance_correction_requests (user_id, attendance_id) 
         WHERE status = 'PENDING' AND attendance_id IS NOT NULL;`,
        { transaction }
      );
    });
  },

  async down({ context: q }) {
    await q.sequelize.transaction(async (transaction) => {
      await q.dropTable("attendance_correction_requests", { transaction });
      await q.removeColumn("attendances", "original_check_out_time", { transaction });
      await q.removeColumn("attendances", "original_check_in_time", { transaction });
      await q.removeColumn("attendances", "location_status", { transaction });
      await q.removeColumn("attendances", "is_corrected", { transaction });
    });
  },
};
