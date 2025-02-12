const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/users');  // Import user routes
const limiter = require('./middleware/rateLimiter');
const authRoutes = require('./routes/authRoutes');  // Import the auth routes


require('dotenv').config();

// Middleware
app.use(cors());
app.use(limiter);
app.use(bodyParser.json());

//
// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error("🔥 Unhandled Error:", err);
  res.status(500).json({ message: "Internal Server Error", error: err.message });
});

//
app.use(helmet()); // Secure HTTP headers
app.use(mongoSanitize()); // Prevent SQL Injection
app.use(xss()); // Prevent XSS attacks

// Routes
app.use('/api', userRoutes);
app.use('/api/auth', authRoutes);
// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
