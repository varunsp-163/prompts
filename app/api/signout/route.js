import LoginActivity from "@models/loginActivity";
import User from "@models/user";
import { connectToDB } from "@utils/database";
import requestIp from "request-ip";

export const POST = async (request) => {
  console.log("Called signout");
  const { email } = await request.json();

  try {
    await connectToDB();

    const user = await User.findOne({ email });

    if (!user) {
      return new Response(JSON.stringify({ message: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    await LoginActivity.create({
      userId: user._id,
      timestamp: new Date(),
      ipAddress: requestIp.getClientIp(request) || "Unknown IP",
      email: user.email,
      userAgent: "sign-out",
      status: "Signout successful",
    });

    return new Response(
      JSON.stringify({ message: "Sign-out logged successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error logging sign-out activity:", error.message);

    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
