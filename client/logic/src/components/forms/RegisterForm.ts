import TextInput from "../basic.components/TextInput.js";
import { Element, Component, Utilities, Events } from "../../WebApp/WebApp.js";
import { loading } from "../../app.js";
import Api from '../../Api/Api.js'

export class RegisterForm extends Component<'form', RegisterForm.EventMap> {
    protected component: Element<"form">;
    protected username: TextInput;
    protected email: TextInput;
    protected password: TextInput;
    protected confirmation: TextInput;
    protected error: Element<'p'>;
    protected submitButton: Element<'button'>;
    public constructor() { super();
        this.username = new TextInput({ name: 'username', placeholder: 'username' });
        this.email = new TextInput({ name: 'email', placeholder: 'email' });
        this.password = new TextInput({ type: 'password', name: 'password', placeholder: 'password' });
        this.confirmation = new TextInput({ type: 'password', name: 'confirmation', placeholder: 'repeat password' });
        this.error = Element.new('p').setAttribute('class', 'Form-error');
        this.submitButton = Element.new('button').text('Register').setAttribute('class', 'Button Register-button');

        this.component = Element.structure({ type: 'form', attribs: { class: 'Form', id: 'auth-register-form' }, childs: [
            { type: 'div', attribs: { class: 'Form-title' }, text: 'Register' },
            { type: 'div', attribs: { class: 'Form-fields' }, childs: [
                this.username.getComponent(), this.email.getComponent(),
                this.password.getComponent(), this.confirmation.getComponent()
            ] }, this.error, this.submitButton
        ]})

        this.username.on('input', Utilities.debounce(this.validateUsername.bind(this), 500));
        this.email.on('input', Utilities.debounce(this.validateEmail.bind(this), 500));
        this.password.on('input', Utilities.debounce(this.validatePassword.bind(this), 500));
        this.confirmation.on('input', Utilities.debounce(this.validateConfirmation.bind(this), 500));
        this.submitButton.on('click', (event) => {
            event.preventDefault();
            this.submit();
        });
    }
    protected getFormData(): RegisterForm.data {
        return {
            username: this.username.getText(),
            password: this.password.getText(),
            email: this.email.getText(),
            confirmation: this.confirmation.getText()
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
    protected validateEmail(): boolean {
        const email = this.email.getText();
        if (email.length == 0) {
            this.error.text('email is required');
            this.submitButton.HTMLElement.disabled = true;
            return false
        } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
            this.error.text('invalid email');
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
    protected validateConfirmation() {
        const password = this.password.getText();
        const confirmation = this.confirmation.getText();
        if (password !== confirmation) {
            this.error.text('passwords do not match');
            this.submitButton.HTMLElement.disabled = true;
            return false
        }
        this.error.text('');
        this.submitButton.HTMLElement.disabled = false;
        return true
    }
    protected validateForm(): boolean {
        return this.validateUsername() && this.validateEmail() && this.validatePassword() && this.validateConfirmation();
    }
    protected async submit(): Promise<boolean> {
        if (!this.validateForm()) return false;
        this.submitButton.HTMLElement.disabled = true;
        this.error.text('');
        const { username, password, email, confirmation } = this.getFormData();
        loading.spawn(this.component);
        try {
            const { user, token } = await Api.Auth.register(username, email, password, confirmation);
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

export namespace RegisterForm {
    export type Listener = (User: Api.Users.data, Token: string) => void;
    export interface data {
        username: string;
        password: string;
        email: string;
        confirmation: string;
    }
    export type EventMap = {
        success: Listener;
    }
}

export default RegisterForm;