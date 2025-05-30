const crypto = require("crypto")

const generateXVerify = (data, path, saltKey, saltIndex) => {
  const hash = crypto
    .createHash("sha256")
    .update(data + path + saltKey)
    .digest("hex")
  return `${hash}###${saltIndex}`
}

module.exports = { generateXVerify }
