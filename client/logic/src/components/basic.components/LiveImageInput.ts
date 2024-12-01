import { Element, Events, Component } from '../../WebApp/WebApp.js';
import Loading from './Loading.js';

export class LiveImageInput extends Component<'div', LiveImageInput.EventMap> {
    protected component: Element<"div">;
    protected inputFile: Element<"input">;
    protected label: Element<"label">;
    protected preview: Element<"img">;
    protected id: string;
    protected default: string;
    protected accept: LiveImageInput.formats[];
    protected loading: Loading;
    constructor(options: LiveImageInput.options = {}) { super();
        this.accept = options.accept ?? ['jpg', 'jpeg', 'png', 'gif'];
        this.default = options.src ?? '';
        this.id = 'liveImageInput-' + Math.random().toString(36).substring(2, 9);

        this.loading = new Loading('/client/src/logo.svg');

        this.preview = Element.new('img').setAttributes({
            class: 'liveImageInput-preview',
            src: this.default
        });
        this.label = Element.new('label').setAttributes({
            for: this.id,
            class: 'liveImageInput-label'
        }).append(this.preview);
        this.inputFile = Element.new('input').setAttributes({
            type: 'file',
            accept: this.accept.map(format => '.' + format).join(','),
            required: '',
            name: 'image',
            placeholder: 'image',
            class: 'liveImageInput-input',
            id: this.id
        }).on('change', () => this.loadPreview());

        this.component = Element.new('div')
        .setAttribute('class', `liveImageInput${options.class ? ` ${options.class}` : ''}`)
        .append(this.label, this.inputFile);
        if (options.id) this.component.setAttribute('id', options.id);
    }
    protected loadPreview(): void {
        const file = this.inputFile.HTMLElement.files?.[0];
        if (!file) {
            this.preview.setAttribute('src', this.default); return;
        }
        this.loading.spawn(this.label);
        const reader = new FileReader();
        reader.onload = () => {
            this.preview.setAttribute('src', reader.result as string);
            this.loading.finish();
            this.dispatch('select', file);
        };
        reader.readAsDataURL(file);
    }
    public getFile(): File | undefined {
        return this.inputFile.HTMLElement.files?.[0];
    }
    public remove(): void {
        this.component.remove();
    }
}

export namespace LiveImageInput {
    export type formats = 'jpg' | 'jpeg' | 'png' | 'gif';
    export type Listener = (file: File) => void;
    export interface options {
        accept?: formats[];
        src?: string;
        class?: string;
        id?: string;
    }
    export type EventMap = {
        select: Listener;
    }
}

export default LiveImageInput;