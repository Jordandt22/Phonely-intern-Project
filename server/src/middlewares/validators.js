import {
  customErrorHandler,
  serverErrorCatcherWrapper
} from "../lib/utils.js";

import { YUP_ERROR } from "../lib/error.codes.js";

const validator = async (schema, data) => {
  try {
    await schema.validate(data, { abortEarly: false });
    return { valid: true, errors: null };
  } catch (err) {
    const errors = {};
    for (const e of err.inner) {
      if (!errors[e.path]) {
        const pathList = e.path.split(".");
        errors[pathList[pathList.length - 1]] = e.message;
      }
    }
    return { valid: false, errors };
  }
};

export const bodyValidator = (schema) =>
  serverErrorCatcherWrapper(async (req, res, next) => {
    const { valid, errors } = await validator(schema, req.body);
    if (valid && !errors) {
      return next();
    }

    res.status(422).json(customErrorHandler(YUP_ERROR, errors));
  });

export const paramsValidator = (schema) =>
  serverErrorCatcherWrapper(async (req, res, next) => {
    const { valid, errors } = await validator(schema, req.params);
    if (valid && !errors) {
      return next();
    }

    res.status(422).json(customErrorHandler(YUP_ERROR, errors));
  });

export const queryValidator = (schema) =>
  serverErrorCatcherWrapper(async (req, res, next) => {
    const { valid, errors } = await validator(schema, req.query);
    if (valid && !errors) {
      return next();
    }

    res.status(422).json(customErrorHandler(YUP_ERROR, errors));
  });
