import { Router } from "express";
import { getFlightsController, bookFlightController } from "../controllers/flights.controller.js";
import { queryValidator, bodyValidator } from "../middlewares/validators.js";
import { getFlightsQuerySchema, bookFlightBodySchema } from "../lib/schemas.js";
import { serverErrorCatcherWrapper } from "../lib/utils.js";

const flightsRouter = Router();

flightsRouter.get(
  "/",
  queryValidator(getFlightsQuerySchema),
  serverErrorCatcherWrapper(getFlightsController),
);

flightsRouter.post(
  "/book",
  bodyValidator(bookFlightBodySchema),
  serverErrorCatcherWrapper(bookFlightController),
);


export default flightsRouter;