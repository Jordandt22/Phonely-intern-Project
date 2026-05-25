import { SERVER_ERROR } from "./error.codes.js";

export const customErrorHandler = (
  code = SERVER_ERROR,
  message = "Sorry, there was an error with the server.",
  extraInfo = null,
) => {
  if (process.env.NODE_ENV === "development") {
    console.error(extraInfo);
  }

  console.error(`${code}:`, message ?? "No message provided.");
  return {
    data: null,
    error: {
      code,
      message,
    },
  };
};

export const successHandler = (data) => {
  return {
    data,
    error: null,
  };
};

export const serverErrorCatcherWrapper = (controller) => {
  return async function (req, res, next) {
    try {
      return await controller.call(this, req, res, next);
    } catch (e) {
      console.log(e);
      return res
        .status(500)
        .json(
          customErrorHandler(
            SERVER_ERROR,
            "Sorry, there was an error with the server."
          )
        );
    }
  };
};

