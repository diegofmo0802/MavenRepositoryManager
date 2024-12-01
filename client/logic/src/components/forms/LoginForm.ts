import TextInput from "../basic.components/TextInput.js";
import { Element, Component, Utilities, Events } from "../../WebApp/WebApp.js";
import { loading } from "../../app.js";
import Api from '../../Api/Api.js'

export class LoginForm extends Component<'form', LoginForm.eventMap> {
    protected component: Element<"form">;
    protected username: TextInput;
    protected password: TextInput;
    protected error: Element<'p'>;
    protected submitButton: Element<'button'>;
    public constructor() { super();
        this.username = new TextInput({ name: 'username', placeholder: 'username' });
        this.password = new TextInput({ type: 'password', name: 'password', placeholder: 'password' });
        this.error = Element.new('p').setAttribute('class', 'Form-error');
        this.submitButton = Element.new('button').text('Login').setAttribute('class', 'Button Login-button');

        this.component = Element.structure({ type: 'form', attribs: { class: 'Form', id: 'auth-login-form' }, childs: [
            { type: 'div', attribs: { class: 'Form-title' }, text: 'Login' },
            { type: 'div', attribs: { class: 'Form-fields' }, childs: [
                this.username.getComponent(), this.password.getComponent()
            ] }, this.error, this.submitButton
        ]})

        this.username.on('input', Utilities.debounce(this.validateUsername.bind(this), 500));
        this.password.on('input', Utilities.debounce(this.validatePassword.bind(this), 500));
        this.submitButton.on('click', (event) => {
            event.preventDefault();
            this.submit();
        });
    }
    protected getFormData(): LoginForm.data {
        return {
            username: this.username.getText(),
            password: this.password.getText()
        };
    }
    protected validateUsername(): boolean {
        const username = this.username.getText();
        if (username.length == 0) {
            this.error.text('username is required');
            this.submitButton.HTMLElement.disabled = true;
            return false
        } else if (username.length < 3 || username.length > 20) {
            this.error.text('the username must be between 3-20 characters');
            this.submitButton.HTMLElement.disabled = true;
            return false
        }
        this.error.text('');
        this.submitButton.HTMLElement.disabled = false;
        return true
    }
    protected validatePassword(): boolean {
        const password = this.password.getText();
        if (password.length == 0) {
            this.error.text('password is required');
            this.submitButton.HTMLElement.disabled = true;
            return false
        } else if (password.length < 3 || password.length > 20) {
            this.error.text('the password must be between 3-20 characters');
            this.submitButton.HTMLElement.disabled = true;
            return false
        }
        this.error.text('');
        this.submitButton.HTMLElement.disabled = false;
        return true
    }
    protected validateForm(): boolean {
        return this.validateUsername() && this.validatePassword();
    }
    protected async submit(): Promise<boolean> {
        if (!this.validateForm()) return false;
        this.error.text('')
        this.submitButton.HTMLElement.disabled = true;
        const { username, password } = this.getFormData();
        loading.spawn(this.component);
        try {
            const { user, token } = await Api.Auth.login(username, password);
            console.log('[Auth]: logged as ->', user.profile.username, user._id);
            this.dispatch('success', user, token);
            return true;
        } catch(error) {
            if (error instanceof Error) this.error.text(error.message);
            else this.error.text(`${error}`);
            return false;
        } finally {
            loading.finish();
            this.submitButton.HTMLElement.disabled = false;
        }
    }
}

export namespace LoginForm {
    export type Listener = (User: Api.Users.data, Token: string) => void;
    export interface data {
        username: string;
        password: string;
    }
    export type eventMap = {
        success: Listener
    }
}

export default LoginForm;