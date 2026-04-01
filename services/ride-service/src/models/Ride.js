const mongoose = require("mongoose");

const rideSchema = new mongoose.Schema(
{
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User"
  },

  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  pickupLocation: {
    type: String,
    required: true,
    trim: true
  },

  dropLocation: {
    type: String,
    required: true,
    trim: true
  },

  status: {
    type: String,
    enum: ["requested", "accepted", "ongoing", "completed"],
    default: "requested"
  },

  currentLocation: {
    lat: {
      type: Number
    },
    lng: {
      type: Number
    }
  }

},
{ timestamps: true }
);

module.exports = mongoose.model("Ride", rideSchema);
