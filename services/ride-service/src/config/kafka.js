// For local development on Local Machine:
/* const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "ride-service",
  brokers: ["localhost:9092"]
});

const producer = kafka.producer();

module.exports = { kafka, producer }; */


// For excluding Kafka during Deployment (by turning off the USE_KAFKA flag in .env file) as it consumes large RAM on AWS
const USE_KAFKA = process.env.USE_KAFKA === "true";

let producer = null;

if (USE_KAFKA) {
  const { Kafka } = require("kafkajs");

  const kafka = new Kafka({
    clientId: "ride-service",
    brokers: [process.env.KAFKA_BROKER || "kafka:9092"]
  });

  producer = kafka.producer();
}

module.exports = { producer, USE_KAFKA };