const Redis = require("ioredis");

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const pub = new Redis(redisUrl);
const sub = new Redis(redisUrl);

module.exports = { pub, sub };
