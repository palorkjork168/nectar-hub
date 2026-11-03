const express = require("express");
const authController = require("../controllers/auth.controller");
const validate = require("../middleware/validate.middleware");
const authenticate = require("../middleware/auth.middleware");

const {
  registerSchema,
  loginSchema,
  changePasswordSchema,
} = require("../validators/auth.validator");

const router = express.Router();

router.post(
  "/register",
  validate(registerSchema),
  authController.register
);

router.post(
  "/login",
  validate(loginSchema),
  authController.login
);

router.get(
  "/me",
  authenticate,
  authController.getMe
);

router.put(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword
);

module.exports = router;