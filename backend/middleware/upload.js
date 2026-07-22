const multer = require("multer");

const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (IMAGE_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, WEBP, and GIF images are allowed."));
    }
  },
});

const profileUpload = upload.fields([
  { name: "avatar", maxCount: 1 },
  { name: "organizationLogo", maxCount: 1 },
  { name: "inGameScreenshot", maxCount: 1 },
]);

module.exports = { upload, profileUpload };
