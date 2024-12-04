"use client";
import EmailVerification from "@components/EmailVerification";
import { useSession } from "next-auth/react";

import React, { useEffect, useState } from "react";

const page = () => {
  const { data: session, status } = useSession();
  const [email, setEmail] = useState(null);

  useEffect(() => {
    if (session?.user?.email) {
      setEmail(session.user.email);
    }
  }, [session]);
  return (
    <div>
      <EmailVerification email={email} />
    </div>
  );
};

export default page;
