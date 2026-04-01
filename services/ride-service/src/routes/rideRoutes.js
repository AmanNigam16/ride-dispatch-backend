const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { getAvailableRides, getMyRides, getRideLocation } = require("../controllers/rideController");
const { createRide, acceptRide, updateRideStatus } = require("../controllers/rideController");

router.post("/", authMiddleware, roleMiddleware(["customer"]), createRide);
router.post("/accept", authMiddleware, roleMiddleware(["driver"]), acceptRide);

// ✅ FIXED: added auth + role protection
router.post("/status", authMiddleware, roleMiddleware(["driver"]), updateRideStatus);

router.get("/available", authMiddleware, roleMiddleware(["driver"]), getAvailableRides);
router.get("/my", authMiddleware, getMyRides);

// ✅ NEW: location route (frontend was calling this)
router.get("/:rideId/location", authMiddleware, getRideLocation);

module.exports = router;