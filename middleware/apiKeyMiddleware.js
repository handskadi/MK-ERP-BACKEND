require('dotenv').config();

const checkApiKey = (req, res, next) => {
  const apiKey = req.header('x-api-key'); // API key from the request header
  const validApiKey = process.env.API_KEY; // API key stored in environment

  if (!apiKey || apiKey !== validApiKey) {
    return res.status(403).json({ message: 'Forbidden: Invalid API Key' });
  }

  next(); // Proceed to the next middleware or route handler
};

module.exports = checkApiKey;
