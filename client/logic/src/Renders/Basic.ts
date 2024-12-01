import app from "../app.js";
import { ErrorPage } from "../components/basic.components.js";

export function renderError(code: number | string, message: string, description?: string) {
    app.getComponent('content').render(ErrorPage(code, message, description));
}