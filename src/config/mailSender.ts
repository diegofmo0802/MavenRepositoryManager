import { Beta } from 'saml.servercore';

const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_PORT = process.env.EMAIL_PORT;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_SECURE = process.env.EMAIL_SECURE;

if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS || !EMAIL_SECURE) throw new Error('Missing email environment variables');

const host = EMAIL_HOST;
const username = EMAIL_USER;
const password = EMAIL_PASS;
const port = parseInt(EMAIL_PORT);
const secure = EMAIL_SECURE.toLowerCase() == 'true';

export const mailSender = new Beta.Mail({ host, username, password, port, secure });

export default mailSender;