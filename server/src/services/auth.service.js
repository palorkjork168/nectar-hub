const bcrypt = require("bcryptjs");
const { User, Role } = require("../models");
const generateToken = require("../utils/generateToken");
const emailService = require("./email.service");

const register = async (userData) => {
  const { first_name, last_name, email, password, phone } = userData;

  // Check if email already exists
  const existingUser = await User.findOne({
    where: { email },
  });

  if (existingUser) {
    throw new Error("Email is already registered");
  }

  // Hash the password
  const password_hash = await bcrypt.hash(password, 12);

  // Create user
  const user = await User.create({
    first_name,
    last_name,
    email,
    password_hash,
    phone: phone || null,
  });

  // assign role
  const jobSeekerRole = await Role.findOne({
    where: {
      name: "JOB_SEEKER",
    },
  });

  await user.addRole(jobSeekerRole);

  // Asynchronous non-blocking welcome email delivery
  emailService
    .sendTemplateEmail("welcome", user.email, {
      name: `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Member",
      email: user.email,
    })
    .catch((err) => console.error("Welcome email delivery failed:", err.message));

  return user;
};

const login = async (userData) => {
  const { email, password } = userData;

  // Find user by email with roles
  const user = await User.findOne({
    where: { email },
    include: [
      {
        model: Role,
        through: { attributes: [] },
        attributes: ["id", "name"],
      },
    ],
  });

  // Check if user exists
  if (!user) {
    throw new Error("Invalid email or password");
  }

  // Check user status
  if (user.status !== "ACTIVE") {
    throw new Error("Your account is not active");
  }

  // Compare password
  const isPasswordValid = await bcrypt.compare(
    password,
    user.password_hash
  );

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  // Generate JWT
  const token = generateToken(user);

  return {
    user,
    token,
  };
};

module.exports = {
  register,
  login,
};