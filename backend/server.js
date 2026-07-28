require("dotenv").config();
const express = require("express");
const cors = require("cors");
const compression = require("compression");
const { connectDatabase, DB_NAME } = require("./config/database");
const authRoutes = require("./routes/auth");
const donationRoutes = require("./routes/donations");
const adminRoutes = require("./routes/admin");
const supportRoutes = require("./routes/support");
const notificationRoutes = require("./routes/notifications");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(compression());
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/", (_req, res) => {
  res.json({
    name: "Grand Wiki Tool API",
    status: "running",
    database: DB_NAME,
  });
});

app.get("/api/health", async (_req, res) => {
  const mongoose = require("mongoose");
  const dbState = mongoose.connection.readyState;
  const dbStatus =
    dbState === 1 ? "connected" : dbState === 2 ? "connecting" : "disconnected";

  res.json({
    status: "ok",
    database: dbStatus,
    databaseName: DB_NAME,
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/notifications", notificationRoutes);

app.use("/api", (_req, res) => {
  res.status(404).json({
    message: "API endpoint not found.",
  });
});

const { seedAdminUser } = require("./config/seedAdmin");
const { seedDonations } = require("./config/seedDonations");

app.use(errorHandler);

async function startServer() {
  try {
    await connectDatabase();
    await seedAdminUser();
    await seedDonations();
    app.listen(PORT, () => {
      console.log(`API server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
