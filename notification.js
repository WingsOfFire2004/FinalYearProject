require("dotenv").config(); // Load environment variables

const nodemailer = require("nodemailer");
const twilio = require("twilio");

// ✅ 1. Configure Nodemailer (For Sending Emails)
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER, // Fetch from .env file
        pass: process.env.EMAIL_PASS,
    },
});

// ✅ 2. Configure Twilio (For Sending SMS)
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// ✅ 3. Function to Send Email
function sendEmailNotification(email, subject, message) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: subject,
        text: message,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("❌ Error sending email:", error);
        } else {
            console.log("✅ Email sent:", info.response);
        }
    });
}

// ✅ 4. Function to Send SMS
function sendSMSNotification(phoneNumber, message) {
    twilioClient.messages
        .create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phoneNumber,
        })
        .then((message) => console.log("✅ SMS sent:", message.sid))
        .catch((error) => console.error("❌ Error sending SMS:", error));
}

// ✅ 5. Export Functions
module.exports = { sendEmailNotification, sendSMSNotification };
