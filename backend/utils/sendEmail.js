const nodemailer = require("nodemailer")

const sendEmail = async (email, subject, text) => {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        // service: process.env.EMAIL_SERVICE,
        port: process.env.EMAIL_PORT,
        // secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    })

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: subject,
        text: text,
    })
}

module.exports = sendEmail