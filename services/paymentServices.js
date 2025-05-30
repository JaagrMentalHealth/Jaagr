const fetch = require("node-fetch")
const { generateXVerify } = require("../utils/hashUtils")

const baseUrl = "https://api.phonepe.com/apis/hermes"

const initiatePayment = async (payload, saltKey, saltIndex, merchantId) => {
  const payloadStr = JSON.stringify(payload)
  const base64Payload = Buffer.from(payloadStr).toString("base64")
  const xVerify = generateXVerify(base64Payload, "/pg/v1/pay", saltKey, saltIndex)

  const res = await fetch(`${baseUrl}/pg/v1/pay`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-VERIFY": xVerify,
      "X-MERCHANT-ID": merchantId
    },
    body: JSON.stringify({ request: base64Payload })
  })

  const data = await res.json()
  return data
}

const checkTransactionStatus = async (merchantId, transactionId, saltKey, saltIndex) => {
  const path = `/pg/v1/status/${merchantId}/${transactionId}`
  const xVerify = generateXVerify(path, "", saltKey, saltIndex)

  const res = await fetch(`${baseUrl}${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-VERIFY": xVerify
    }
  })

  const data = await res.json()
  return data
}

module.exports = { initiatePayment, checkTransactionStatus }
