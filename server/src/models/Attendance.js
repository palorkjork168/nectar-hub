const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Attendance = sequelize.define(
  "Attendance",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    company_id: { type: DataTypes.UUID, allowNull: true },
    employment_record_id: { type: DataTypes.UUID, allowNull: true },
    check_in_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    check_in_lat: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
    },
    check_in_long: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false,
    },
    check_out_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    check_out_lat: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
    },
    check_out_long: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
    },
    work_schedule_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    is_late: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    late_minutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    actual_hours: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    completion_percentage: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    is_early_departure: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    early_departure_minutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "IN_PROGRESS",
    },
  },
  {
    tableName: "attendances",
    timestamps: true,
    underscored: true,
  }
);

Attendance.associate = (models) => {
  if (models.WorkSchedule) {
    Attendance.belongsTo(models.WorkSchedule, {
      foreignKey: "work_schedule_id",
      as: "schedule",
    });
  }
};

module.exports = Attendance;
