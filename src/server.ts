import './config/env.js';
import ServerCore, { Debug } from 'saml.servercore';
import clientRules from './clientRules.js';
import serverRules from './serverRules.js';

const PORT = process.env.SERVER_PORT && process.env.SERVER_PORT.length > 0
? Number(process.env.SERVER_PORT) : 3000;
const HOST = process.env.SERVER_HOST && process.env.SERVER_HOST.length > 0
? process.env.SERVER_HOST : 'localhost';
const SHOW_DEBUG = process.env.SHOW_DEBUG && process.env.SHOW_DEBUG === 'true';

if (SHOW_DEBUG) Debug.showAll = true;

const SSL_PRIV = process.env.SSL_PRIV;
const SSL_PUB = process.env.SSL_PUB;
const SSL_PORT = process.env.SSL_PORT && process.env.SSL_PORT.length > 0
? Number(process.env.SSL_PORT) : 443;

const SSL_CONFIG: ServerCore.SSLOptions | undefined = SSL_PRIV && SSL_PUB
? { privKey: SSL_PRIV, pubKey: SSL_PUB, port: SSL_PORT }
: undefined;

const server = new ServerCore(PORT, HOST, SSL_CONFIG);

clientRules(server);
serverRules(server);