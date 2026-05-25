import { Router } from "express";
import { getFlightsController } from "../controllers/flights.controller.js";
import { queryValidator } from "../middlewares/validators.js";
import { getFlightsQuerySchema } from "../lib/schemas.js";
import { serverErrorCatcherWrapper } from "../lib/utils.js";

const flightsRouter = Router();

flightsRouter.get(
  "/",
  queryValidator(getFlightsQuerySchema),
  serverErrorCatcherWrapper(getFlightsController),
);

export default flightsRouter;