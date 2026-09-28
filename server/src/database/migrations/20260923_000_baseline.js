// Existing tables predate migrations. This tracked no-op establishes the V2 baseline.
module.exports = {
  async up({ context: queryInterface }) {
    await queryInterface.sequelize.query("SELECT 1");
  },
  async down({ context: queryInterface }) {
    await queryInterface.sequelize.query("SELECT 1");
  },
};
