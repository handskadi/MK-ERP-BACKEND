require('dotenv').config();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("JWT_SECRET is missing! Make sure it's defined in the .env file.");
  process.exit(1);
}

const token = jwt.sign(
  { userId: 1, role: "admin" },  // Add role here
  JWT_SECRET,
  { expiresIn: '1h' }
);

console.log("Generated JWT Token:", token);
