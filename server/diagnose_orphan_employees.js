require("dotenv").config();

const { User, Role, EmployeeProfile, EmploymentRecord } = require("./src/models");

async function diagnoseOrphanEmployees() {
  try {
    const employees = await User.findAll({
      include: [
        {
          model: Role,
          where: { name: "EMPLOYEE" },
          through: { attributes: [] },
          attributes: [],
          required: true,
        },
        { model: EmployeeProfile, as: "employeeProfile", required: false, attributes: ["id"] },
        { model: EmploymentRecord, as: "employmentRecords", required: false, attributes: ["id"] },
      ],
      attributes: ["id", "email"],
    });

    const orphans = employees
      .filter((user) => user.employmentRecords.length === 0)
      .map((user) => ({
        user_id: user.id,
        email: user.email,
        employee_profile: Boolean(user.employeeProfile),
        employment_count: user.employmentRecords.length,
      }));

    console.log("ORPHAN EMPLOYEES");
    console.table(orphans);
    console.log(`Found ${orphans.length} employee user(s) without employment records.`);
  } catch (error) {
    console.error("Unable to diagnose orphan employees:", error.message);
    process.exitCode = 1;
  }
}

diagnoseOrphanEmployees();
