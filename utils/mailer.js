const axios = require("axios");
const nodemailer = require("nodemailer");

async function Mailer(email, text, subject) {
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
      console.error("Error getting access token:", error);
      return null;
    }
  }

  const access_token = await getAccessTokenWithRefreshToken();

  if (!access_token) {
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
      accessToken: access_token,
    },
  });

  const mailOptions = {
    from: "hello@jaagr.com",
    to: email,
    subject: subject,
    text: text,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

module.exports = { Mailer };
