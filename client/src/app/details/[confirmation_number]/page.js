import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getBookedFlight } from "@/lib/api";

const BackButton = () => {
  return (
    <Link href="/" className="inline-flex items-center gap-2 text-white/75 text-center bg-[#1e1e1e] border-2 border-gray-600/20 p-2 px-8 rounded-sm cursor-pointer hover:bg-[#141414] hover:border-gray-600/40 transition-all duration-300">
      <ArrowLeft className="size-4" />
      Go Back
    </Link>
  )
}

export default async function Details({ params }) {
  const { confirmation_number } = await params;

  if (!confirmation_number) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-screen">
        <h1 className="text-4xl font-bold text-white italic max-w-[90%] text-center mb-2">Flyte</h1>
        <p className="text-white/75 max-w-[90%] text-center mb-4">Please enter a valid confirmation number</p>
        <BackButton />
      </div>
    )
  }

  const result = await getBookedFlight(confirmation_number);
  if (!result.ok) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-screen">
        <h1 className="text-4xl font-bold text-white italic max-w-[90%] text-center mb-2">Flyte</h1>
        <p className="text-white/75 max-w-[90%] text-center mb-4">{result.message}</p>
        <BackButton />
      </div>
    )
  }

  const { flight, caller } = result.data;
  const detailItems = [
    {
      label: "Full Name",
      value: `${caller?.first_name ?? "N/A"} ${caller?.last_name ?? ""}`
    },
    {
      label: "Confirmation Number",
      value: `CONF-${confirmation_number?.toUpperCase()}`
    },
    {
      label: "Flight Number",
      value: flight?.flightNumber
    },
    {
      label: "Airline",
      value: flight?.airline
    },
    {
      label: "Departure Time",
      value: flight?.departureTime
    },
    {
      label: "Arrival Time",
      value: flight?.arrivalTime
    },
    {
      label: "Date",
      value: flight?.date
    },
    {
      label: "Price",
      value: flight?.price
    }
  ]

  return (
    <div className="flex flex-col items-center justify-center w-full h-screen">
      <h1 className="text-4xl font-bold text-white italic max-w-[90%] text-center mb-2">Flyte</h1>
      <p className="text-white/75 max-w-[90%] text-center mb-4">Hi {caller?.first_name ?? "Traveler"}, here are the details for your flight</p>
      <div className="flex flex-col gap-2 items-center justify-center w-[90%] md:w-1/4 mb-8">
        {detailItems.map((item) => (
          <div key={item.label} className="flex justify-between items-center gap-2 w-full bg-[#1e1e1e] border-2 border-gray-600/20 p-2 rounded-sm">
            <p className="text-white/75">{item.label}</p>
            <p className="text-white font-medium">{item?.value ?? "N/A"}</p>
          </div>
        ))}
      </div>
      <BackButton />
    </div>
  );
}
