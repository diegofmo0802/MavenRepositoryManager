import { pbkdf2Sync, randomBytes } from "crypto";
import JwtManager from "saml.servercore/build/Beta/JwtManager.js";
import User from "./UserManager/User.js";

export class Auth {
    public readonly jwt: JwtManager;
    constructor(options: Auth.options) {
        const jwtOptions = options.jwt;
        if (jwtOptions instanceof JwtManager) this.jwt = jwtOptions;
        else {
            const key = jwtOptions.privKey ?? jwtOptions.secret;
            if (!key) throw new Error("JWT secret or private key is required.")
            this.jwt = new JwtManager(jwtOptions.algorithm, key);
        }
    }
    /**
     * encrypt the given password with the given salt.
     * @param password the password from the token.
     * @param salt the key from the token.
     * @returns the generated token with length of 256.
     */
    public encryptPassword(password: string, salt: string): string {
        return pbkdf2Sync(password, salt, 1024, 128, 'SHA256').toString('hex');
    }
    /**
     * generate a random salt for the auth token.
     * @returns a random salt with length of 32.
     */
    public authSalt(): string {
        return randomBytes(16).toString('hex');
    }
    /**
     * compare the given password with the given hash and salt.
     * @param password the password from the token.
     * @param hash the hash from the token.
     * @param salt the key from the token.
     * @returns true if the password matches the hash, false otherwise.
     */
    public comparePassword(password: string, hash: string, salt: string): boolean {
        return this.encryptPassword(password, salt) === hash;
    }
    /**
     * create a new SessionToken.
     * @param user the uuid of the user.
     * @returns the generated token.
     */
    public sessionToken(user: User.data): string {
        const token: Auth.token.sessionToken = {
            uuid: user._id,
            action: 'session',
            expire: Date.now() + (30 * 24 * 60 * 60 * 1000),
            created: Date.now()
        }
        return this.jwt.sign(token);
    }
    /**
     * validate the given token.
     * @param token the token to validate.
     * @returns response.valid is true if the token is valid, false otherwise.
     */
    public validateSessionToken(token: string): Auth.token.validation<Auth.token.sessionToken> {
        const tokenInfo = this.jwt.parse(token);
        if (!tokenInfo.verify) return { valid: false, reason: 'invalid token' }
        const { uuid, action, expire, created } = tokenInfo.body;
        if (
            !uuid || !action || !expire || !created
            || typeof uuid !== 'string'
            || typeof action !== 'string'
            || typeof expire !== 'number'
            || typeof created !== 'number'
            || action !== 'session'
        ) return { valid: false, reason: 'invalid token' }
        if (tokenInfo.body.expire < Date.now()) return { valid: false, reason: 'token expired' }
        return { valid: true, data: {
            uuid, action, expire, created
        } };
    }
    public emailToken(user: User.data): string {
        const token: Auth.token.emailToken = {
            uuid: user._id,
            email: user.email.address,
            action: 'email',
            expire: Date.now() + (6 * 60 * 60 * 1000),
            created: Date.now()
        };
        return this.jwt.sign(token);
    }
    public validateEmailToken(token: string): Auth.token.validation<Auth.token.emailToken> {
        const tokenInfo = this.jwt.parse(token);
        if (!tokenInfo.verify) return { valid: false, reason: 'invalid token' }
        const { uuid, email, action, expire, created } = tokenInfo.body;
        if (
            !uuid || !email || !action || !expire || !created
            || typeof uuid !== 'string'
            || typeof email !== 'string'
            || typeof action !== 'string'
            || typeof expire !== 'number'
            || typeof created !== 'number'
            || action !== 'email'
        ) return { valid: false, reason: 'invalid token' }
        if (tokenInfo.body.expire < Date.now()) return { valid: false, reason: 'token expired' }
        return { valid: true, data: {
            uuid, email, action, expire, created
        } };
    }
}

export namespace Auth {
    export namespace token {
        export namespace validation {
            export interface validTokenResponse<content extends JwtManager.body = JwtManager.body> {
                valid: true;
                data: content;
            }
            export interface invalidTokenResponse {
                valid: false;
                reason: string;
            }
        }
        export type validation<content extends JwtManager.body = JwtManager.body> = (
            validation.validTokenResponse<content>
            | validation.invalidTokenResponse
        );
        export interface sessionToken {
            uuid: string;
            action: 'session';
            expire: number;
            created: number;
        }
        export interface emailToken {
            uuid: string;
            email: string;
            action: 'email';
            expire: number;
            created: number;
        }
    }
    export interface jwtOptions {
        algorithm: JwtManager.jwtAlgorithms;
        privKey?: string,
        secret?: string,
    }
    export interface options {
        jwt: jwtOptions | JwtManager;
    }
}

export default Auth;