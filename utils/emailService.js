const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendResetPasswordEmail = async (email, token) => {
    const resetLink = `http://localhost:3000/reset-password?token=${token}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset Request',
        text: `Click the link below to reset your password:\n\n${resetLink}\n\nThis link will expire in 15 minutes.`
    };

    return transporter.sendMail(mailOptions);
};
const sendPasswordResetConfirmationEmail = async (email) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your Password Has Been Reset',
        text: `Your password was successfully reset. If you did not request this change, please contact support immediately.`
    };

    return transporter.sendMail(mailOptions);
};


module.exports = { sendResetPasswordEmail, sendPasswordResetConfirmationEmail };
