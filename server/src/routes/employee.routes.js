const express = require("express");

const employeeController = require("../controllers/employee.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize.middleware");

const router = express.Router();

router.use(authenticate);
router.use(authorize("ADMIN"));

router.get("/", employeeController.getAllEmployees);
router.get("/:id", employeeController.getEmployeeById);
router.post("/", employeeController.createEmployee);
router.put("/:id", employeeController.updateEmployee);
// Kept for API compatibility. This endpoint assigns a global role additively.
router.put("/:id/role", employeeController.assignGlobalRole);
router.put("/:id/status", employeeController.updateEmployeeStatus);

module.exports = router;
