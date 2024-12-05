import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import User from "@models/user";
import { connectToDB } from "@utils/database";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import LoginActivity from "@models/loginActivity";
import { headers } from "next/headers";

const generateCode = () => Math.floor(1000 + Math.random() * 9000).toString();

const hashCode = async (code) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(code, salt);
};

const SendMessage = async (email, code) => {
  try {
    const expiresIn = 10;
    const expirationTime = new Date(
      Date.now() + expiresIn * 60000
    ).toLocaleString();

    // const transporter = nodemailer.createTransport({
    //   service: "gmail",
    //   host: "smtp.gmail.email",
    //   port: 587,
    //   secure: true,
    //   auth: {
    //     user: process.env.MAIL_PROVIDER,
    //     pass: process.env.MAIL_PROVIDER_PASS,
    //   },
    // });
    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: "susie.lind95@ethereal.email",
        pass: "ANTAkPEFBdAAQNq4DU",
      },
    });

    // Email content
    const mailOptions = {
      from: '"Promptopia" <susie.lind95@ethereal.email>',
      to: email,
      subject: "Verify Your Email Address",
      html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
      <h2 style="color: #007bff;">Email Verification</h2>
      <p>Dear User,</p>
      <p>Thank you for signing up with <strong>Promptopia</strong>. To complete your registration, please use the verification code below:</p>
      <p style="font-size: 1.5em; font-weight: bold; color: #007bff; text-align: center;">${code}</p>
      <p>This code is valid until <strong>${expirationTime}</strong>.</p>
      <p>If you did not sign up for an account, please ignore this email or contact our support team.</p>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
      <p style="font-size: 0.9em; color: #555;">
        Best regards,<br />
        The <strong>Promptopia</strong> Team<br />
        <a href="https://varunsp.vercel.app/" style="color: #007bff; text-decoration: none;">https://varunsp.vercel.app</a>
      </p>
    </div>
  `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Verification code sent to ${email}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send verification email.");
  }
};
const getClientIp = () => {
  const forwardedFor = headers().get("x-forwarded-for");
  return forwardedFor ? forwardedFor.split(",")[0] : "Unknown IP";
};

const isValidSession = async (user) => {
  const latestSession = await LoginActivity.find({
    userId: user._id,
  })
    .sort({ createdAt: -1 })
    .limit(1);
  console.log("The latestSession", latestSession);
  if (!latestSession || latestSession.length === 0) {
    return true;
  }

  const currentTime = new Date();
  const sessionCreatedAt = new Date(latestSession[0].createdAt);

  if (currentTime - sessionCreatedAt <= 10 * 60 * 1000) {
    if (latestSession[0].status !== "Signout successful") {
      return false;
    }
  }

  return true;
};

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async session({ session }) {
      const sessionUser = await User.findOne({ email: session.user.email });
      session.user.id = sessionUser._id.toString();
      return session;
    },
    async signIn({ user, profile, account }) {
      const clientIp = getClientIp();
      let userExists;

      try {
        await connectToDB();

        const newCode = generateCode();
        const expirationTime = new Date(Date.now() + 10 * 60000);

        userExists = await User.findOne({ email: profile.email });

        if (userExists) {
          const sessionIsValid = await isValidSession(userExists);

          if (!sessionIsValid) {
            console.log("Session invalid, OTP required.");
            return "/active-session";
          }

          userExists.verificationCode = await hashCode(newCode);
          userExists.verificationCodeExpires = expirationTime;
          await userExists.save();
        } else {
          userExists = await User.create({
            email: profile.email,
            username: profile.name,
            image: profile.picture,
            verifiedViaEmail: false,
            verificationCode: await hashCode(newCode),
            verificationCodeExpires: expirationTime,
          });
        }
        await LoginActivity.create({
          userId: userExists._id,
          timestamp: new Date(),
          ipAddress: clientIp,
          email: profile.email,
          userAgent: "user-agent",
          status: "otp verification needed",
        });

        await SendMessage(userExists.email, newCode);
        return true;
      } catch (error) {
        console.error("Error during sign-in:", error.message);
        return false;
      }
    },
  },
});

export { handler as GET, handler as POST };
