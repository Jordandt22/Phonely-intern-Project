import Redis from "ioredis";

let redisClient;

export const getRedisClient = () => {
  if (!redisClient) {
    redisClient = new Redis({
      host: process.env.REDIS_URL,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD,
    });
  }

  return redisClient;
};

// Time Intervals
const TEN_MINUTES = 60 * 10;
const ONE_DAY = 60 * 60 * 24;

// Check Key for Development
export const checkKey = (key) =>
  process.env.NODE_ENV === "development" ? "DEV_" + key : key;

// Check Interval for Development
export const checkInterval = (interval) =>
  process.env.NODE_ENV === "development" ? TEN_MINUTES : interval;

export const createSearchBusinessKey = (mainKey, searchParamValues) => {
  let udpatedKey = mainKey;

  // Add Search Parameters to Key
  searchParamValues.forEach(({ key, value }) => {
    udpatedKey += `&${key.toUpperCase().replace("_", "-")}:${value}`;
  });

  return udpatedKey;
};

// Cache Actions
export const cacheData = async (key, timeInterval, data) => {
  if (process.env.NODE_ENV === "development")
    console.log(`REDIS: Set Data to Cache [${key}]`);

  await getRedisClient().set(
    checkKey(key),
    JSON.stringify({ data }),
    "EX",
    checkInterval(timeInterval)
  );
};

export const getCacheData = async (key) => {
  if (process.env.NODE_ENV === "development")
    console.log(`REDIS: Retrieved Data from Cache [${key}]`);
  return JSON.parse(await getRedisClient().get(checkKey(key)));
};

export const deleteCacheData = async (key) => {
  if (process.env.NODE_ENV === "development")
    console.log(`REDIS: Deleted Data from Cache [${key}]`);
  await getRedisClient().del(checkKey(key));
};

export const deleteCacheDataByPrefix = async (prefix) => {
  const redis = getRedisClient();
  const match = checkKey(prefix) + "*";
  let cursor = "0";

  do {
    const [nextCursor, keys] = await redis.scan(
      cursor,
      "MATCH",
      match,
      "COUNT",
      100
    );

    cursor = nextCursor;

    if (keys.length) {
      const pipeline = redis.pipeline();
      keys.forEach((key) => {
        if (process.env.NODE_ENV === "development") console.log(`REDIS: Deleting Data from Cache [${key}]`);
        pipeline.del(key);
      });
      await pipeline.exec();
    }
  } while (cursor !== "0");

  if (process.env.NODE_ENV === "development") {
    console.log(`REDIS: Deleted All Data from Cache with Prefix [${prefix}]`);
  }
};

export const flushDBCache = async () => {
  if (process.env.NODE_ENV === "development")
    console.log("REDIS: Flushing Cache");

  await getRedisClient().flushdb();
};

// REDIS KEYS

// --- Stories ----
export const getFlightsCacheKey = (session_id) => ({
  key: `FLIGHTS_SESSION:${session_id}`,
  interval: TEN_MINUTES,
});

export const getBookedFlightCacheKey = (confirmation_number) => ({
  key: `BOOKED_FLIGHT:${confirmation_number.toUpperCase()}`,
  interval: ONE_DAY,
});