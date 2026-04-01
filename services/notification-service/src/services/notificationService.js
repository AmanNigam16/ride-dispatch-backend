const logger = require("../config/logger");
const Notification = require("../models/Notification");

exports.sendNotification = async (event, data) => {

  const userId = data.customerId || data.driverId;
  const rideId = data._id;

  let message = "";

  switch (event) {

    case "ride_created":
      message = "New ride available";
      logger.info("Notify drivers: New ride available", {
        rideId,
        userId
      });
      break;

    case "ride_accepted":
      message = "Your ride has been accepted";
      logger.info("Notify customer: Ride accepted", {
        rideId,
        userId
      });
      break;

    case "ride_status_updated":
      message = `Ride status: ${data.status}`;
      logger.info("Notify user: Ride status updated", {
        rideId,
        status: data.status,
        userId
      });
      break;

    default:
      message = "Notification";
      logger.warn("Unknown event type", { event });
  }

  // ✅ Save to DB
  await Notification.create({
    userId,
    rideId,
    event,
    message
  });

  logger.info("Notification stored", { rideId, userId });
};
