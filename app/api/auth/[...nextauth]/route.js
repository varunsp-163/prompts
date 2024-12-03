import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import User from "@models/user";
import { connectToDB } from "@utils/database";
import nodemailer from "nodemailer";

// Function to generate a random 4-digit code
const generateCode = () => Math.floor(1000 + Math.random() * 9000).toString();

// Function to send an email
const SendMessage = async (email, code) => {
  try {
    console.log("Sending email to:", email);

    // Configure the email transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.email",
      port: 587,
      secure: true,
      auth: {
        user: process.env.MAIL_PROVIDER,
        pass: process.env.MAIL_PROVIDER_PASS,
      },
    });
    // const transporter = nodemailer.createTransport({
    //   host: "smtp.ethereal.email",
    //   port: 587,
    //   auth: {
    //     user: "susie.lind95@ethereal.email",
    //     pass: "ANTAkPEFBdAAQNq4DU",
    //   },
    // });

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

    console.log(mailOptions);

    // Send email
    await transporter.sendMail(mailOptions);

    console.log(`Verification code sent to ${email}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send verification email.");
  }
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
      // store the user id from MongoDB to session
      const sessionUser = await User.findOne({ email: session.user.email });
      session.user.id = sessionUser._id.toString();

      return session;
    },
    async signIn({ profile }) {
      try {
        await connectToDB();

        // check if user already exists
        const userExists = await User.findOne({ email: profile.email });
        console.log(userExists);
        const email = profile.email;
        if (!userExists) {
          // If not, create a new document and save user in MongoDB
          const newCode = generateCode();
          await User.create({
            email: profile.email,
            username: profile.name.replace(" ", "").toLowerCase(),
            image: profile.picture,
            verifiedViaEmail: false,
            verificationCode: newCode,
          });

          console.log("The email", profile.email);

          await SendMessage(profile.email, newCode);

          return `/verify-email/${email}`;
        } else if (!userExists.verifiedViaEmail) {
          // If the email is not verified, generate a new code and send it
          const newCode = generateCode();
          userExists.verificationCode = newCode;

          await userExists.save();

          console.log("The email", userExists.email);

          await SendMessage(userExists.email, newCode);
          return `/verify-email/${email}`;
        }

        return true;
      } catch (error) {
        console.log("Error checking if user exists:", error.message);
        return false;
      }
    },
  },
});

export { handler as GET, handler as POST };
