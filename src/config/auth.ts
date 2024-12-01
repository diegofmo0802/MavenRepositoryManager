import { Beta } from 'saml.servercore';
import Auth from "../helper/Auth.js";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('missing environment variables');

export const jwt = new Beta.JwtManager('HS256', JWT_SECRET);
export const auth = new Auth({ jwt });

export default auth;