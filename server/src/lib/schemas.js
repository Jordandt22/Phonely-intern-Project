import * as yup from "yup";

export const getFlightsQuerySchema = yup.object({
  departure_city: yup.string().trim().required("Please provide a departure city."),
  destination_city: yup.string().trim().required("Please provide a destination city."),
  travel_date: yup.string().trim().required("Please provide a travel date."),
});

export const bookFlightBodySchema = yup.object({
  flight_number: yup.string().trim().required("Please provide a flight number."),
  flights: yup.array().of(yup.object({
    flightNumber: yup.string().trim().required("Please provide a flight number."),
    departureTime: yup.string().trim().required("Please provide a departure time."),
    arrivalTime: yup.string().trim().required("Please provide an arrival time."),
    airline: yup.string().trim().required("Please provide an airline."),
    price: yup.number().required("Please provide a price."),
  })).required("Please provide flights information."),
  caller: yup.object({
    first_name: yup.string().trim().required("Please provide a first name."),
    last_name: yup.string().trim().required("Please provide a last name."),
    email: yup.string().trim().email("Please provide a valid email address.").required("Please provide an email address."),
    phone: yup.string().trim().required("Please provide a phone number."),
  }).required("Please provide caller information."),
});