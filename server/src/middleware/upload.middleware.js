const path = require("path");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "sakol-universe/avatars",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      {
        width: 500,
        height: 500,
        crop: "fill",
      },
    ],
  },
});

const resumeStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "sakol-universe/resumes",
    resource_type: "raw",
  },
});

const DANGEROUS_EXTENSIONS = [
  ".exe", ".bat", ".cmd", ".sh", ".bash", ".php", ".phtml", ".pl", ".py", ".js", ".vbs", ".jar", ".msi"
];

function isSafeFilename(filename) {
  if (!filename || typeof filename !== "string") return false;
  // Reject null bytes, path traversal
  if (filename.includes("\0") || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return false;
  }
  const lower = filename.toLowerCase();
  for (const dangerous of DANGEROUS_EXTENSIONS) {
    if (lower.includes(dangerous)) {
      return false;
    }
  }
  return true;
}

const avatarFileFilter = (req, file, cb) => {
  if (!isSafeFilename(file.originalname)) {
    return cb(new Error("Dangerous or invalid file name detected"));
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  const allowedExts = [".jpg", ".jpeg", ".png", ".webp"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG and WEBP images are allowed"));
  }
};

const resumeFileFilter = (req, file, cb) => {
  if (!isSafeFilename(file.originalname)) {
    return cb(new Error("Dangerous or invalid file name detected"));
  }

  const allowedTypes = ["application/pdf"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(file.mimetype) && ext === ".pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"));
  }
};

const avatarUpload = multer({
  storage: avatarStorage,
  fileFilter: avatarFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const resumeUpload = multer({
  storage: resumeStorage,
  fileFilter: resumeFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

module.exports = {
  avatarUpload,
  resumeUpload,
  isSafeFilename,
};
