import { Template } from "saml.servercore";

import userManager from "../config/userManager.js";
import ApiRequest from "../base/ApiRequest.js";
import auth from "../config/auth.js";
import mailSender from "../config/mailSender.js";

export async function login(api: ApiRequest) {
    const data = await api.post;
    if (
        data.mimeType !== 'application/x-www-form-urlencoded'
        && data.mimeType !== 'multipart/form-data'
        && data.mimeType !== 'application/json'
    ) return api.sendError('Invalid content type', 400);
    const { username, password } = data.content;
    if (!username) return api.sendError('username is required', 400);
    if (!password) return api.sendError('password is required', 400);
    if (typeof username !== 'string') return api.sendError('username must be a string', 400);
    if (typeof password !== 'string') return api.sendError('password must be a string', 400);

    const usernameValidation = userManager.isValidUsernames(username);
    const passwordValidation = userManager.isValidPassword(password);
    if (!usernameValidation.valid) return api.sendError(usernameValidation.reason, 400);
    if (!passwordValidation.valid) return api.sendError(passwordValidation.reason, 400);

    const user = await userManager.getUserByUsername(username);
    if (!user) return api.sendError('invalid username', 400);
    const userInfo = await user.data;
    if (!userInfo) return api.sendError('user info not found', 500);
    if (!auth.comparePassword(
        password,
        userInfo.auth.passwordHash,
        userInfo.auth.passwordSalt
    )) return api.sendError('invalid password', 400);
    api.authToken = auth.sessionToken(userInfo);
    api.send({
        sessionToken: api.authToken,
        user: userManager.publicData(userInfo)
    });
}

export async function logout(api: ApiRequest) {
    api.authToken = null;
    api.send('ok');
}

export async function register(api: ApiRequest) {
    // return api.sendError('No puedes crear usuarios/registrarte por falta de políticas de usuario', 403);
    const data = await api.post;
    if (
        data.mimeType !== 'application/x-www-form-urlencoded'
        && data.mimeType !== 'multipart/form-data'
        && data.mimeType !== 'application/json'
    ) return api.sendError('Invalid content type', 400);
    const { username, email, password, confirmation } = data.content;
    if (!username) return api.sendError('username is required', 400);
    if (!email) return api.sendError('email is required', 400);
    if (!password) return api.sendError('password is required', 400);
    if (!confirmation) return api.sendError('confirmation is required', 400);
    if (typeof username !== 'string') return api.sendError('username must be a string', 400);
    if (typeof email !== 'string') return api.sendError('email must be a string', 400);
    if (typeof password !== 'string') return api.sendError('password must be a string', 400);
    if (typeof confirmation !== 'string') return api.sendError('confirmation must be a string', 400);

    const usernameValidation = userManager.isValidUsernames(username);
    const emailValidation = userManager.isValidEmails(email);
    const passwordValidation = userManager.isValidPassword(password);
    if (!usernameValidation.valid) return api.sendError(usernameValidation.reason, 400);
    if (!emailValidation.valid) return api.sendError(emailValidation.reason, 400);
    if (!passwordValidation.valid) return api.sendError(passwordValidation.reason, 400);
    if (password !== confirmation) return api.sendError('passwords do not match', 400);

    const testUser = await userManager.getUserByUsername(username);
    if (testUser) return api.sendError('username already exists', 400);
    const testEmail = await userManager.getUserByEmail(email);
    if (testEmail) return api.sendError('email already exists', 400);

    try {
        const result = await userManager.createUser(username, email, password);
        if (typeof result === 'string') return api.sendError(result, 500);
        const info = await result.data;
        if (!info) return api.sendError('error creating user', 500);

        api.authToken = auth.sessionToken(info);
        api.send({
            sessionToken: api.authToken,
            user: userManager.publicData(info)
        });

        try {
            const emailToken = info.email.verifyToken;
            if (!emailToken) return console.log('verify token not created');
            const emailVerify = auth.validateEmailToken(emailToken);
            if (!emailVerify.valid) return console.log('the created token is invalid:', emailVerify.reason);
            const emailContent = await Template.load('assets/Confirm.mail', {
                username: info.profile.username,
                token: info.email.verifyToken,
                expire: new Date(emailVerify.data.expire).toLocaleString('es-ES'),
                now: new Date().toLocaleString('es-ES'),
                url: 'https://repo.mysaml.com/api/auth/verify/email'
            });
            await mailSender.send(info.email.address, 'Verificación de correo: Sky-Gallery', emailContent, {
                isHtml: true
            });
        } catch(error) {
            console.log('error on send verification email', error);
        }
    } catch(error) {
        console.log('error on create user', error);
        api.sendError('error creating user', 500);
    }
}

export async function verifySession(api: ApiRequest) {
    const token = api.authToken;
    if (!token) return api.send({
        verify: false, user: null,
        message: 'no token provided'
    });
    const tokenInfo = auth.validateSessionToken(token);
    if (!tokenInfo.valid) return api.send({
        verify: false, user: null,
        message: tokenInfo.reason
    });

    const uuid = tokenInfo.data.uuid;
    const user = await userManager.getUserById(uuid);
    if (!user) return api.send({
        verify: false, user: null,
        message: 'invalid user in token'
    });
    const userInfo = await user.data;
    if (!userInfo) return api.send({
        verify: false, user: null,
        message: 'user info not found'
    });

    api.authToken = auth.sessionToken(userInfo);
    api.send({ verify: true, user: userManager.publicData(userInfo) });
}

export async function verifyEmail(api: ApiRequest) {
    const token = api.searchParams.get('token');
    if (!token) return api.sendError('no token provided', 400);
    const tokenInfo = auth.validateEmailToken(token);
    if (!tokenInfo.valid) return api.sendError(tokenInfo.reason, 400);
    const { uuid, email } = tokenInfo.data;

    const user = await userManager.getUserById(uuid);
    if (!user) return api.sendError('invalid user in token', 400);
    const userInfo = await user.data;
    if (!userInfo) return api.sendError('user info not found', 500);
    if (userInfo.email.address !== email) return api.sendError('invalid email in token', 400);
    if (userInfo.email.verifyToken !== token) return api.sendError('invalid token', 400);

    await user.update({ email: { verified: true, verifyToken: '' } });
    api.send('email verified');
}