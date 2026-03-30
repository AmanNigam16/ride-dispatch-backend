// For Local Development on Local Machine:
/* const Redis = require("ioredis");

const pub = new Redis();
const sub = new Redis();

module.exports = { pub, sub }; */


// For Deployment on Docker:
const Redis = require("ioredis");

const pub = new Redis({
  host: "redis",
  port: 6379
});

const sub = new Redis({
  host: "redis",
  port: 6379
});

module.exports = { pub, sub };