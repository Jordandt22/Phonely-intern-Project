const API_URL = process.env.API_URL ?? "http://localhost:8000/v1/api";

export async function getBookedFlight(confirmationNumber) {
  const normalized = confirmationNumber
    .trim()
    .replace(/^CONF-/i, "")
    .toUpperCase();

  try {
    const response = await fetch(
      `${API_URL}/flights/${normalized}`,
      { cache: "no-store" }
    );

    const body = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        message: body?.message ?? body?.error?.message ?? "Something went wrong.",
      };
    }

    return {
      ok: true,
      data: body.data,
    };
  } catch {
    return {
      ok: false,
      status: 500,
      message: "Sorry, we weren't able to retrieve your flight details. Please try again later.",
    };
  }
}
