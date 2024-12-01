import { Element, Events, Component } from '../../WebApp/WebApp.js';

export class TextInput extends Component<'div', TextInput.EventMap> {
    protected component: Element<"div">;
    protected inputText: Element<"input"> | Element<"textarea">;
    protected button?: Element<"button">;
    protected validator: TextInput.validator;
    constructor(options: TextInput.options = {}) { super();
        const placeholder = options.placeholder ?? 'text';
        const textButton = options.button ?? '';
        const name = options.name ?? 'text';
        const type = options.type ?? 'text';

        this.validator = options.validator ?? ((text: string) => true);

        if (type == 'textarea') {
            this.inputText = Element.new('textarea').setAttributes({
                name: name,
                placeholder: placeholder,
            });
            if (options.value) this.inputText.HTMLElement.value = options.value;
        } else {
            this.inputText = Element.new('input').setAttributes({
                type: type,
                name: name,
                placeholder: placeholder,
            });
            if (options.value) this.inputText.HTMLElement.value = options.value;
        }

        if (textButton.length > 0) {
            this.button = Element.new('button').text(textButton);
        }

        this.component = Element.structure({
            type: 'div', attribs: { class: `textInput${options.class ? ` ${options.class}` : ''}` }, childs: [
                this.inputText, ...(this.button ? [this.button] : [])
            ]
        });
        if (options.id) this.component.setAttribute('id', options.id);

        this.button?.on('click', () => this.send());
        this.inputText.on('input', () => this.dispatch('input', this.getText()));
        this.inputText.on('keypress', (event) => {
            if (event.key == 'Enter') this.send();
        });
    }
    protected send(): void {
        const text = this.getText();
        if (this.validator(text)) this.dispatch('send', text);
        else this.dispatch('invalid', text);
    }
    public getText(): string {
        return this.inputText.HTMLElement.value;
    }
    public remove(): void {
        this.component.remove();
    }
    public clear(): void {
        this.inputText.HTMLElement.value = '';
    }
}

export namespace TextInput {
    export interface options {
        placeholder?: string,
        type?: 'text' | 'textarea' | 'email' | 'password',
        class?: string,
        id?: string,
        value?: string,
        name?: string,
        button?: string,
        validator?: validator,
    }
    export type validator = (text: string) => boolean;
    export type Listener = (text: string) => void;
    export type EventMap = {
        send: Listener,
        input: Listener,
        invalid: Listener,
    }
}

export default TextInput;