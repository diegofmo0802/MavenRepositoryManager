import FS from 'fs';
import { randomUUID } from "crypto";
import { Template } from "saml.servercore";
import sharp from "sharp";

import utilities from "../base/Utilities.js";
import ApiRequest from "../base/ApiRequest.js";
import userManager from "../config/userManager.js";
import auth from "../config/auth.js";
import QR from "../QR-Code/QR.js";

function parseBiography(biography: string, linesLength: number[]): Record<string, string> {
    const lines = biography.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
        if (linesLength[i] === undefined) break;
        const words = lines[i].split(/\s/);
        let line = '';
        for (let j = 0; j < words.length; j++) {
            const word = words[j];
            if (line.length + word.length + 1 <= linesLength[i]) {
                line += word + ' ';
            } else {
                lines[i] = line.trim();
                line = word + ' ';
            }
        }
        lines[i] = line.trim();
    }
    const bioLines: Record<string, string> = {};
    for (let i = 0; i < lines.length; i++) {
        const y = 470 + (70 * i);
        bioLines[y] = lines[i];
    }
    return bioLines;
}

export async function getCard(apiRequest: ApiRequest) {
    try {
        const uuid = apiRequest.ruleParams.UUID ?? apiRequest.searchParams.get('uuid');
        const format = apiRequest.searchParams.get('format')?.toUpperCase() ?? 'SVG';
        if (!uuid) return apiRequest.sendError('no UUID provided');
        const user = await userManager.getUserById(uuid);
        if (!user) return apiRequest.sendError('user not found');
        const info = await user.data;
        if (!info) return apiRequest.sendError('user not found');
        const profileUrl = `https://sky.mysaml.com/app/profile/${uuid}`;
        const qr = new QR(profileUrl);
        const drawer = qr.imageDrawer;
        drawer.style.padding = 1;
        drawer.style.background = '#00000000';
        drawer.style.inactiveColor = '#00000000';
        drawer.style.moduleRadius = '50%';
        drawer.style.moduleMargin = '2%';
        const qrSVG = drawer.svg;
        const svgSrc = `data:image/svg+xml;utf8,${encodeURIComponent(qrSVG)}`;

        const avatarID = info.profile.avatar?.split('/').pop();
        const avatarPath = !avatarID ? 'client/src/logo.svg' : `avatar/${uuid}/${avatarID}.jpg`;
        const avatarBuffer = FS.existsSync(avatarPath) ? FS.readFileSync(avatarPath) : null;
        const avatarType = avatarBuffer ? utilities.detectImageFormat(avatarBuffer) : null;
        const avatar = avatarBuffer ? `data:image/${avatarType};base64,${avatarBuffer.toString('base64')}` : '';

        const linesLength = [32, 32, 32, 32, 44, 44];
        const bio = parseBiography(info.profile.biography || '', linesLength);

        const cardSvg = await Template.load('assets/card.svg', {
            username: info.profile.username,
            avatar: avatar,
            bio: bio,
            qr: `<image x="1600" y="400" width="300" height="300" href="${svgSrc}" />`,
            background: 'linear-gradient(to right, #B4DCFF 0%, #DCFFB4 100%)'
        });
        let card: string | Buffer = cardSvg;
        let type: 'JPG' | 'PNG' | 'SVG' | 'WEBP' = 'SVG';
        switch (format) {
            case 'JPG': {
                card = await sharp(Buffer.from(cardSvg)).jpeg().toBuffer();
                type = 'JPG'; break;
            }
            case 'PNG': {
                card = await sharp(Buffer.from(cardSvg)).png().toBuffer();
                type = 'PNG'; break;
            }
        }
        apiRequest.sendCustom(card, null, type, 200);
    } catch(error) {
        apiRequest.sendError('error loading user card', 500);
        console.log(error);
    }
}

export async function gerUsers(apiRequest: ApiRequest) {
    const pageParam = apiRequest.ruleParams.Page ?? apiRequest.searchParams.get('page');
    const limitParam = apiRequest.searchParams.get('limit');
    if (!pageParam) return apiRequest.sendError('no page provided');
    if (!limitParam) return apiRequest.sendError('no limit provided');
    const page = parseInt(pageParam);
    const limit = parseInt(limitParam);
    if (isNaN(page) || isNaN(limit)) return apiRequest.sendError('invalid page or limit');
    if (page < 1) return apiRequest.sendError('page must be greater than 0');
    if (limit < 1) return apiRequest.sendError('limit must be greater than 0');
    const result = await userManager.getUsers(page, limit);
    const users = result.map(user => userManager.publicData(user));
    apiRequest.send({ page, limit, count: users.length, users });
}

export async function getProfile(apiRequest: ApiRequest) {
    const uuid = apiRequest.ruleParams.UUID ?? apiRequest.searchParams.get('uuid');
    if (!uuid) return apiRequest.sendError('no UUID provided');
    const user = await userManager.getUserById(uuid);
    if (!user) return apiRequest.sendError('user not found');
    const info = await user.data;
    if (!info) return apiRequest.sendError('user not found');
    const publicUser = userManager.publicData(info);
    apiRequest.send(publicUser);
}

export async function getAvatar(apiRequest: ApiRequest) {
    const uuid = apiRequest.ruleParams.UUID;
    const avatarID = apiRequest.ruleParams.AVATAR_ID;
    if (!uuid) return apiRequest.sendError('no UUID provided');
    if (!avatarID) return apiRequest.sendError('no avatar ID provided');
    const user = await userManager.getUserById(uuid);
    if (!user) return apiRequest.sendError('user not found');
    const path = `avatar/${uuid}/${avatarID}.jpg`;
    apiRequest.sendFile(path);
}

export async function editProfile(apiRequest: ApiRequest) {
    const authToken = apiRequest.authToken;
    if (!authToken) return apiRequest.unAuthorized();
    const tokenInfo = auth.validateSessionToken(authToken);
    if (!tokenInfo.valid) return apiRequest.unAuthorized();
    const POST = await apiRequest.post;
    if (POST.mimeType !== 'multipart/form-data') return apiRequest.sendError('invalid mimetype');
    const uuid = tokenInfo.data.uuid;
    const user = await userManager.getUserById(uuid);
    if (!user) return apiRequest.sendError('user not found');
    const userInfo = await user.data;
    if (!userInfo) return apiRequest.sendError('user not found');
    const { username, biography } = POST.content;
    const avatar = POST.files.avatar;
    let avatarUrl: string | undefined;
    if (username !== null && username !== undefined) {
        if (!userManager.isValidUsernames(username)) {
            return apiRequest.sendError('invalid username');
        }
        const existingUser = await userManager.getUserByUsername(username);
        if (existingUser) return apiRequest.sendError('username already in use');
    }
    if (biography !== undefined && biography.length > 500) {
        return apiRequest.sendError('invalid biography');
    }
    if (avatar) {
        if (!utilities.isImageFile(avatar.content, ['jpg', 'jpeg', 'png'])) {
            return apiRequest.sendError('invalid image format');
        }
        const avatarID = randomUUID();
        const filePath = `avatar/${uuid}/${avatarID}.jpg`;
        try {
            if (userInfo.profile.avatar) {
                const oldAvatarID = userInfo.profile.avatar.split('/').pop();
                const oldFilePath = `avatar/${uuid}/${oldAvatarID}.jpg`;
                if (oldAvatarID && FS.existsSync(oldFilePath)) {
                    await FS.promises.rm(oldFilePath);
                }
            }
            if (!FS.existsSync(`avatar/${uuid}`)) {
                await FS.promises.mkdir(`avatar/${uuid}`, { recursive: true });
            }
            await FS.promises.writeFile(filePath, avatar.content);
            avatarUrl = `/api/users/${uuid}/avatar/${avatarID}`;
        } catch (error) {
            console.log(error);
            return apiRequest.sendError('the image could not be saved');
        }
    }
    if (username === undefined && biography === undefined && !avatarUrl) {
        const publicUser = userManager.publicData(userInfo);
        return apiRequest.send(publicUser);
    }
    const updateProfile: { username?: string, biography?: string | null, avatar?: string } = {};
    if (username !== undefined)  updateProfile.username = username;
    if (biography !== undefined) {
        updateProfile.biography = biography !== '' ? biography : null;
    }
    if (avatarUrl !== undefined) updateProfile.avatar = avatarUrl;
    const result = await user.update({ profile: updateProfile, });
    if (!result) return apiRequest.sendError('an error has occurred');
    const publicUser = userManager.publicData(result);
    apiRequest.send(publicUser);
}