import _Auth from "./Auth.js";
import _Users from "./USers.js";
import _Repo from "./Repo.js";

export namespace Api {
    export const baseUrl = '/api';
    export import Auth = _Auth;
    export import Repo = _Repo;
    export import Users = _Users;
    export interface success<result = any> {
        success: true;
        result: result;
    }
    export interface error {
        success: false;
        reason: string;
    }
    export type response<result> = success<result> | error;
}

export default Api;