import { DateTime } from "luxon";
import { v4 as uuidv4 } from "uuid";

// Error Codes
import { FLIGHTS_NOT_FOUND, INVALID_TRAVEL_DATE, INVALID_TRAVEL_DATE_RANGE, INVALID_FLIGHT_NUMBER, SUPABASE_ERROR, BOOKED_FLIGHT_NOT_FOUND } from "../lib/error.codes.js";

// Utils
import { customErrorHandler, successHandler, generateConfirmationNumber } from "../lib/utils.js";

// Redis
import { cacheData, getFlightsCacheKey, getBookedFlightCacheKey, getCacheData } from "../lib/redis/redis.js";

// Supabase
import { getSupabaseAuthClient } from "../lib/supabase/supabase.js";

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

const formatTime = (time) => {
  return DateTime.fromISO(time).toUTC().toFormat("h:mm a ZZZZ");
};

const formatPrice = (price) => {
  return `$${Number(price).toFixed(2)}`;
};

const buildBookedFlightResponse = (confirmation_number, flight, caller) => ({
  message: "Here are the details for your booked flight.",
  confirmation_number: `CONF-${confirmation_number}`,
  flight: {
    ...flight,
    departureTime: formatTime(flight.departureTime),
    arrivalTime: formatTime(flight.arrivalTime),
    price: formatPrice(flight.price),
  },
  caller,
});

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
  let flightDate;
  try {
    const response = await fetch(`https://zz1mpoguje.execute-api.us-east-1.amazonaws.com/default/airline-assessment?src=${departure_city}&dst=${destination_city}&date=${parsedTravelDate.toISODate()}`);
    data = await response.json();
    flightsData = data?.flights;
    flightDate = data?.date;
  } catch (error) {
    return res.status(500).json(customErrorHandler(INTERNAL_SERVER_ERROR, "Sorry, we weren't able to retrieve the flights at the moment. Please try again later."));
  }

  // No Flights Found
  if (!flightsData) {
    return res.status(404).json(customErrorHandler(FLIGHTS_NOT_FOUND, "Sorry, there are no available flights for the given departure and destination cities and travel date."));
  }

  // Add Message to each flight for Phonely
  const flightsWithMessage = flightsData.map((flight, index) => {
    const departureTime = formatTime(flight.departureTime);
    const arrivalTime = formatTime(flight.arrivalTime);
    const optionNumber = index + 1;
    return ({
      ...flight,
      date: flightDate,
      option_number: optionNumber,
      message: `Option ${optionNumber}: Flight Number: ${flight.flightNumber}, Departure: ${departureTime}, Arrival: ${arrivalTime}, Airline: ${flight.airline}, Price: ${formatPrice(flight.price)}`,
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
    date: flightDate,
    flights: flightsWithMessage,
    flights_phonely_message: flightsWithMessage.map((flight) => flight.message).join(", "),
    total_flights: flightsData.length,
  }));
};


export const bookFlightController = async (req, res) => {
  const { session_id, option_number, caller } = req.body;

  // Get Flights from Cache
  const { key: flightsCacheKey } = getFlightsCacheKey(session_id);
  const cachedData = await getCacheData(flightsCacheKey);
  if (!cachedData) {
    return res.status(404).json(customErrorHandler(FLIGHTS_NOT_FOUND, "Sorry, the session ID you provided is not valid."));
  }

  // Check if flight number is valid
  const flight = cachedData?.data?.find((flight) => Number(flight?.option_number) === Number(option_number));
  if (!flight) {
    return res.status(404).json(customErrorHandler(INVALID_FLIGHT_NUMBER, "Sorry, the option number you provided is not valid."));
  }

  // Generate Confirmation Number
  const confirmation_number = generateConfirmationNumber();
  const confirmationCode = confirmation_number.replace(/^CONF-/ig, "");

  // Store Flight Details in Supabase
  try {
    await getSupabaseAuthClient()
      .from("booked_flights")
      .insert({
        confirmation_number: confirmationCode,
        flight,
        caller,
      })
      .single();
  } catch (error) {
    return res.status(500).json(customErrorHandler(SUPABASE_ERROR, "Sorry, we weren't able to store the flight details at the moment. Please try again later."));
  }

  // Cache Data
  const { key: bookedFlightCacheKey, interval: bookedFlightCacheInterval } = getBookedFlightCacheKey(confirmationCode);
  await cacheData(bookedFlightCacheKey, bookedFlightCacheInterval, { flight, caller });

  return res.status(200).json(successHandler({
    message: `Here is your confirmation number: ${confirmation_number}. A copy will be sent to your email or phone number.`,
    confirmation_number,
    selected_flight: {
      ...flight,
      departureTime: formatTime(flight.departureTime),
      arrivalTime: formatTime(flight.arrivalTime),
      price: formatPrice(flight.price),
    },
  }));
};

export const getBookedFlightController = async (req, res) => {
  const confirmation_number = req.params.confirmation_number
    .trim()
    .replace(/^CONF-/ig, "")
    .toUpperCase();

  // Checking cache for data
  const { key: bookedFlightCacheKey } = getBookedFlightCacheKey(confirmation_number);
  const cachedData = await getCacheData(bookedFlightCacheKey);
  if (cachedData?.data) {
    const { flight, caller } = cachedData.data;
    return res.status(200).json(successHandler(buildBookedFlightResponse(confirmation_number, flight, caller)));
  }

  // Getting data from Supabase
  const { data, error } = await getSupabaseAuthClient()
    .from("booked_flights")
    .select("flight, caller")
    .eq("confirmation_number", confirmation_number)
    .maybeSingle();

  if (error) {
    return res.status(500).json(customErrorHandler(SUPABASE_ERROR, "Sorry, we weren't able to retrieve the flight details at the moment. Please try again later."));
  }

  if (!data) {
    return res.status(404).json(customErrorHandler(BOOKED_FLIGHT_NOT_FOUND, "Sorry, no booking was found for the confirmation number you provided."));
  }

  const { flight, caller } = data;
  return res.status(200).json(successHandler(buildBookedFlightResponse(confirmation_number, flight, caller)));
};