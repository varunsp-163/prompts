import nodemailer from "nodemailer";

// Function to generate a random 4-digit code
export const generateCode = () =>
  Math.floor(1000 + Math.random() * 9000).toString();

// Function to send an email
export const SendMessage = async (email, code) => {
  try {
    console.log("Sending email to:", email);

    // Configure the email transporter (use your email credentials or a service like SendGrid)
    const transporter = nodemailer.createTransport({
      service: "mail",
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: "shaanhem007@gmail.com",
        pass: "shanvarun2003",
      },
    });

    // Email content
    const mailOptions = {
      from: "shaanhem007@gmail.com",
      to: email,
      subject: "Email Verification Code",
      text: `Your 4-digit verification code is: ${code}`,
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
