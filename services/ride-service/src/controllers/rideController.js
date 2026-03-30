const { pub } = require("../config/redis");
const Ride = require("../models/Ride");
const { producer, USE_KAFKA } = require("../config/kafka");
const logger = require("../config/logger");

// CREATE RIDE
exports.createRide = async (req, res, next) => {
  try {

    const { pickupLocation, dropLocation } = req.body;

    // ✅ Secure customerId from JWT
    const customerId = req.user.id;

    const ride = await Ride.create({
      customerId,
      pickupLocation,
      dropLocation
    });

    logger.info("Ride created", { rideId: ride._id, customerId });

    // ✅ KAFKA
    if (USE_KAFKA && producer) {
      await producer.send({
        topic: "ride_created",
        messages: [
          {
            value: JSON.stringify({
              event: "ride_created",
              version: 1,
              timestamp: new Date().toISOString(),
              data: ride
            })
          }
        ]
      });
    }

    await pub.publish("ride_updates", JSON.stringify({              // We moved from direct Socket.IO emit → Redis Pub/Sub.
      event: "new_ride",
      payload: ride
    }));

    // This below is the Socket.io emit which we replaced with the above redis pub-sub model
    // ✅ emit AFTER creation (inside function)
    // const io = req.app.get("io");               
    // io.emit("new_ride", ride);                  
    // OR above 2 lines can also be written as-> req.app.get("io").emit("new_ride", ride); as a single line.

    res.status(201).json(ride);

  } catch (err) {
    logger.error("Error occurred", { error: err.message });
    next(err);
  }
};


// ACCEPT RIDE
exports.acceptRide = async (req, res, next) => {
  try {

    // const { rideId, driverId } = req.body;    // This line is replaced by below 2 lines as they are more secure as they prevent fake driver assignment using JWT trusted data.
    const { rideId } = req.body;
    const driverId = req.user.id;                // This only allots the user id to the driver which is returned by JWT after verification.
    
    // ✅ Race condition safe update
    const ride = await Ride.findOneAndUpdate(
      { _id: rideId, status: "requested" },
      { driverId, status: "accepted" },
      { returnDocument: "after" }
    );

    // If already taken
    if (!ride) {
      logger.warn("Ride accept failed", { rideId });

      return res.status(400).json({ message: "Ride already taken or not found" });
    }

    logger.info("Ride accepted", { rideId: ride._id, driverId });

    // ✅ KAFKA
    if (USE_KAFKA && producer) {
      await producer.send({
        topic: "ride_accepted",
        messages: [
          {
            value: JSON.stringify({
              event: "ride_accepted",
              version: 1,
              timestamp: new Date().toISOString(),
              data: ride
            })
          }
        ]
      });
    }

    // ✅ Redis Pub-Sub
    await pub.publish("ride_updates", JSON.stringify({
      event: "ride_accepted",
      payload: ride
    }));

    res.json(ride);

  } catch (err) {
    logger.error("Error occurred", { error: err.message });
    next(err);
  }
};


// UPDATE RIDE STATUS
exports.updateRideStatus = async (req, res, next) => {
  try {
    const { rideId, status } = req.body;

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    ride.status = status;
    await ride.save();

    logger.info("Ride status updated", { rideId: ride._id, status });

    // ✅ KAFKA
    if (USE_KAFKA && producer) {
      await producer.send({
        topic: "ride_status_updated",
        messages: [
          {
            value: JSON.stringify({
              event: "ride_status_updated",
              version: 1,
              timestamp: new Date().toISOString(),
              data: ride
            })
          }
        ]
      });
    }

    // ✅ Redis Pub-Sub model
    await pub.publish("ride_updates", JSON.stringify({
      event: "ride_status_updated",
      payload: ride
    }));
  
    // ✅ emit AFTER status update
    // const io = req.app.get("io");
    // io.emit("ride_status_updated", ride);
    
    res.json(ride);

  } catch (err) {
    logger.error("Error occurred", { error: err.message });
    next(err);
  }
};


// GET AVAILABLE RIDES (for drivers)
exports.getAvailableRides = async (req, res, next) => {
  try {
    // ❌ Removed populate (microservice issue)
    const rides = await Ride.find({ status: "requested" });

    logger.info("Fetched available rides", { count: rides.length });

    res.json(rides);

  } catch (err) {
    logger.error("Error fetching available rides", { error: err.message });
    next(err);
  }
};


// GET MY RIDES (driver + customer)
exports.getMyRides = async (req, res, next) => {
  try {

    let rides;

    if (req.user.role === "customer") {
      // ❌ Removed populate
      rides = await Ride.find({ customerId: req.user.id });
    } else {
      // ❌ Removed populate
      rides = await Ride.find({ driverId: req.user.id });
    }

    logger.info("Fetched user rides", { userId: req.user.id });

    res.json(rides);

  } catch (err) {
    logger.error("Error fetching user rides", { error: err.message });
    next(err);
  }
};


// ✅ NEW: GET RIDE LOCATION (fix for frontend polling)
exports.getRideLocation = async (req, res, next) => {
  try {
    const { rideId } = req.params;

    const ride = await Ride.findById(rideId);

    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    res.json({
      location: ride.currentLocation || null
    });

  } catch (err) {
    logger.error("Error fetching ride location", { error: err.message });
    next(err);
  }
};