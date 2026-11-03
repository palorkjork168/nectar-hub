const express = require("express");
const locationController = require("../controllers/location.controller");
const authenticate = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authenticate);

// List locations for a company
router.get("/company/:companyId", locationController.listLocations);

// Single location operations
router.get("/:id", locationController.getLocationById);
router.post("/company/:companyId", locationController.createLocation);
router.put("/:id", locationController.updateLocation);
router.patch("/:id", locationController.updateLocation);
router.delete("/:id", locationController.deactivateLocation);
router.patch("/:id/deactivate", locationController.deactivateLocation);

module.exports = router;
