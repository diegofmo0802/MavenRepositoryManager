import { randomUUID } from "crypto";

import{ users } from "../../config/dbSchemas";
import User from "./User.js";
import Auth from "../Auth.js";
import { CollectionSession, Schema } from "../../DBManager/Manager.js";

export class UserManager {
    public constructor(
        public readonly auth: Auth,
        public readonly collection: CollectionSession<{
            users: typeof users;
            [Key: string]: Schema<any>
        }, 'users'>,
    ) {}
    
    public async getUserById(uuid: string): Promise<User | null> {
        return this.collection.operation(async (db, collection) => {
            const result = await collection.findOne({ _id: uuid }, { projection: { _id: 1 } });
            return result ? new User(this, uuid) : null;
        });
    }
    public async getUserByEmail(email: string): Promise<User | null> {
        return this.collection.operation(async (db, collection) => {
            const result = await collection.findOne({ 'email.address': email }, { projection: { _id: 1 } });
            return result ? new User(this, result._id) : null;
        });
    }
    public async getUserByUsername(username: string): Promise<User | null> {
        return this.collection.operation(async (dn, collection) => {
            const result = await collection.findOne({ 'profile.username': username }, { projection: { _id: 1 } });
            return result ? new User(this, result._id) : null;
        });
    }
    public async getUsers(page: number, limit: number): Promise<User.data[]> {
        const skip = (page - 1) * limit;
        return await this.collection.operation(async (db, collection) => {
            return await collection.aggregate<User.data>([
                { $match: {} },
                { $skip: skip },
                { $limit: limit },
            ]);
        });
    }
    public async createUser(username: string, email: string, password: string): Promise<User | string> {
        const error = await this.collection.operation(async (db, collection) => {
            const existingUser = await collection.findOne({ $or: [
                { "email.address": email },
                { 'profile.username': username }
            ] });
            if (existingUser) {
                if (existingUser.email.address === email) return 'email already in use';
                if (existingUser.profile.username === username) return 'username already in use';
            }
            return null;
        });
        if (error) return error;
        
        const uuid: string = await this.collection.operation(async (db, collection) => {
            let uuid = randomUUID();
            let valid = false;
            do {
                const info = await collection.findOne({ _id: uuid });
                if (!info) valid = true;
                else uuid = randomUUID();
            } while (!valid);
            return uuid;
        });

        const salt = this.auth.authSalt();
        const hash = this.auth.encryptPassword(password, salt);

        const emailToken = this.auth.emailToken({
            _id: uuid,
            profile: { username: username },
            email: { address: email, verified: false, verifyToken: null },
            auth: { passwordHash: hash, passwordSalt: salt }
        });

        return this.collection.transaction(async (db, collection) => {
            await collection.insertOne({
                _id: uuid,
                profile: { username: username },
                email: { address: email, verified: false, verifyToken: emailToken },
                auth: { passwordHash: hash, passwordSalt: salt }
            });
            const user = await collection.findOne({ _id: uuid }, { projection: { _id: 1 } });
            if (!user) throw new Error('could not create user');
            return new User(this, user._id);
        });
    }
    public publicData(data: User.data): User.publicData {
        return { _id: data._id, profile: data.profile };
    }
    public isValidUsernames(username: string): UserManager.validatorResponse {
        if (username.length < 3) return { valid: false, reason: 'username is too short' };
        if (username.length > 20) return { valid: false, reason: 'username is too long' };
        if (!/^[a-zA-Z0-9_]+$/.test(username)) return { valid: false, reason: 'username contains invalid characters' };
        return { valid: true };
    }
    public isValidPassword(password: string): UserManager.validatorResponse {
        if (password.length < 8) return { valid: false, reason: 'password is too short' };
        if (password.length > 100) return { valid: false, reason: 'password is too long' };
        // if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return { valid: false, reason: 'password must contain at least one lowercase letter' };
        return { valid: true };
    }
    public isValidEmails(email: string): UserManager.validatorResponse {
        if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(email)) return { valid: false, reason: 'email is invalid' };
        return { valid: true };
    }
}

export namespace UserManager {
    namespace validations {
        export interface validResponse {
            valid: true;
        }
        export interface invalidResponse {
            valid: false;
            reason: string;
        }
    }
    export type validatorResponse = validations.validResponse | validations.invalidResponse;
}

export default UserManager;