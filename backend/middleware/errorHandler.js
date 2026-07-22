function errorHandler(err, _req, res, _next) {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "Image must be 2 MB or smaller." });
  }

  if (err.message && err.message.includes("Only JPEG")) {
    return res.status(400).json({ message: err.message });
  }

  if (err.code === 11000) {
    return res.status(409).json({ message: "A record with that value already exists." });
  }

  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error.",
  });
}

module.exports = { errorHandler };
