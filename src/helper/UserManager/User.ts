import mongodb from 'mongodb';
import { Utilities } from "saml.servercore";
import UserManager from "./UserMAnager.js";
import { Collection, Schema } from "DBManager/Manager.js";
import { users } from "config/dbSchemas.js";

export class User {
    protected userData: User.data | null = null;
    constructor(
        public readonly userManager: UserManager,
        public readonly uuid: string
    ) {}
    public get data(): Promise<User.data | null> {
        if (this.userData) return Promise.resolve(this.userData);
        return this.userManager.collection.operation(async (db, collection) => {
            const data = await collection.findOne({ _id: this.uuid });
            this.userData = data;
            return data;
        });
    }
    public update(value: User.updateData): Promise<User.data | null> {
        return this.userManager.collection.transaction(async (db, collection) => {
            const toUpdate = Utilities.flattenObject(value);
            const update = await collection.updateOne({ _id: this.uuid }, { $set: toUpdate });
            const user = await collection.findOne({ _id: update.upsertedId ?? this.uuid });
            return user ? user : null;
        });
    }
}

export namespace User {
    type PartialRecursive<T> = {
        [K in keyof T]?: T[K] extends object ? PartialRecursive<T[K]> : T[K];
    };
    export type data = Schema.Infer.schema<typeof users.schema>
    export type publicData = Omit<data, 'auth' | 'email'>;
    export type dataFlattened = Utilities.Flatten.Object<data>;
    export type publicDataFlatted = Utilities.Flatten.Object<publicData>;
    
    export type updateData = PartialRecursive<data>;
}

export default User;