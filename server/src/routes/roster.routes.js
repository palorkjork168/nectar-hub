const express = require("express");
const rosterController = require("../controllers/roster.controller");
const authenticate = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authenticate);

// Get weekly roster for a company
router.get("/company/:companyId", rosterController.getWeeklyRoster);

// Shift assignment mutations
router.post("/company/:companyId/assign", rosterController.assignShift);
router.post("/company/:companyId/bulk-assign", rosterController.bulkAssignShifts);
router.delete("/company/:companyId/assignments/:assignmentId", rosterController.deleteShiftAssignment);

module.exports = router;
