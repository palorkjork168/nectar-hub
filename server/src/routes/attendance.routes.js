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

// Company attendance route (authorized via company permissions shifts.view / employees.view)
router.get("/company/:companyId", attendanceController.getCompanyAttendance);

// Admin routes
router.get("/", authorize("ADMIN"), attendanceController.getAllAttendance);
router.get("/:employeeId", authorize("ADMIN"), attendanceController.getEmployeeAttendance);

module.exports = router;
