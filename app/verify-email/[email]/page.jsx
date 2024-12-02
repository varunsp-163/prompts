import EmailVerification from "@components/EmailVerification";
import React from "react";

const page = ({ params }) => {
  const email = decodeURIComponent(params.email);
  return (
    <div>
      <EmailVerification email={email} />
    </div>
  );
};

export default page;
