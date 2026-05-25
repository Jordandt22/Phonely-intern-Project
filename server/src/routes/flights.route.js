import { Router } from "express";
import { getFlightsController, bookFlightController, getBookedFlightController } from "../controllers/flights.controller.js";
import { queryValidator, bodyValidator, paramsValidator } from "../middlewares/validators.js";
import { getFlightsQuerySchema, bookFlightBodySchema, getBookedFlightParamsSchema } from "../lib/schemas.js";
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

flightsRouter.get(
  "/:confirmation_number",
  paramsValidator(getBookedFlightParamsSchema),
  serverErrorCatcherWrapper(getBookedFlightController),
);


export default flightsRouter;