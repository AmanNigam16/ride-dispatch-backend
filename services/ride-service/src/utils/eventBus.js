const publishEvent = async (event) => {
  if (process.env.USE_SQS === "true") {
    // Future hook for low-overhead queue integration on AWS.
    console.log("SQS event:", event);
  } else {
    // Kafka replaced with a lightweight no-infra fallback for EC2 deployments.
    console.log("Mock event:", event);
  }
};

module.exports = { publishEvent };
