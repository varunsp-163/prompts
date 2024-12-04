import LoginActivity from "@models/loginActivity";
import User from "@models/user";
import { connectToDB } from "@utils/database";
import bcrypt from "bcrypt";
import requestIp from "request-ip";

export const POST = async (request) => {
  const getClientIp = (request) => {
    const clientIp = requestIp.getClientIp(request);
    console.log("The IP:", clientIp);
    return clientIp || "Unknown IP";
  };

  const { code, email } = await request.json();

  try {
    await connectToDB();

    const user = await User.findOne({ email });

    if (!user) {
      return new Response(JSON.stringify({ message: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const latestSession = await LoginActivity.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(1);

    console.log("The last session:", latestSession);

    if (latestSession.length > 0 && user.verifiedViaEmail) {
      const currentTime = new Date();
      const sessionCreatedAt = new Date(latestSession[0].createdAt);
      console.log(currentTime - sessionCreatedAt);

      if (currentTime - sessionCreatedAt <= 10 * 60 * 1000) {
        if (latestSession[0].status === "otp verification needed") {
          return new Response(
            JSON.stringify({
              message: "There is an active session, please try later",
            }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
      }
    }

    const currentTime = new Date();
    const codeExpirationTime = new Date(user.verificationCodeExpires);

    if (currentTime > codeExpirationTime) {
      return new Response(
        JSON.stringify({
          message: "Verification code has expired, Please login again",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const isValidCode = await bcrypt.compare(code, user.verificationCode);

    if (isValidCode) {
      user.verifiedViaEmail = true;
      user.verificationCodeExpires = new Date(new Date() - 20 * 60 * 1000);
      await user.save();

      await LoginActivity.create({
        userId: user._id,
        timestamp: new Date(),
        ipAddress: getClientIp(request),
        email: user.email,
        userAgent: "Email Verification",
        status: "success",
      });

      return new Response(
        JSON.stringify({ message: "Email verification successful" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ message: "Invalid verification code" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error verifying code:", error.message);

    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
