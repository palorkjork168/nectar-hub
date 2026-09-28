const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const WorkSchedule = sequelize.define(
  "WorkSchedule",
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
      type: DataTypes.STRING,
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
  },
  {
    tableName: "work_schedules",
    timestamps: true,
    underscored: true,
  }
);

module.exports = WorkSchedule;
