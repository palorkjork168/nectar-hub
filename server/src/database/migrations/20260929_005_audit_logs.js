const { DataTypes } = require("sequelize");

module.exports = {
  async up({ context: q }) {
    await q.sequelize.transaction(async (transaction) => {
      await q.createTable(
        "audit_logs",
        {
          id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
          },
          company_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
              model: "companies",
              key: "id",
            },
            onDelete: "SET NULL",
          },
          actor_user_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
              model: "users",
              key: "id",
            },
            onDelete: "SET NULL",
          },
          action: {
            type: DataTypes.STRING(60),
            allowNull: false,
          },
          entity_type: {
            type: DataTypes.STRING(40),
            allowNull: false,
          },
          entity_id: {
            type: DataTypes.STRING(100),
            allowNull: true,
          },
          description: {
            type: DataTypes.TEXT,
            allowNull: false,
          },
          metadata: {
            type: DataTypes.JSONB,
            defaultValue: {},
            allowNull: false,
          },
          ip_address: {
            type: DataTypes.STRING(45),
            allowNull: true,
          },
          user_agent: {
            type: DataTypes.TEXT,
            allowNull: true,
          },
          created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
          },
        },
        { transaction }
      );

      await q.addIndex("audit_logs", ["company_id", "created_at"], {
        name: "audit_logs_company_created_at_idx",
        transaction,
      });

      await q.addIndex("audit_logs", ["actor_user_id", "created_at"], {
        name: "audit_logs_actor_created_at_idx",
        transaction,
      });

      await q.addIndex("audit_logs", ["action"], {
        name: "audit_logs_action_idx",
        transaction,
      });

      await q.addIndex("audit_logs", ["entity_type", "entity_id"], {
        name: "audit_logs_entity_idx",
        transaction,
      });
    });
  },

  async down({ context: q }) {
    await q.sequelize.transaction(async (transaction) => {
      await q.dropTable("audit_logs", { transaction });
    });
  },
};
