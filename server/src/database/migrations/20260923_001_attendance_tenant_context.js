module.exports = {
  async up({ context: q }) {
    await q.sequelize.transaction(async (transaction) => {
      await q.addColumn("attendances", "company_id", { type: require("sequelize").DataTypes.UUID, allowNull: true }, { transaction });
      await q.addColumn("attendances", "employment_record_id", { type: require("sequelize").DataTypes.UUID, allowNull: true }, { transaction });
      await q.addConstraint("attendances", { fields: ["company_id"], type: "foreign key", name: "attendances_company_id_fkey", references: { table: "companies", field: "id" }, onDelete: "SET NULL", onUpdate: "CASCADE", transaction });
      await q.addConstraint("attendances", { fields: ["employment_record_id"], type: "foreign key", name: "attendances_employment_record_id_fkey", references: { table: "employment_records", field: "id" }, onDelete: "SET NULL", onUpdate: "CASCADE", transaction });
      await q.sequelize.query(`UPDATE attendances a SET employment_record_id = x.erid, company_id = x.company_id FROM (SELECT a2.id, er.id AS erid, er.company_id, count(er.id) OVER (PARTITION BY a2.id) AS matches FROM attendances a2 JOIN employment_records er ON er.user_id = a2.user_id AND er.start_date <= a2.check_in_time::date AND (er.end_date IS NULL OR er.end_date >= a2.check_in_time::date)) x WHERE a.id = x.id AND x.matches = 1`, { transaction });
      await q.addIndex("attendances", ["company_id", "check_in_time"], { name: "attendances_company_checkin_idx", transaction });
      await q.addIndex("attendances", ["employment_record_id", "check_in_time"], { name: "attendances_employment_checkin_idx", transaction });
    });
  },
  async down({ context: q }) { await q.sequelize.transaction(async (transaction) => { await q.removeIndex("attendances", "attendances_company_checkin_idx", { transaction }); await q.removeIndex("attendances", "attendances_employment_checkin_idx", { transaction }); await q.removeConstraint("attendances", "attendances_company_id_fkey", { transaction }); await q.removeConstraint("attendances", "attendances_employment_record_id_fkey", { transaction }); await q.removeColumn("attendances", "employment_record_id", { transaction }); await q.removeColumn("attendances", "company_id", { transaction }); }); },
};
