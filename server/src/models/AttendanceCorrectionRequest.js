const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AttendanceCorrectionRequest = sequelize.define(
  "AttendanceCorrectionRequest",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    attendance_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    company_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    employment_record_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    work_schedule_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    correction_type: {
      type: DataTypes.STRING(30),
      allowNull: false,
      validate: {
        isIn: [["MISSING_CHECK_OUT", "MISSING_CHECK_IN", "INCORRECT_TIMES", "MISSED_SHIFT"]],
      },
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
      defaultValue: "PENDING",
      validate: {
        isIn: [["PENDING", "APPROVED", "REJECTED"]],
      },
    },
    reviewed_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    reviewed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    review_note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "attendance_correction_requests",
    timestamps: true,
    underscored: true,
  }
);

module.exports = AttendanceCorrectionRequest;
