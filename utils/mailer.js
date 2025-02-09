const axios = require("axios");
const nodemailer = require("nodemailer");

async function getAccessTokenWithRefreshToken() {
  const url = "https://oauth2.googleapis.com/token";
  const params = new URLSearchParams();
  params.append("client_id", process.env.GOOGLE_CLIENT_ID);
  params.append("client_secret", process.env.GOOGLE_CLIENT_SECRET);
  params.append("refresh_token", process.env.GOOGLE_REFRESH_TOKEN);
  params.append("grant_type", "refresh_token");

  try {
    const response = await axios.post(url, params);
    return response.data.access_token;
  } catch (error) {
    console.error("Error getting access token:", error.message);
    return null;
  }
}

async function Mailer(email, text, subject) {
  try {
    const accessToken = await getAccessTokenWithRefreshToken();

    if (!accessToken) {
      throw new Error("Failed to retrieve access token.");
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: "hello@jaagr.com",
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });

    const mailOptions = {
      from: "hello@jaagr.com",
      to: email,
      subject: subject,
      text: text,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error("Error sending email:", error.message);
    return false;
  }
}

module.exports = { Mailer };
