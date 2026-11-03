const express = require("express");

const attendanceController = require("../controllers/attendance.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize.middleware");

const router = express.Router();

router.use(authenticate);

// Employee routes
router.post("/check-in", authorize("EMPLOYEE", "ADMIN"), attendanceController.checkIn);
router.post("/check-out", authorize("EMPLOYEE", "ADMIN"), attendanceController.checkOut);
router.get("/me", authorize("EMPLOYEE", "ADMIN"), attendanceController.getMyAttendance);

// Correction request routes
router.post("/corrections", authorize("EMPLOYEE", "ADMIN"), attendanceController.submitCorrection);
router.get("/corrections/me", authorize("EMPLOYEE", "ADMIN"), attendanceController.getMyCorrections);
router.get("/corrections/company/:companyId", attendanceController.getCompanyCorrections);
router.get("/corrections", authorize("ADMIN"), attendanceController.getAllCorrections);
router.patch("/corrections/:id/approve", attendanceController.approveCorrection);
router.patch("/corrections/:id/reject", attendanceController.rejectCorrection);
router.post("/corrections/batch-review", attendanceController.batchReviewCorrections);

// Company attendance route (authorized via company permissions shifts.view / employees.view / attendance.manage)
router.get("/company/:companyId", attendanceController.getCompanyAttendance);

// Admin routes
router.get("/", authorize("ADMIN"), attendanceController.getAllAttendance);
router.get("/:employeeId", authorize("ADMIN"), attendanceController.getEmployeeAttendance);

module.exports = router;
