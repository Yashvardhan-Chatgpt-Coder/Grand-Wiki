const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const USER_DATA_FOLDER = "Rangrove - Grand Wiki - User Data";

const UPLOAD_PRESET = {
  fetch_format: "auto",
  quality: "auto:best",
  flags: "progressive",
  width: 1920,
  crop: "limit",
};

async function uploadUserImage(buffer, options = {}) {
  const { subfolder = "avatars", publicId } = options;
  const folder = `${USER_DATA_FOLDER}/${subfolder}`;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        overwrite: true,
        resource_type: "image",
        transformation: [{ ...UPLOAD_PRESET }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );
    uploadStream.end(buffer);
  });
}

async function deleteUserImage(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch {
    // Non-fatal if old asset is already gone
  }
}

function extractPublicIdFromUrl(url) {
  if (!url || !url.includes("res.cloudinary.com")) return null;
  const uploadIndex = url.indexOf("/upload/");
  if (uploadIndex === -1) return null;

  let path = url.slice(uploadIndex + 8);
  path = path.replace(/^v\d+\//, "");
  path = path.replace(/\.[a-zA-Z0-9]+$/, "");
  return decodeURIComponent(path);
}

module.exports = {
  cloudinary,
  USER_DATA_FOLDER,
  uploadUserImage,
  deleteUserImage,
  extractPublicIdFromUrl,
};
