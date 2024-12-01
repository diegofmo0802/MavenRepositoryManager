import { createHash } from 'crypto';
import { promises as FS } from 'fs';
import { Debug, Template, Utilities } from "saml.servercore";

import RepoError from './RepoError.js';

const debug = Debug.getInstance('_repo');
debug.setSave(false);

export class Repo {
    private readonly dir: string;
    private constructor(dir: string) {
        this.dir = dir;
    }
    /**
     * Create a new repo.
     * @param dir The directory to create the repo in.
     * @returns The new repo.
     */
    public static async new(dir: string): Promise<Repo> {
        const repo = new Repo(dir);
        await repo.initializeDir(dir);
        return repo;
    }
    /**
     * Initialize the repo directory.
     * @param dir The directory to create the repo in.
     */
    private async initializeDir(dir: string) {
        debug.log('initializing repo dir', dir);
        try {
            await FS.stat(dir);
        } catch (error: any) {
            if (this.isNodeError(error) && error.code === 'ENOENT') {
                debug.log('creating repo dir', dir);
                try {
                    await FS.mkdir(dir, { recursive: true });
                } catch(error) {
                    debug.log('error initializing repo dir', dir, error);
                    throw new RepoError('INIT', 'Fail creating repository dir');
                }
            } else {
                debug.log('error initializing repo dir', dir, error);
                throw new RepoError('INIT', 'Fail initializing repository');
            }
        }
    }
    public async upload(properties: Repo.Upload.Properties, files: Repo.Upload.Files): Promise<void> {
        const { groupID, artifactID, version } = this.parseProperties(properties);
        const { jar, source, javadoc, pom } = files;
        debug.log('uploading', groupID, artifactID, version);
       
        const groupDir = Utilities.Path.normalize(groupID.replace(/\./g, '/'));
        const artifactDir = Utilities.Path.normalize(`${this.dir}/${groupDir}/${artifactID}/${version}`);
        await this.initializeDir(artifactDir);

        const jarPath = Utilities.Path.normalize(`${artifactDir}/${artifactID}-${version}.jar`);
        try {
            await FS.writeFile(jarPath, jar);
            await FS.writeFile(`${jarPath}.sha256`, this.generateHash(jar));
        } catch(error) {
            debug.log('error uploading jar file', jarPath, error);
            throw new RepoError('UPLOAD', 'Fail uploading jar file');
        }

        if (source) {
            const sourcePath = `${artifactDir}/${artifactID}-${version}-sources.jar`;
            try {
                await FS.writeFile(sourcePath, source);
                await FS.writeFile(`${sourcePath}.sha256`, this.generateHash(source));
            } catch(error) {
                debug.log('error uploading jar-source file', sourcePath, error);
                throw new RepoError('UPLOAD', 'Fail uploading jar-source file');
            }
        }
        
        if (javadoc) {
            const javadocPath = `${artifactDir}/${artifactID}-${version}-javadoc.jar`;
            try {
                await FS.writeFile(javadocPath, javadoc);
                await FS.writeFile(`${javadocPath}.sha256`, this.generateHash(javadoc));
            } catch(error) {
                debug.log('error uploading javadoc file', javadocPath, error);
                throw new RepoError('UPLOAD', 'Fail uploading javadoc file');
            }
        }

        const pomPath = `${artifactDir}/${artifactID}-${version}.pom`;
        if (pom) {
            try {
                await FS.writeFile(pomPath, pom);
                await FS.writeFile(`${pomPath}.sha256`, this.generateHash(pom));
            } catch(error) {
                debug.log('error uploading pom file', pomPath, error);
                throw new RepoError('UPLOAD', 'Fail uploading pom file');
            }
        } else {
            try {
                const generatedPom = await this.generatePom(properties);
                await FS.writeFile(pomPath, generatedPom);
                await FS.writeFile(`${pomPath}.sha256`, this.generateHash(generatedPom));
            } catch(error) {
                debug.log('error uploading/creating pom file', pomPath, error);
                throw new RepoError('UPLOAD', 'Fail uploading/creating pom file');
            }
        }
    }
    /**
     * Parse and validate the properties.
     * @param properties The properties to parse.
     * @returns The validated properties.
     */
    private parseProperties(properties: Repo.Upload.Properties): Repo.Upload.Properties {
        const groupID = properties.groupID?.trim();
        const artifactID = properties.artifactID?.trim();
        const version = properties.version?.trim();
        const compiler = properties.compiler;

        if (!groupID || groupID === '') {
            throw new Error('groupID is required and cannot be empty.');
        }
        if (!artifactID || artifactID === '') {
            throw new Error('artifactID is required and cannot be empty.');
        }

        if (/[<>:"|?*]/.test(groupID) || /[<>:"|?*]/.test(artifactID)) {
            throw new Error('Invalid characters detected in groupID or artifactID.');
        }

        if (!version || version === '') {
            throw new Error('version is required and cannot be empty.');
        }
        if (compiler) {
            if (!compiler.source || compiler.source.trim() === '') {
                throw new Error('compiler.source is required and cannot be empty.');
            }
            if (!compiler.target || compiler.target.trim() === '') {
                throw new Error('compiler.target is required and cannot be empty.');
            }
        }
        if (!/^[a-zA-Z0-9_.-]+$/.test(groupID)) {
            throw new Error('groupID contains invalid characters. Only letters, numbers, dots, hyphens, and underscores are allowed.');
        }
        if (!/^[a-zA-Z0-9_.-]+$/.test(artifactID)) {
            throw new Error('artifactID contains invalid characters. Only letters, numbers, dots, hyphens, and underscores are allowed.');
        }
        if (!/^\d+(\.\d+)*$/.test(version)) {
            throw new Error('version must follow a numeric format (e.g., 1.0.0).');
        }
        return {
            groupID, artifactID, version, compiler
        };
    }
    /**
     * Generate a SHA-256 hash of the given data.
     * @param data The data to hash.
     * @returns The hash as a hex string.
     */
    private generateHash(data: Buffer): string {
        const hash = createHash('sha256');
        hash.update(data);
        return hash.digest('hex');
    }
    /**
     * Verify file integrity by comparing the hash.
     * @param filePath The path to the file.
     * @returns True if the hash matches, false otherwise.
     */
    private async verifyHash(filePath: string): Promise<boolean> {
        const fileData = await FS.readFile(filePath);
        const savedHash = await FS.readFile(`${filePath}.sha256`, 'utf-8');
        const calculatedHash = this.generateHash(fileData);
        return savedHash === calculatedHash;
    }
    /**
     * Generate a pom file from the properties.
     * @param properties The properties to use.
     * @returns The pom file.
     */
    private async generatePom(properties: Repo.Upload.Properties): Promise<Buffer> {
        const { groupID, artifactID, version, compiler } = properties;
        const template = await Template.load('assets/pom.xml', {
            groupID, artifactID, version,
            'compiler.source': compiler?.source,
            'compiler.target': compiler?.target
        });
        return Buffer.from(template);
    }
    /**
     * Check if an error is a node error.
     * @param error The error to check.
     * @returns True if the error is a node error.
     */
    private isNodeError(error: unknown): error is NodeJS.ErrnoException {
        return typeof error === 'object' && error !== null && 'code' in error;
    }
}

export namespace Repo {
    export namespace Maven {
        export interface Compiler {
            source: string;
            target: string;
        }
        export interface Properties {
            groupID: string;
            artifactID: string;
            version: string;
            compiler: Compiler;
        }
    }
    export namespace Upload {
        export interface Files {
            jar: Buffer;
            source?: Buffer;
            javadoc?: Buffer;
            pom?: Buffer;
        };
        export interface Properties extends Omit<Maven.Properties, 'compiler'> {
            compiler?: Maven.Compiler
        }
    }
}
export default Repo;