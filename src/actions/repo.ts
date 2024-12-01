import { Debug } from "saml.servercore";

import auth from "../config/auth.js";
import ApiRequest from "../base/ApiRequest.js";
import { Repo } from "../helper/Repo/Repo.js";
import userManager from "../config/userManager.js";

export async function upload(api: ApiRequest) {
    const authToken = api.authToken;
    if (!authToken) return api.unAuthorized();
    const tokenInfo = auth.validateSessionToken(authToken);
    if (!tokenInfo.valid) return api.unAuthorized();
    const user = await userManager.getUserById(tokenInfo.data.uuid);
    if (!user) return api.unAuthorized();
    const userInfo = await user.data;
    if (!userInfo) return api.sendError('user info not found', 500);

    if (userInfo._id !== '7fe2e4ec-a46f-41cf-b0f7-962c4e5b4914')
        return api.sendError('not authorized, cause not is included user politics yet', 403);

    const POST = await api.post;
    if (POST.mimeType !== 'multipart/form-data') return api.sendError('invalid mimetype');

    const {
        groupID, artifactID, version,
        'compiler.target': compilerTarget, 'compiler.source': compilerSource
    } = POST.content;
    if (!groupID) return api.sendError('groupID is required');
    if (!artifactID) return api.sendError('artifactID is required');
    if (!version) return api.sendError('version is required');

    const { jar, source, javadoc, pom } = POST.files;
    if (!jar) return api.sendError('jar file is required');
    let compiler: Repo.Maven.Compiler | undefined = undefined;
    if (!pom) {
        if (!compilerSource) return api.sendError('compiler.source is required');
        if (!compilerTarget) return api.sendError('compiler.target is required');
        compiler = { source: compilerSource, target: compilerTarget };
    }
    try {
        const repo = await Repo.new(`repo/${userInfo.profile.username}`);
        await repo.upload({
            groupID, artifactID, version, compiler
        }, {
            jar: jar.content,
            source: source?.content,
            javadoc: javadoc?.content,
            pom: pom?.content
        })
        return api.send('ok');
    } catch(error) {
        Debug.log('error on repo.upload', error);
        return api.sendError('error on upload', 500);
    }
}