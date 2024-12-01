import Manager from "../DBManager/Manager.js";
import * as Schemas from './dbSchemas.js';

const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;

if (!DB_HOST || !DB_PORT || !DB_USER || !DB_PASSWORD || !DB_NAME) throw new Error('missing environment variables');

export const client = new Manager({
    host: DB_HOST, port: parseInt(DB_PORT), 
    username: DB_USER, password: DB_PASSWORD
});

export const db = client.dbSession(DB_NAME, Schemas);

await db.operation(async (db) => {
    await db.init(); return true;
});

export default db;