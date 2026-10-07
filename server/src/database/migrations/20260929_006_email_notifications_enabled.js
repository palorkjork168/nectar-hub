const { DataTypes } = require("sequelize");

module.exports = {
  async up({ context: q }) {
    await q.sequelize.transaction(async (transaction) => {
      // Check if column exists first
      const tableDesc = await q.describeTable("users");
      if (!tableDesc.email_notifications_enabled) {
        await q.addColumn(
          "users",
          "email_notifications_enabled",
          {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: false,
          },
          { transaction }
        );
      }
    });
  },

  async down({ context: q }) {
    await q.sequelize.transaction(async (transaction) => {
      const tableDesc = await q.describeTable("users");
      if (tableDesc.email_notifications_enabled) {
        await q.removeColumn("users", "email_notifications_enabled", { transaction });
      }
    });
  },
};
