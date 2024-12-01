import FS from 'fs';
import ServerCore from "saml.servercore";

import ApiRequest from './base/ApiRequest.js';
import * as repo from './actions/repo.js';
import * as auth from './actions/auth.js';
import * as user from './actions/user.js';

export function serverRules(server: ServerCore) {
    server.addFolder('/repo', 'repo');
    server.addAction('POST', '/api/repo/upload', (request, response) => {
        repo.upload(new ApiRequest(request, response));
    });
    
    // Profile rules
    server.addAction('GET', '/api/users/', (request, response) => {
        user.gerUsers(new ApiRequest(request, response));
    });
    server.addAction('GET', '/api/users/$UUID', (request, response) => {
        user.getProfile(new ApiRequest(request, response));
    });
    server.addAction('PUT', '/api/users/', (request, response) => {
        user.editProfile(new ApiRequest(request, response));
    });
    server.addAction('GET', '/api/users/$UUID/avatar/$AVATAR_ID', (request, response) => {
        user.getAvatar(new ApiRequest(request, response));
    });
    server.addAction('GET', '/api/users/$UUID/card', (request, response) => {
        user.getCard(new ApiRequest(request, response));
    });
    // Auth rules
    server.addAction('POST', '/api/auth/login', (request, response) => {
        auth.login(new ApiRequest(request, response));
    });
    server.addAction('GET', '/api/auth/logout', (request, response) => {
        auth.logout(new ApiRequest(request, response));
    });
    server.addAction('POST', '/api/auth/register', (request, response) => {
        auth.register(new ApiRequest(request, response));
    });
    server.addAction('GET', '/api/auth/verify', (request, response) => {
        auth.verifySession(new ApiRequest(request, response));
    });
    server.addAction('GET', '/api/auth/verify/email', (request, response) => {
        auth.verifyEmail(new ApiRequest(request, response));
    });
    server.addAction('ALL', '/api/*', (request, response) => {
        const content: ApiRequest.error = {
            success: false,
            reason: 'Invalid route',
            code: 404,
            log: [
                `routing method: ${request.method}`,
                `routing to ${request.url}`,
                'rule: default route'
            ]
        }
        response.sendJson(content);
    });
}

export default serverRules;