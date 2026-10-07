// run_all_tests.js
const { spawnSync } = require("child_process");
const path = require("path");

const testSuites = [
  "test_attendance_schedule_integration.js",
  "test_shift_schedule_flow.js",
  "test_attendance_tenant_safety.js",
  "test_leave_tenant_safety.js",
  "test_master_lifecycle.js",
  "test_advanced_rbac_flow.js",
  "test_analytics_flow.js",
  "test_notification_flow.js",
  "test_employment_membership.js",
  "test_global_role_safety.js",
  "test_cors_security.js",
  "test_structured_hiring_flow.js",
  "test_attendance_analytics_flow.js",
  "test_security_audit_flow.js",
  "test_email_flow.js",
  "test_v1_production_readiness.js",
];

console.log("==================================================");
console.log(`RUNNING FULL REGRESSION SUITE (${testSuites.length} SUITES)`);
console.log("==================================================\n");

let passed = 0;
let failed = 0;

for (const suite of testSuites) {
  const filePath = path.join(__dirname, suite);
  console.log(`\n▶ [RUNNING] ${suite}...`);
  const result = spawnSync("node", [filePath], {
    stdio: "inherit",
    env: process.env,
  });

  if (result.status === 0) {
    console.log(`✓ [PASSED] ${suite}`);
    passed++;
  } else {
    console.error(`❌ [FAILED] ${suite} with exit code ${result.status}`);
    failed++;
    process.exit(1);
  }
}

console.log("\n==================================================");
console.log(`ALL ${passed} TEST SUITES PASSED (0 FAILURES)`);
console.log("==================================================");
process.exit(0);
