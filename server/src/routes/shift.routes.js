const express = require("express");
const shiftController = require("../controllers/shift.controller");
const authenticate = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const {
  workScheduleSchema,
  updateWorkScheduleSchema,
  assignScheduleSchema,
} = require("../validators/workSchedule.validator");

const router = express.Router();

router.use(authenticate);

// Employee's own schedule
router.get("/my/current", shiftController.getMySchedule);

// Company schedules list
router.get("/company/:companyId", shiftController.listCompanySchedules);

// Single schedule operations
router.get("/:id", shiftController.getScheduleById);
router.get("/:id/employees", shiftController.getScheduleEmployees);

// Schedule mutations
router.post("/", validate(workScheduleSchema), shiftController.createSchedule);
router.put(
  "/:id",
  validate(updateWorkScheduleSchema),
  shiftController.updateSchedule
);
router.patch(
  "/:id",
  validate(updateWorkScheduleSchema),
  shiftController.updateSchedule
);
router.patch("/:id/status", shiftController.setScheduleStatus);
router.delete("/:id", shiftController.deleteSchedule);

// Employment schedule assignments
router.patch(
  "/employment/:employmentRecordId",
  validate(assignScheduleSchema),
  shiftController.assignScheduleToEmployment
);
router.delete(
  "/employment/:employmentRecordId",
  shiftController.unassignScheduleFromEmployment
);

module.exports = router;
