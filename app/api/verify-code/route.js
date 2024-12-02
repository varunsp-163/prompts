import User from "@models/user";
import { connectToDB } from "@utils/database";

export const POST = async (request) => {
  const { code, email } = await request.json();

  console.log("Received verification request for email:", email, code);

  try {
    await connectToDB();

    const user = await User.findOne({ email });

    console.log("checking");

    if (!user) {
      return new Response(JSON.stringify({ message: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (user.verificationCode === code) {
      user.verifiedViaEmail = true;
      await user.save();
      return new Response(
        JSON.stringify({ message: "Email verification successful" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ message: "Invalid verification code." }),
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
