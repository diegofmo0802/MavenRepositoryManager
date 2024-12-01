import Api from "./Api.js";
import Users from "./USers.js";

export class Auth {
    public static async login(login: string, password: string): Promise<Auth.login> {
        const response = await fetch(`${Api.baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: login, password })
        });
        const data = await response.json();
        if (response.ok) {
            if (data.success) return data.result;
            else throw new Error(data.reason);
        } else throw new Error(data.reason);
    }
    public static async register(login: string, email: string, password: string, confirmation: string): Promise<Auth.login> {
        const response = await fetch(`${Api.baseUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: login, email, password, confirmation })
        });
        const data = await response.json();
        if (response.ok) {
            if (data.success) return data.result;
            else throw new Error(data.reason);
        } else throw new Error(data.reason);
    }
    public static async logout(): Promise<"ok"> {
        const response = await fetch(`${Api.baseUrl}/auth/logout`, { method: 'GET', });
        const data = await response.json();
        if (response.ok) {
            if (data.success) return data.result;
            else throw new Error(data.reason);
        } else throw new Error(data.reason);
    }
    public static async check(): Promise<Auth.verify> {
        const response = await fetch(`${Api.baseUrl}/auth/verify`, { method: 'GET', });
        const data = await response.json();
        if (response.ok) {
            if (data.success) return data.result;
            else throw new Error(data.reason);
        } else throw new Error(data.reason);
    }
}
export namespace Auth {
    export interface login {
        token: string;
        user: Users.data;
    }
    export type verify = {
        verify: false;
    } | { verify: true; user: Users.data }
}
export default Auth;