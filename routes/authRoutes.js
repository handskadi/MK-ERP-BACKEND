// authRoutes.js
const express = require('express');
const router = express.Router();
const { loginUser, requestVerification, verifyAccount, forgotPassword, resetPassword } = require('../controllers/authController');

router.post('/login', loginUser);
router.post('/request-verification', requestVerification);
router.post('/verify-account', verifyAccount);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router; // ✅ Ensure this is exporting `router`
