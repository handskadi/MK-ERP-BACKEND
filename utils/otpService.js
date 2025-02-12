// backend/utils/otpService.js

const nodemailer = require('nodemailer');
require('dotenv').config();

// Generate a 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Verify OTP
const verifyOTP = (inputOTP, storedOTP) => {
    return inputOTP === storedOTP;
};

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // You can change this to another email provider
    auth: {
        user: process.env.EMAIL_USER, // Email configured in .env
        pass: process.env.EMAIL_PASS  // App Password (or SMTP password)
    }
});

// Send verification email with OTP
const sendVerificationEmail = async (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP Verification Code',
        text: `Your verification OTP is: ${otp}. It expires in 15 minutes.`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ OTP sent successfully to ${email}`);
    } catch (error) {
        console.error('❌ Error sending OTP email:', error.message);
        throw new Error('Failed to send verification email');
    }
};

// Export functions
module.exports = {
    generateOTP,
    verifyOTP,
    sendVerificationEmail
};
