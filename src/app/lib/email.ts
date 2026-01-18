import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
    },
});

export async function sendEmail(to: string, subject: string, html: string) {
    // Development fallback if credentials aren't set
    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
        console.log('--- EMAIL SIMULATION ---');
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Content: ${html}`);
        console.log('------------------------');
        return;
    }

    try {
        await transporter.sendMail({
            from: process.env.SMTP_EMAIL,
            to,
            subject,
            html,
        });
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email');
    }
}
