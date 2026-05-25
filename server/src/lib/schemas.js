import * as yup from "yup";

export const getFlightsQuerySchema = yup.object({
  departure_city: yup.string().trim().required("Please provide a departure city."),
  destination_city: yup.string().trim().required("Please provide a destination city."),
  travel_date: yup.string().trim().required("Please provide a travel date."),
});