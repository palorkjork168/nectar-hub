const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CompanyLocation = sequelize.define(
  "CompanyLocation",
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
  },
  {
    tableName: "company_locations",
    timestamps: true,
    underscored: true,
  }
);

module.exports = CompanyLocation;
