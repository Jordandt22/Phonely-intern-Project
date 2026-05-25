import { DateTime } from "luxon";
import { v4 as uuidv4 } from "uuid";

// Error Codes
import { FLIGHTS_NOT_FOUND, INVALID_TRAVEL_DATE, INVALID_TRAVEL_DATE_RANGE, INVALID_FLIGHT_NUMBER } from "../lib/error.codes.js";

// Utils
import { customErrorHandler, successHandler, generateConfirmationNumber } from "../lib/utils.js";

// Redis
import { cacheData, getFlightsCacheKey, getCacheData } from "../lib/redis/redis.js";

const parseTravelDate = (travelDateInput) => {
  const text = String(travelDateInput ?? "").trim().replace(/"/g, "");
  if (!text) return null;

  const parseAttempts = [
    DateTime.fromFormat(text, "MM/dd/yyyy"),
    DateTime.fromFormat(text, "dd/MM/yyyy"),
    DateTime.fromFormat(text, "M/d/yyyy"),
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
  let data;
  let flightsData;
  try {
    const response = await fetch(`https://zz1mpoguje.execute-api.us-east-1.amazonaws.com/default/airline-assessment?src=${departure_city}&dst=${destination_city}&date=${parsedTravelDate.toISODate()}`);
    data = await response.json();
    flightsData = data?.flights;
  } catch (error) {
    return res.status(500).json(customErrorHandler(INTERNAL_SERVER_ERROR, "Sorry, we aren't able to retrieve the flights at the moment. Please try again later."));
  }

  // No Flights Found
  if (!flightsData) {
    return res.status(404).json(customErrorHandler(FLIGHTS_NOT_FOUND, "Sorry, there are no available flights for the given departure and destination cities and travel date."));
  }

  // Add Message to each flight for Phonely
  const flightsWithMessage = flightsData.map((flight) => {
    const departureTime = DateTime.fromISO(flight.departureTime).toLocal().toFormat("h:mm a ZZZZ");
    const arrivalTime = DateTime.fromISO(flight.arrivalTime).toLocal().toFormat("h:mm a ZZZZ");
    return ({
      ...flight,
      message: `Flight Number: ${flight.flightNumber}, Departure: ${departureTime}, Arrival: ${arrivalTime}, Airline: ${flight.airline}, Price: $${flight.price}`,
    })
  });

  // Cache Flights
  const session_id = uuidv4();
  const { key: flightsCacheKey, interval: flightsCacheInterval } = getFlightsCacheKey(session_id);
  await cacheData(flightsCacheKey, flightsCacheInterval, flightsWithMessage);

  return res.status(200).json(successHandler({
    message: "Here are the flights for the given departure and destination cities and travel date.",
    session_id,
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


export const bookFlightController = async (req, res) => {
  const { session_id, flight_number, caller } = req.body;
  const firstName = caller?.first_name;
  const lastName = caller?.last_name;
  const email = caller?.email;
  const phone = caller?.phone;

  // Get Flights from Cache
  const { key: flightsCacheKey } = getFlightsCacheKey(session_id);
  const cachedData = await getCacheData(flightsCacheKey);
  if (!cachedData) {
    return res.status(404).json(customErrorHandler(FLIGHTS_NOT_FOUND, "Sorry, the session ID you provided is not valid."));
  }

  // Check if flight number is valid
  const flight = cachedData?.data?.find((flight) => flight?.flightNumber?.toLowerCase() === flight_number?.toLowerCase());
  if (!flight) {
    return res.status(404).json(customErrorHandler(INVALID_FLIGHT_NUMBER, "Sorry, the flight number you provided is not valid."));
  }

  // Generate Confirmation Number
  const confirmationNumber = generateConfirmationNumber();
  return res.status(200).json(successHandler({
    message: `Here is your confirmation number: ${confirmationNumber}. A copy will be sent to your email or phone number.`,
    confirmation_number: confirmationNumber,
    selected_flight: flight,
  }));
}