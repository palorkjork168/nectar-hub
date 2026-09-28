const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const EmploymentRecord = sequelize.define(
  "EmploymentRecord",
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
    company_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    department_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    position_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    work_schedule_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("ACTIVE", "INACTIVE", "TERMINATED"),
      allowNull: false,
      defaultValue: "ACTIVE",
    },
    employment_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "employment_records",
    timestamps: true,
    underscored: true,
  }
);

module.exports = EmploymentRecord;
