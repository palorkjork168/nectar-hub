const express = require("express");
const authenticate = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const employmentController = require("../controllers/employment.controller");
const shiftController = require("../controllers/shift.controller");
const { assignScheduleSchema } = require("../validators/workSchedule.validator");

const router = express.Router();

router.use(authenticate);

router.get("/me", employmentController.getMyActiveEmployments);

// Direct schedule assignment on employment resource
router.patch(
  "/:id/schedule",
  validate(assignScheduleSchema),
  shiftController.assignScheduleToEmployment
);
router.delete("/:id/schedule", shiftController.unassignScheduleFromEmployment);

module.exports = router;
