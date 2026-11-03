const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ShiftAssignment = sequelize.define(
  "ShiftAssignment",
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
    employment_record_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    work_schedule_id: {
      type: DataTypes.UUID,
      allowNull: true,
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
      defaultValue: "SCHEDULED",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "shift_assignments",
    timestamps: true,
    underscored: true,
  }
);

module.exports = ShiftAssignment;
