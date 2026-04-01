require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5001;

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

app.use(cors(buildCorsOptions()));

const authRoutes = require("./routes/authRoutes");


app.use(express.json());
app.use("/api/auth", authRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Auth DB Connected"))
  .catch(err => console.log(err));

app.get("/", (req, res) => {
  res.send("Auth Service Running");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Auth Service running on port ${PORT}`);
});
