import { Router } from "express";
import { getFlightByConfirmationNumber } from "../controllers/flights.controller.js";

const flightsRouter = Router();

flightsRouter.get(
  "/:confirmation_number",
  getFlightByConfirmationNumber,
);

export default flightsRouter;