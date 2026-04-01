require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const rideRoutes = require("./routes/rideRoutes");
const Ride = require("./models/Ride");
const logger = require("./config/logger");

const app = express();
const PORT = process.env.PORT || 5002;

const buildCorsOptions = () => {
  const configuredOrigins = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configuredOrigins.length === 0) {
    return {
      origin: "*",
      credentials: false
    };
  }

  return {
    origin: configuredOrigins.length === 1 ? configuredOrigins[0] : configuredOrigins,
    credentials: true
  };
};

const corsOptions = buildCorsOptions();

app.use(cors(corsOptions));
app.use(express.json());

// Rate limiter middleware
const limiter = require("./middleware/rateLimiter");
app.use("/api", limiter);

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: corsOptions
});

// Make io accessible in controllers
app.set("io", io);

const { sub } = require("./config/redis");

sub.subscribe("ride_updates");

sub.on("message", (channel, message) => {
  const data = JSON.parse(message);

  const io = app.get("io");
  io.emit(data.event, data.payload);
});

// Socket connection (Live Driver Location Tracking)
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // User must join the room BEFORE emitting to it
  socket.on("join", (userId) => {
    socket.join(userId);
  });

  socket.on("leave", (room) => {
    socket.leave(room);
  });

  // Then handle events
  socket.on("driver_location", async (data) => {
    try {
      const { driverId, rideId, lat, lng } = data;

      if (
        !driverId ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lng)
      ) {
        logger.warn("Invalid driver location payload", {
          socketId: socket.id,
          driverId,
          rideId
        });
        return;
      }

      if (!rideId) {
        logger.warn("Missing rideId in driver location", {
          socketId: socket.id,
          driverId
        });
        return;
      }

      const rideFilter = {
        _id: rideId,
        driverId,
        status: { $in: ["accepted", "ongoing"] }
      };

      const ride = await Ride.findOneAndUpdate(
        rideFilter,
        {
          currentLocation: { lat, lng }
        },
        {
          new: true,
          runValidators: true
        }
      ).select("_id driverId customerId currentLocation");

      if (!ride) {
        logger.warn("Active ride not found for driver location update", {
          socketId: socket.id,
          driverId,
          rideId
        });
        return;
      }

      const locationPayload = {
        rideId: ride._id.toString(),
        driverId: ride.driverId.toString(),
        customerId: ride.customerId.toString(),
        lat: ride.currentLocation.lat,
        lng: ride.currentLocation.lng
      };

      io.to(`ride:${locationPayload.rideId}`).emit(
        "driver_location_update",
        locationPayload
      );

      io.to(locationPayload.driverId).emit(
        "driver_location_update",
        locationPayload
      );

      io.to(locationPayload.customerId).emit(
        "driver_location_update",
        locationPayload
      );
    } catch (err) {
      logger.error("Error processing driver location", {
        socketId: socket.id,
        error: err.message
      });
    }
  });
  
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Routes
app.use("/api/rides", rideRoutes);

//Error handler middleware
const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

app.get("/", (req, res) => {
  res.send("Ride Service Running");
});

// DB + Server start
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Ride DB Connected");

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Ride service running on ${PORT}`);
    });
  })
  .catch(err => console.log(err));
