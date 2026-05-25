import arcjet from "@arcjet/node";
import { shield, detectBot, tokenBucket } from "@arcjet/node";
import { isSpoofedBot } from "@arcjet/inspect";

// Utils
import {
  customErrorHandler,
} from "../lib/utils.js";

// Error Codes
import { TOO_MANY_REQUESTS, BOTS_DETECTED, ACCESS_DENIED } from "../lib/error.codes.js";

const aj = arcjet({
  key: process.env.ARCJET_KEY,
  characteristics: ["ip.src"],
  rules: [
    shield({
      mode: "LIVE",
    }),
    detectBot({
      mode: "LIVE",
      allow: process.env.NODE_ENV === "development" ? ["POSTMAN"] : ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW", "CATEGORY:MONITOR", "PYTHON_HTTPX"],
    }),
    tokenBucket({
      mode: "LIVE",
      refillRate: 60,
      interval: 60,
      capacity: 300,
    }),
  ],
});

export const arcjetMiddleware = async (req, res, next) => {
  const decision = await aj.protect(req, { requested: 1 });
  if (process.env.NODE_ENV === "development")
    console.log(
      `Arcjet Decision: ${decision.conclusion} - [${decision.reason.type}]`
    );

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return res
        .status(429)
        .json(
          customErrorHandler(
            TOO_MANY_REQUESTS,
            "Too many requests have been sent. Please try again later."
          )
        );
    } else if (decision.reason.isBot()) {
      return res
        .status(403)
        .json(
          customErrorHandler(
            BOTS_DETECTED,
            "Bots Detected. Please refrain from using bots to access our API."
          )
        );
    } else {
      return res
        .status(403)
        .json(
          customErrorHandler(
            ACCESS_DENIED,
            "Your access has been denied."
          )
        );
    }
  } else if (decision.results.some(isSpoofedBot)) {
    return res
      .status(403)
      .json(
        customErrorHandler(
          ACCESS_DENIED,
          "Your access has been denied."
        )
      );
  }

  next();
};
