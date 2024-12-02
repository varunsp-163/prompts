"use client";

import { useSession } from "@node_modules/next-auth/react";
import React, { useState } from "react";

const EmailVerification = ({ email }) => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  const handleChange = (event) => {
    setCode(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log("Sending verification request... to", email);

    try {
      const res = await fetch("/api/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          email,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsVerified(true);
        setError(""); // Clear errors
        setTimeout(() => router.push("/"), 1000);
      } else {
        setError(data.message || "Invalid verification code.");
      }
    } catch (error) {
      console.error("Error during verification:", error);
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center bg-transparent p-4">
      <h1 className="text-2xl font-bold text-center mb-6">
        Enter the 4-digit verification code
      </h1>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm p-6 bg-white rounded-lg shadow-lg"
      >
        <div className="mb-4">
          <input
            type="text"
            value={code}
            onChange={handleChange}
            maxLength={4}
            placeholder="Code"
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          className="w-full p-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-300"
        >
          Verify
        </button>
        {error && (
          <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
        )}
        {isVerified && (
          <p className="text-green-500 text-sm mt-2 text-center">
            Email verified successfully!
          </p>
        )}
      </form>
    </div>
  );
};

export default EmailVerification;
