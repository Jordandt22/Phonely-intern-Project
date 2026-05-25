import * as yup from "yup";

export const confirmationNumberSchema = yup.object({
  confirmation_number: yup
    .string()
    .trim()
    .transform((value) => value?.toUpperCase())
    .required("Please enter your confirmation number.")
    .length(6, "Confirmation number must be exactly 6 characters.")
    .matches(
      /^[A-Z0-9]+$/,
      "Confirmation number can only contain letters and numbers."
    ),
});
