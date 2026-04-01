const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: String,
  rideId: String,
  event: String,
  message: String,
  status: {
    type: String,
    default: "sent"
  }
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);