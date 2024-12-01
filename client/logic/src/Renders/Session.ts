import Api from "../Api/Api.js";
import app, { session } from "../app.js";
import { renderError } from "./Basic.js";

export async function renderSession() {
    app.getComponent('session').render(session.getComponent());
    try {
        const response = await Api.Auth.check();
        if (response.verify) session.loadSession(response.user);
    } catch(error) {
        renderError(500, 'failed to init app', `${error}`);
    }
}