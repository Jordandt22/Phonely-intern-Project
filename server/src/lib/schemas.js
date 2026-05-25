import * as yup from "yup";

export const getFlightsQuerySchema = yup.object({
  departure_city: yup.string().trim().required("Please provide a departure city."),
  destination_city: yup.string().trim().required("Please provide a destination city."),
  travel_date: yup.string().trim().required("Please provide a travel date."),
});

export const bookFlightBodySchema = yup.object({
  session_id: yup.string().trim().required("Please provide a session ID."),
  option_number: yup.number().required("Please provide an option number."),
  caller: yup.object({
    first_name: yup.string().trim().required("Please provide a first name."),
    last_name: yup.string().trim().required("Please provide a last name."),
    email: yup.string().trim().email("Please provide a valid email address.").required("Please provide an email address."),
    phone: yup.string().trim().required("Please provide a phone number."),
  }).required("Please provide caller information."),
});

export const getBookedFlightParamsSchema = yup.object({
  confirmation_number: yup
    .string()
    .trim()
    .transform((value) => value?.replace(/^CONF-/i, "").toUpperCase())
    .required("Please provide a confirmation number.")
    .length(6, "Confirmation number must be exactly 6 characters.")
    .matches(
      /^[A-Z0-9]+$/,
      "Confirmation number can only contain letters and numbers."
    ),
});