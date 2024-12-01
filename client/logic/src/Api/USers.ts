import Api from "./Api.js";

export class Users {
    public static async getAll(page: number, limit: number = 10) {
        const response = await fetch(`${Api.baseUrl}/users?page=${page}&limit=${limit}`, { method: 'GET' });
        const data = await response.json();
        if (response.ok) {
            if (data.success) return data.result;
            else throw new Error(data.reason);
        } else throw new Error(data.reason);
    }
    public static async get(id: string): Promise<Users.data> {
        const response = await fetch(`${Api.baseUrl}/users/${id}`, { method: 'GET' });
        const data = await response.json();
        if (response.ok) {
            if (data.success) return data.result;
            else throw new Error(data.reason);
        } else throw new Error(data.reason);
    }
    public static async edit(options: Users.editOptions): Promise<Users.data> {
        const data = new FormData();
        if (options.username !== undefined)  data.append('username', options.username);
        if (options.biography !== undefined) data.append('biography', options.biography);
        if (options.avatar !== undefined)    data.append('avatar', options.avatar);
        const response = await fetch(`${Api.baseUrl}/users`, {
            method: 'PUT',
            // headers: { 'Content-Type': 'multipart/form-data' },
            body: data
        });
        const result = await response.json();
        if (response.ok) {
            if (result.success) return result.result;
            else throw new Error(result.reason);
        } else throw new Error(result.reason);
    }
}

export namespace Users {
    export interface editOptions {
        username?: string;
        biography?: string;
        avatar?: File;
    }
    export interface profile {
        username: string;
        biography?: string;
        avatar?: string;
        role?: string;
    }
    export interface email {
        address: string;
        verified: boolean;
        verifyToken?: string | null;
    }
    export interface visible {
        _id: string;
        profile: profile;
    }
    export interface data {
        _id: string;
        profile: Users.profile;
        email: Users.email;
    }
}
export default Users;