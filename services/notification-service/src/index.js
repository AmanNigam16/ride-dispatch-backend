require("dotenv").config();
const express = require("express");

const connectDB = require("./config/db");
const logger = require("./config/logger");

const app = express();
const PORT = process.env.PORT || 5003;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Notification Service Running");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "notification-service",
    mode: "idle"
  });
});

const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, "0.0.0.0", () => {
      logger.info("Notification service running", {
        port: PORT,
        mode: "idle"
      });
    });
  } 
  catch (err) {
    logger.error("Error starting service", { error: err.message });
  }
};

start();
