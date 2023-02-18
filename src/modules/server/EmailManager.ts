import nodemailer from 'nodemailer';
import { Config } from '../Internal';

const mailTransport = nodemailer.createTransport({
    service: Config.get('smtp-service'),
    auth: {
        user: Config.get('smtp-email'),
        pass: Config.get('smtp-password')
    }
});

export function sendMail(to: string, subject: string, contentHtml: string) {
    if(to.trim().length === 0) return false;
    mailTransport.sendMail({
        from: `"Lucadion RPG" <${Config.get('smtp-email')}>`,
        to: to,
        subject: '[Lucadion RPG] ' + subject,
        html: contentHtml
    });
    return true;
}