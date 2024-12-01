import { Schema } from '../DBManager/Manager.js';

export const projects = new Schema({
    _id: { type: 'string', unique: true, required: true, minLength: 36, maxLength: 36, },
    groupId: { type: 'string', require: true,  }
});

export const users = new Schema({
    _id: { type: 'string', unique: true, required: true, minLength: 36, maxLength: 36, },
    profile: { type: 'object', required: true, schema: {
        username: { type: 'string', unique: true, required: true, minLength: 3, maxLength: 20, },
        biography: { type: 'string', nullable: true, default: null, maxLength: 500, },
        avatar: { type: 'string', nullable: true, default: null },
        role: { type: 'string', default: 'user' },
    } },
    email: { type: 'object', required: true, schema: {
        address: { type: 'string', unique: true, required: true, minLength: 5, maxLength: 50, },
        verified: { type: 'boolean', default: false },
        verifyToken: { type: 'string', nullable: true, }
    }, },
    auth: { type: 'object', required: true, schema: {
        passwordHash: { type: 'string', required: true, minLength: 256, maxLength: 256, },
        passwordSalt: { type: 'string', required: true, minLength: 32, maxLength: 32, }
    } }
});