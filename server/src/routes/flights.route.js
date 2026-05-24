import { Router } from "express";
import { getFlightByConfirmationNumber } from "../controllers/flights.controller.js";

const flightsRouter = Router();

flightsRouter.post(
  "/book",
  getFlightByConfirmationNumber,
);

export default flightsRouter;