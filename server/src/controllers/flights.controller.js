export const getFlightByConfirmationNumber = async (req, res) => {
  const { confirmation_number } = req.params;

  res.status(200).json({
    message: "Flight found",
    data: {
      confirmation_number,
    },
  });
};