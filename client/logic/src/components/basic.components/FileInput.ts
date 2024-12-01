import { Element, Events, Component } from '../../WebApp/WebApp.js';

export class FileInput extends Component<'div', FileInput.EventMap> {
    protected component: Element<'div'>;
    protected inputFile: Element<'input'>;
    protected validator: FileInput.validator;

    constructor(options: FileInput.options = {}) {
        super();
        const label = options.label ?? 'Choose a file';
        const name = options.name ?? 'fileInput';

        this.validator = options.validator ?? ((files: File[]) => true);

        this.inputFile = Element.new('input').setAttributes({
            type: 'file', name, id: `file-input-${name}`,
            hidden: 'true',
        });

        this.component = Element.structure({
            type: 'div',
            attribs: { class: `file-input-wrapper${options.class ? ` ${options.class}` : ''}` },
        }).append(
            Element.structure({
                type: 'label', text: label,
                attribs: { for: `file-input-${name}`, class: 'file-input-label' },
            }), this.inputFile
        );

        if (options.id) this.component.setAttribute('id', options.id);

        this.inputFile.on('change', () => this.change());
    }

    protected change(): void {
        const files = this.getFiles();
        if (this.validator(files)) {
            this.dispatch('change', files);
            this.component.HTMLElement.classList.add('valid');
            this.component.HTMLElement.classList.remove('invalid');
        } else {
            this.dispatch('invalid', files);
            this.component.HTMLElement.classList.add('invalid');
            this.component.HTMLElement.classList.remove('valid');
        }
    }

    public getFile(index: number): File | null {
        const files = this.getFiles();
        return files[index] ?? null;
    }

    public getFiles(): File[] {
        const files = this.inputFile.HTMLElement.files;
        return files ? Array.from(files) : [];
    }

    public remove(): void {
        this.component.remove();
    }

    public clear(): void {
        this.inputFile.HTMLElement.value = '';
        this.component.HTMLElement.classList.remove('valid', 'invalid');
    }
}

export namespace FileInput {
    export interface options {
        label?: string;
        class?: string;
        id?: string;
        name?: string;
        validator?: validator;
    }
    export type validator = (files: File[]) => boolean;
    export type Listener = (files: File[]) => void;
    export type EventMap = {
        change: Listener;
        invalid: Listener;
    };
}

export default FileInput;
