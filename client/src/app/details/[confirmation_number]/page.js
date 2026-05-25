import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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

  const details = {
    flight_number: "UA800",
    airline: "United Airlines",
    departure_time: "10:00 AM PDT",
    arrival_time: "12:00 PM PDT",
    date: "2026-05-24",
    price: "$113.99",
  }

  const detailItems = [
    {
      label: "Confirmation Number",
      value: `CONF-${confirmation_number?.toUpperCase()}`
    },
    {
      label: "Flight Number",
      value: details?.flight_number
    },
    {
      label: "Airline",
      value: details?.airline
    },
    {
      label: "Departure Time",
      value: details?.departure_time
    },
    {
      label: "Arrival Time",
      value: details?.arrival_time
    },
    {
      label: "Date",
      value: details?.date
    },
    {
      label: "Price",
      value: details?.price
    }
  ]

  return (
    <div className="flex flex-col items-center justify-center w-full h-screen">
      <h1 className="text-4xl font-bold text-white italic max-w-[90%] text-center mb-2">Flyte</h1>
      <p className="text-white/75 max-w-[90%] text-center mb-4">Here are the details for your flight</p>
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
