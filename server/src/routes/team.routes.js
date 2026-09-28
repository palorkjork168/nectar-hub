const express = require("express");
const teamController = require("../controllers/team.controller");
const authenticate = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authenticate);

// Company Team Management
router.get("/:companyId/employees", teamController.getCompanyEmployees);
router.get("/:companyId/team", teamController.getCompanyTeam);
router.post("/:companyId/team/roles", teamController.assignCompanyRole);
router.delete("/:companyId/team/roles/:assignmentId", teamController.removeCompanyRole);

module.exports = router;
