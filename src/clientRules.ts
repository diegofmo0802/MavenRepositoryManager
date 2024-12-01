import ServerCore from "saml.servercore";

import FS from 'fs';
import PATH from 'path';

export default function (server: ServerCore): void {
    // server.AddFolder('source', 'source');
    server.addFolder('/client', 'client/');
    // server.addFolder('/image', 'image');
    server.addFile('/', 'client/index.html');
    server.addFile('/app/*', 'client/index.html');
    server.addFile('favicon.ico', 'client/src/logo.svg');
    server.addFile('logo.png', 'client/src/logo.svg');
    // server.addFile('manifest.json', 'pwa/manifest.json');
    // server.addFile('worker.js', 'pwa/worker/build/worker.js');
    // server.addFile('worker.CacheManager.js', 'pwa/worker/build/worker.CacheManager.js');

    let cache: string[] | null = null;
    server.addAction('GET', 'worker.files-to-cache', async (request, response) => {
        if (cache) return response.sendJson(cache);
        const files: string[] = [];
        const exclude = [
            /^.*\/worker.js/,
            /^.*\/manifest.json/,
            /^.+\.d\.ts$/,
            /^.+\.map$/,
            /^.*\/node_modules\//,
            /^.*\/logic\/src\//,
        ];
        try {
            const [
                logic, styles, others
            ] = await Promise.all([
                getFilesToCache('/', 'client/style', exclude),
                getFilesToCache('/', 'client/logic', exclude),
                getFilesToCache('/', 'client/src', exclude),
            ]);
            files.push(...logic, ...styles, ...others);
            if (!cache) cache = files;
            response.sendJson(files);
        } catch (error) {
            if (error instanceof Error) console.log(error.message);
            response.SendError(500, 'Error getting files to worker cache');
        }
    });
}

function isExcluded(path: string, exclude: (RegExp | string)[]): boolean {
    return exclude.some((rule) => {
        if (rule instanceof RegExp) return rule.test(path);
        else rule === path;
    });
}
async function getFilesToCache(baseUrl: string, path: string, exclude?: (RegExp | string)[]): Promise<string[]> {
    if (exclude && isExcluded(path, exclude)) return [];
    const files: string[] = [];
    const stats = await FS.promises.stat(path);
    if (stats.isDirectory()) {
        const subPaths = await FS.promises.readdir(path);
        const subFiles = await Promise.all(subPaths.map(item => getFilesToCache(baseUrl, PATH.join(path, item), exclude)));
        files.push(...subFiles.flat());
    } else files.push(baseUrl + path);
    return files;
}