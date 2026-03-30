const { kafka, USE_KAFKA } = require("../config/kafka");

// 👉 If Kafka disabled → export empty function
if (!USE_KAFKA || !kafka) {
  console.log("Kafka disabled → consumer not started");

  module.exports = async () => {};
  return;
}

// ✅ Only create consumer if Kafka exists
const consumer = kafka.consumer({ groupId: "ride-group" });

const run = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: "ride_created" });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const data = JSON.parse(message.value.toString());
      console.log("Kafka received:", data);
    }
  });
};

module.exports = run;