// authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getUserByEmail, updateUserVerification, setResetToken, getUserByResetToken, updateUserPassword, logUserActivity } = require('../models/user');
const { sendResetPasswordEmail, sendPasswordResetConfirmationEmail } = require('../utils/emailService');
const { generateOTP, sendVerificationEmail } = require('../utils/otpService');


// User Login
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await getUserByEmail(email);
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];

        if (!user) {
            await logUserActivity(null, 'failed_login', ip, userAgent);
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.isVerified) return res.status(403).json({ message: 'Account not verified' });
        if (user.status !== 'active') return res.status(403).json({ message: 'Account is inactive or suspended' });

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            await logUserActivity(user.id, 'failed_login', ip, userAgent);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        await logUserActivity(user.id, 'login', ip, userAgent);
        res.json({ message: 'Login successful', token });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Request Email Verification
exports.requestVerification = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await getUserByEmail(email);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const otp = generateOTP();
        await updateUserVerification(user.id, otp);
        await sendVerificationEmail(user.email, otp);

        res.json({ message: 'Verification OTP sent' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Verify OTP
exports.verifyAccount = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await getUserByEmail(email);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        console.log("Stored OTP:", user.verificationCode);
        console.log("Received OTP:", otp);

        if (String(user.verificationCode) !== String(otp)) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        if (Date.now() > new Date(user.verificationExpires).getTime()) {
            return res.status(400).json({ message: 'OTP expired' });
        }

        await updateUserVerification(user.id, null, true);
        res.json({ message: 'Account verified successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Forgot Password - Send Reset Link
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await getUserByEmail(email);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const { token } = await setResetToken(email);
        await sendResetPasswordEmail(email, token);

        res.json({ message: 'Password reset email sent' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Reset Password - Verify Token & Update Password
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const user = await getUserByResetToken(token);
        if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

        await updateUserPassword(user.id, newPassword);
        await logUserActivity(user.id, 'password_reset', req.ip, req.headers['user-agent']);

        await sendPasswordResetConfirmationEmail(user.email);
        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
