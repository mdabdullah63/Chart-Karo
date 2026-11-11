const crypto = require("crypto");
const bcrypt = require("bcryptjs");

function generateOTP() {
  return crypto.randomInt(1000, 10000).toString();
}
function hashOTP(otp) {
  return bcrypt.hash(otp, 10);
}
function compareOTP(otp, hashedOTP) {
  return bcrypt.compare(otp, hashedOTP);
}

module.exports = { generateOTP, hashOTP, compareOTP };
