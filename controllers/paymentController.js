const axios = require("axios");

let cachedToken = null;
let tokenExpiry = 0;

const generateAuthToken = async () => {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const formData = new URLSearchParams({
    client_id: process.env.PHONEPE_CLIENT_ID,
    client_secret: process.env.PHONEPE_CLIENT_SECRET,
    grant_type: "client_credentials",
    client_version: "1"
  });

  const { data } = await axios.post(
    "https://api.phonepe.com/apis/pg-sandbox/v1/oauth/token",
    formData.toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  cachedToken = data.access_token;
  tokenExpiry = data.expires_at * 1000;

  return cachedToken;
};

const createPayment = async (req, res) => {
  try {
    const token = await generateAuthToken();

    const merchantOrderId = `ORDER_${Date.now()}`;
    const redirectUrl = `${process.env.FRONTEND_URL}/payment/`;

    const payload = {
      merchantOrderId,
      amount: 49900, // ₹499 in paise
      expireAfter: 1200,
      paymentFlow: {
        type: "PG_CHECKOUT",
        message: "Emotional Wellbeing Assessment",
        merchantUrls: {
          redirectUrl
        }
      }
    };

    const { data } = await axios.post(
      "https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay",
      payload,
      {
        headers: {
          Authorization: `O-Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    return res.json({
      redirectUrl: data.redirectUrl,
      merchantOrderId
    });
  } catch (err) {
    console.error("Create Payment Error:", err.response?.data || err.message);
    res.status(500).json({ error: "Payment creation failed" });
  }
};

const getPaymentStatus = async (req, res) => {
  try {
    const token = await generateAuthToken();
    const { merchantOrderId } = req.params;

    const { data } = await axios.get(
      `https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/order/${merchantOrderId}/status`,
      {
        headers: {
          Authorization: `O-Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({ state: data.state });
  } catch (err) {
    console.error("Status Error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch payment status" });
  }
};

module.exports = {
  createPayment,
  getPaymentStatus
};
