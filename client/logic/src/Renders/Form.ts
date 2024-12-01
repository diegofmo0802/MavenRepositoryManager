import Api from "../Api/Api.js";
import app, { session } from "../app.js";
import RegisterForm from "../components/forms/RegisterForm.js";
import { renderError } from "./Basic.js";
import LoginForm from "../components/forms/LoginForm.js";
import NewVersionForm from "../components/forms/NewVersionForm.js";

export async function renderLoginForm() {
    try {
        const response = await Api.Auth.check();
        if (response.verify) {
            if (app.router.hasPrevious()) app.router.back();
            else app.router.setPage('/'); return;
        }
        const loginForm = new LoginForm();
        loginForm.on('success', (user, token) => {
            session.loadSession(user);
            if (app.router.hasPrevious()) app.router.back();
            else app.router.setPage('/');
        });
        app.getComponent('content').render(loginForm.getComponent());
    } catch(error) {
        renderError(500, 'failed to init app')
    }
}

export async function renderRegisterForm() {
    try {
        const response = await Api.Auth.check();
        if (response.verify) {
            if (app.router.hasPrevious()) app.router.back();
            else app.router.setPage('/'); return;
        }
        const registerForm = new RegisterForm();
        registerForm.on('success', (user, token) => {
            session.loadSession(user);
            if (app.router.hasPrevious()) app.router.back();
            else app.router.setPage('/');
        });
        app.getComponent('content').render(registerForm.getComponent());
    } catch(error) {
        renderError(500, 'failed to init app')
    }
}

export async function renderNewVersionForm() {
    try {
        const response = await Api.Auth.check();
        if (!response.verify) {
            if (app.router.hasPrevious()) app.router.back();
            else app.router.setPage('/login'); return;
        }
        const registerForm = new NewVersionForm();
        registerForm.on('success', () => {
            app.router.setPage('/');
        });
        app.getComponent('content').render(registerForm.getComponent());
    } catch(error) {
        renderError(500, 'failed to init app')
    }
}