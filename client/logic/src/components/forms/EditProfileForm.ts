import { Element, Component, Utilities, Events } from "../../WebApp/WebApp.js";
import Api from "../../Api/Api.js";
import LiveImageInput from "../basic.components/LiveImageInput.js";
import TextInput from "../basic.components/TextInput.js";
import { loading } from "../../app.js";

export class EditProfileForm extends Component<'div', EditProfileForm.EventMap> {
    protected component: Element<'div'>;
    protected user: Api.Users.visible;
    protected imageInput: LiveImageInput;
    protected username: TextInput;
    protected biography: TextInput;
    protected error: Element<'p'>;
    protected submitButton: Element<'button'>;

    public constructor(user: Api.Users.visible) { super();
        this.user = user;

        const cancelButton = Element.new('button').text('Cancel')
        .setAttribute('class', 'edit-profile-cancel-button');

        this.submitButton = Element.new('button').text('Save')
        .setAttribute('class', 'edit-profile-save-button');

        this.imageInput = new LiveImageInput({
            src: user.profile.avatar ?? '/client/src/logo.svg',
            class: 'avatar view-profile-avatar'
        });
        this.username = new TextInput({
            value: user.profile.username,
            class: 'view-profile-username',
            name: 'username',
            placeholder: 'username'
        });
        this.biography = new TextInput({
            type: 'textarea',
            name: 'biography',
            value: user.profile.biography ?? '',
            class: 'view-profile-biography',
            placeholder: 'biography'
        });

        this.error = Element.new('p').setAttribute('class', 'Form-error');

        this.component = Element.structure({
            type: 'div', attribs: { class: 'view-profile edit-profile' }, childs: [
                this.imageInput,
                this.username,
                this.biography,
                this.error,
                { type: 'div', attribs: { class: 'view-profile-options' }, childs: [
                    this.submitButton,
                    cancelButton
                ] }
            ]
        });

        this.username.on('input', Utilities.debounce(this.validateUsername.bind(this), 500));
        this.biography.on('input', Utilities.debounce(this.validateBiography.bind(this), 500));
        cancelButton.on('click', () => this.dispatch('cancel'));
        this.submitButton.on('click', (event) => {
            event.preventDefault();
            this.submit();
        });
    }

    private validateUsername(): boolean {
        const username = this.username.getText();
        if (username == this.user.profile.username) return true;
        if (username.length === 0) {
            this.error.text('Username is required');
            this.submitButton.HTMLElement.disabled = true;
            return false;
        } else if (username.length < 3 || username.length > 20) {
            this.error.text('Username must be between 3-20 characters');
            this.submitButton.HTMLElement.disabled = true;
            return false;
        }
        this.error.text('');
        this.submitButton.HTMLElement.disabled = false;
        return true;
    }

    private validateBiography(): boolean {
        const biography = this.biography.getText();
        if (
            biography != this.user.profile.biography
            && biography.length > 500
        ) {
            this.error.text('Biography must be between 5-500 characters');
            this.submitButton.HTMLElement.disabled = true;
            return false;
        }
        this.error.text('');
        this.submitButton.HTMLElement.disabled = false;
        return true;
    }

    private validateForm(): boolean {
        return this.validateUsername() && this.validateBiography();
    }

    private async submit(): Promise<boolean> {
        if (!this.validateForm()) return false;
        this.error.text('');
        this.submitButton.HTMLElement.disabled = true;
        loading.spawn(this.component);
        const profileData = this.getFormData();
        const username = profileData.username !== this.user.profile.username
        ? profileData.username : undefined;
        const biography = profileData.biography !== this.user.profile.biography
        ? profileData.biography : undefined;
        try {
            const updatedUser = await Api.Users.edit({
                username: username,
                biography: biography,
                avatar: profileData.avatar
            });
            console.log('[EditProfile]: Profile updated for ->', updatedUser.profile.username, updatedUser._id);
            this.dispatch('success', updatedUser);
            return true;
        } catch (error) {
            if (error instanceof Error) this.error.text(error.message);
            else this.error.text(`${error}`);
            return false;
        } finally {
            loading.finish();
            this.submitButton.HTMLElement.disabled = false;
        }
    }

    private getFormData(): EditProfileForm.EditProfileData {
        return {
            avatar: this.imageInput.getFile(),
            username: this.username.getText(),
            biography: this.biography.getText()
        };
    }
}

export namespace EditProfileForm {
    export type Listener = (user: Api.Users.visible) => void;
    export interface EditProfileData {
        avatar: File | undefined;
        username: string;
        biography: string;
    }
    export type EventMap = {
        success: Listener;
        cancel: Events.Listener;
    }
}

export default EditProfileForm;
