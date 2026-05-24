export const getFlightByConfirmationNumber = async (req, res) => {
  const { caller_airport } = req.body;

  console.log(caller_airport);

  res.status(200).json({
    message: "Flight booked successfully",
    data: {
      caller_airport,
    },
  });
};