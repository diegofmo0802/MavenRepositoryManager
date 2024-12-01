import UserManager from "../helper/UserManager/UserMAnager.js";
import auth from "./auth.js";
import db from "./dbManager.js";

export const userCollection = db.collection('users');

export const userManager = new UserManager(auth, userCollection);

export default userManager;