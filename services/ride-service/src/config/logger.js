const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    // Console logs (same as before)
    new winston.transports.Console(),

    // File logs (NEW)
    new winston.transports.File({
      filename: "logs/app.log"
    })
  ]
});

module.exports = logger;