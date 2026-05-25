"use client";

import { useFormik } from "formik";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

import { confirmationNumberSchema } from "@/lib/schemas";

export default function Home() {
  const router = useRouter();

  const formik = useFormik({
    initialValues: {
      confirmation_number: ""
    },
    validationSchema: confirmationNumberSchema,
    onSubmit: values => {
      router.push(`/details/${values.confirmation_number.toUpperCase()}`);
    },
  });

  return (
    <div className="flex flex-col items-center justify-center w-full h-screen">
      <h1 className="text-4xl font-bold text-white italic mb-2 max-w-[90%]">Flyte</h1>
      <p className="text-white/50 mb-2 max-w-[90%] text-center">Enter your confirmation number to view your flight details</p>
      <form onSubmit={formik.handleSubmit} className="w-full md:w-1/4 flex flex-col gap-4 p-4 rounded-sm">
        <div>
          <div className="flex items-center rounded-sm p-2 bg-[#3b3b3b] border-2 border-gray-600/20 font-medium text-white aria-invalid:border-destructive" aria-invalid={formik.touched.confirmation_number && !!formik.errors.confirmation_number}>
            <span>
              CONF-
            </span>

            <input
              id="confirmation_number"
              name="confirmation_number"
              type="text"
              className="uppercase focus:outline-none w-full"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.confirmation_number}
              placeholder="XXXXXX"
              maxLength={6}
              aria-invalid={formik.touched.confirmation_number && !!formik.errors.confirmation_number}
            />
          </div>
          {formik.touched.confirmation_number && formik.errors.confirmation_number ? (
            <p className="mt-1 text-sm text-red-400">{formik.errors.confirmation_number}</p>
          ) : null}
        </div>
        <button type="submit" className="inline-flex items-center justify-center gap-2 bg-[#1e1e1e] border-2 border-gray-600/20 rounded-full p-2 text-white focus:outline-none text-center font-medium hover:bg-[#141414] transition-all duration-300 cursor-pointer hover:scale-95">
          <Search className="size-4" />
          Search
        </button>
      </form>
    </div>
  );
}
