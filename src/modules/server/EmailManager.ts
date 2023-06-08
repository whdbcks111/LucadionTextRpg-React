import nodemailer from 'nodemailer';

const mailTransport = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE,
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD
    }
});

export function sendMail(to: string, subject: string, contentHtml: string) {
    if(to.trim().length === 0) return false;
    mailTransport.sendMail({
        from: `"Lucadion RPG" <${process.env.SMTP_EMAIL}>`,
        to,
        subject: '[Lucadion RPG] ' + subject,
        html: contentHtml
    });
    return true;
}