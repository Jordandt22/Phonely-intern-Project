import { DateTime } from "luxon";
import { INVALID_TRAVEL_DATE, INVALID_TRAVEL_DATE_RANGE } from "../lib/error.codes.js";
import { customErrorHandler, successHandler } from "../lib/utils.js";

const parseTravelDate = (travelDateInput) => {
  const text = String(travelDateInput ?? "").trim();
  if (!text) return null;

  const parseAttempts = [
    DateTime.fromISO(text),
    DateTime.fromFormat(text, "dd/MM/yyyy"),
    DateTime.fromFormat(text, "yyyy-MM-dd"),
    DateTime.fromFormat(text, "MM/dd/yyyy"),
    DateTime.fromFormat(text, "M/d/yyyy"),
    DateTime.fromFormat(text, "MMMM d, yyyy"),
    DateTime.fromFormat(text, "MMM d, yyyy"),
  ];

  const matchedDate = parseAttempts.find((date) => date.isValid);
  if (matchedDate) {
    return matchedDate.startOf("day");
  }

  const fallbackDate = new Date(text);
  if (Number.isNaN(fallbackDate.getTime())) {
    return null;
  }

  return DateTime.fromJSDate(fallbackDate).startOf("day");
};

export const getFlightsController = async (req, res) => {
  const { departure_city, destination_city, travel_date } = req.query;

  // Validate Travel Date
  const parsedTravelDate = parseTravelDate(travel_date);
  if (!parsedTravelDate) {
    return res.status(422).json(customErrorHandler(INVALID_TRAVEL_DATE, "Please provide a valid travel date string."));
  }

  const today = DateTime.now().startOf("day");
  const oneYearFromToday = today.plus({ years: 1 });
  if (parsedTravelDate < today || parsedTravelDate > oneYearFromToday) {
    return res.status(422).json(customErrorHandler(INVALID_TRAVEL_DATE_RANGE, "Travel date must be between today and one year from today."));
  }

  // Get Flights
  const response = await fetch(`https://zz1mpoguje.execute-api.us-east-1.amazonaws.com/default/airline-assessment?src=${departure_city}&dst=${destination_city}&date=${parsedTravelDate.toISODate()}`);
  const data = await response.json();
  const flightsData = data?.flights;

  // Add Message to each flight for Phonely
  const flightsWithMessage = flightsData.map((flight) => {
    const departureTime = DateTime.fromISO(flight.departureTime).toLocal().toFormat("h:mm a ZZZZ");
    const arrivalTime = DateTime.fromISO(flight.arrivalTime).toLocal().toFormat("h:mm a ZZZZ");
    return ({
      ...flight,
      message: `Flight Number: ${flight.flightNumber}, Departure: ${departureTime}, Arrival: ${arrivalTime}, Airline: ${flight.airline}, Price: $${flight.price}`,
    })
  });

  return res.status(200).json(successHandler({
    message: "Flight booked successfully",
    query: {
      departure_city,
      destination_city,
      travel_date,
    },
    src: data?.src,
    dst: data?.dst,
    date: data?.date,
    flights: flightsWithMessage,
    flights_phonely_message: flightsWithMessage.map((flight) => flight.message).join(" | "),
    total_flights: flightsData.length,
  }));
};