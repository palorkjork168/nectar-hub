const {
  User,
  UserProfile,
  UserSkill,
  Education,
  Experience,
} = require("../models");

const cloudinary = require(
  "../config/cloudinary"
);

const getMyProfile = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: [
      "id",
      "first_name",
      "last_name",
      "email",
    ],

    include: [
      {
        model: UserProfile,
      },
      {
        model: UserSkill,
      },
      {
        model: Education,
      },
      {
        model: Experience,
      },
    ],
  });

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return user;
};

const updateMyProfile = async (
  userId,
  profileData
) => {
  const { first_name, last_name, phone, ...userProfileFields } = profileData;

  const userUpdateData = {};
  if (first_name !== undefined && first_name !== null) userUpdateData.first_name = first_name;
  if (last_name !== undefined && last_name !== null) userUpdateData.last_name = last_name;
  if (phone !== undefined && phone !== null) userUpdateData.phone = phone;

  if (Object.keys(userUpdateData).length > 0) {
    await User.update(userUpdateData, {
      where: { id: userId },
    });
  }

  const [profile] =
    await UserProfile.findOrCreate({
      where: {
        user_id: userId,
      },
      defaults: {
        user_id: userId,
      },
    });

  const profileUpdateData = { ...userProfileFields };
  if (phone !== undefined && phone !== null) profileUpdateData.phone = phone;

  await profile.update(profileUpdateData);

  return getMyProfile(userId);
};

const createSkill = async (
  userId,
  skillData
) => {
  const skill = await UserSkill.create({
    user_id: userId,
    ...skillData,
  });

  return skill;
};

const updateSkill = async (
  skillId,
  userId,
  skillData
) => {
  const skill = await UserSkill.findOne({
    where: {
      id: skillId,
      user_id: userId,
    },
  });

  if (!skill) {
    const error = new Error(
      "Skill not found"
    );
    error.statusCode = 404;
    throw error;
  }

  await skill.update(skillData);

  return skill;
};

const deleteSkill = async (
  skillId,
  userId
) => {
  const skill = await UserSkill.findOne({
    where: {
      id: skillId,
      user_id: userId,
    },
  });

  if (!skill) {
    const error = new Error(
      "Skill not found"
    );
    error.statusCode = 404;
    throw error;
  }

  await skill.destroy();

  return true;
};

const createEducation = async (
  userId,
  educationData
) => {
  const education =
    await Education.create({
      user_id: userId,
      ...educationData,
    });

  return education;
};

const updateEducation = async (
  educationId,
  userId,
  educationData
) => {
  const education =
    await Education.findOne({
      where: {
        id: educationId,
        user_id: userId,
      },
    });

  if (!education) {
    const error = new Error(
      "Education not found"
    );
    error.statusCode = 404;
    throw error;
  }

  await education.update(educationData);

  return education;
};

const deleteEducation = async (
  educationId,
  userId
) => {
  const education =
    await Education.findOne({
      where: {
        id: educationId,
        user_id: userId,
      },
    });

  if (!education) {
    const error = new Error(
      "Education not found"
    );
    error.statusCode = 404;
    throw error;
  }

  await education.destroy();

  return true;
};

const createExperience = async (
  userId,
  experienceData
) => {
  const experience =
    await Experience.create({
      user_id: userId,
      ...experienceData,
    });

  return experience;
};

const updateExperience = async (
  experienceId,
  userId,
  experienceData
) => {
  const experience =
    await Experience.findOne({
      where: {
        id: experienceId,
        user_id: userId,
      },
    });

  if (!experience) {
    const error = new Error(
      "Experience not found"
    );
    error.statusCode = 404;
    throw error;
  }

  await experience.update(experienceData);

  return experience;
};

const deleteExperience = async (
  experienceId,
  userId
) => {
  const experience =
    await Experience.findOne({
      where: {
        id: experienceId,
        user_id: userId,
      },
    });

  if (!experience) {
    const error = new Error(
      "Experience not found"
    );
    error.statusCode = 404;
    throw error;
  }

  await experience.destroy();

  return true;
};

const getOrCreateProfile = async (
  userId
) => {
  const [profile] =
    await UserProfile.findOrCreate({
      where: {
        user_id: userId,
      },

      defaults: {
        user_id: userId,
      },
    });

  return profile;
};

const uploadAvatar = async (
  userId,
  file
) => {
  if (!file) {
    const error = new Error(
      "Avatar file is required"
    );

    error.statusCode = 400;

    throw error;
  }

  const profile =
    await getOrCreateProfile(userId);

  // Delete old avatar
  if (profile.avatar_public_id) {
    await cloudinary.uploader.destroy(
      profile.avatar_public_id
    );
  }

  await profile.update({
    avatar_url: file.path,
    avatar_public_id: file.filename,
  });

  return profile;
};

const uploadResume = async (
  userId,
  file
) => {
  if (!file) {
    const error = new Error(
      "Resume file is required"
    );

    error.statusCode = 400;

    throw error;
  }

  const profile =
    await getOrCreateProfile(userId);

  // Delete old resume
  if (profile.resume_public_id) {
    await cloudinary.uploader.destroy(
      profile.resume_public_id,
      {
        resource_type: "raw",
      }
    );
  }

  await profile.update({
    resume_url: file.path,
    resume_public_id: file.filename,
  });

  return profile;
};

module.exports = {
  getMyProfile,
  updateMyProfile,

  createSkill,
  updateSkill,
  deleteSkill,

  createEducation,
  updateEducation,
  deleteEducation,

  createExperience,
  updateExperience,
  deleteExperience,

  uploadAvatar,
  uploadResume,
};