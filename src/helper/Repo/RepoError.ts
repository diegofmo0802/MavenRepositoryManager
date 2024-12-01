export class RepoError extends Error {
    constructor(type: RepoError.type, reason: string, cause?: Error) {
        super(reason, { cause })
    }
}
export namespace RepoError {
    export type type = 'INIT' | 'UPLOAD'
}
export default RepoError;