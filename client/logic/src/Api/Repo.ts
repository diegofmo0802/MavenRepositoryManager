import Api from "./Api.js";

export class Repo {
    public static async upload(properties: Repo.Upload.Properties, files: Repo.Upload.Files): Promise<Api.response<string>> {
        const formData = new FormData();
        formData.append('groupID', properties.groupID);
        formData.append('artifactID', properties.artifactID);
        formData.append('version', properties.version);
        formData.append('compiler.source', properties.compiler?.source ?? '');
        formData.append('compiler.target', properties.compiler?.target ?? '');
        formData.append('jar', files.jar);
        if (files.pom) formData.append('pom', files.pom);
        if (files.source) formData.append('source', files.source);
        if (files.javadoc) formData.append('javadoc', files.javadoc);
        const response = await fetch('/api/repo/upload', { method: 'POST', body: formData });
        const data = await response.json();
        if (response.ok) {
            if (data.success) return data.result;
            else throw new Error(data.reason);
        } else throw new Error(data.reason);
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
            jar: File;
            source?: File;
            javadoc?: File;
            pom?: File;
        };
        export interface Properties extends Omit<Maven.Properties, 'compiler'> {
            compiler?: Maven.Compiler
        }
    }
}
export default Repo;