import { Element, Events, Component } from '../../WebApp/WebApp.js';
import TextInput from './TextInput.js';
import SelectInput from './SelectInput.js';

export class MultiTagInput extends Component<'div', MultiTagInput.EventMap> {
    protected component: Element<"div">;
    protected tagInput: TextInput | SelectInput;
    protected tagContainer: Element<'div'>;
    protected limit: number;
    protected minim: number;
    protected tags: Set<string>;
    protected validator: MultiTagInput.Validator;
    public constructor(options: MultiTagInput.options = {}) { super();
        const optionsList = options.options ?? [];
        const placeholder = options.placeholder ?? 'tag';

        this.limit = options.limit ?? -1;
        this.minim = options.minim ?? -1;
        this.validator = options.validator ?? ((tag: string) => true);
        this.tags = new Set();

        this.tagContainer = Element.new('div').setAttribute('class', 'multiTagInput-container');

        if (optionsList.length <= 0) {
            this.tagInput = new TextInput({
                placeholder: placeholder,
                button: 'add',
                validator: this.validator,
            });
            this.tagInput.on('send', (tag: string) => { this.addTag(tag) });
        } else {
            this.tagInput = new SelectInput(optionsList, placeholder);
            this.tagInput.on('send', (tag: string) => { this.addTag(tag) });
        }
        
        this.component = Element.structure({
            type: 'div', attribs: { class: 'multiTagInput' }, childs: [
                this.tagContainer,
                this.tagInput.getComponent()
            ]
        });
    }
    protected newTag(tag: string): Element<'span'> {
        const tagElement = Element.new('span')
        .setAttribute('class', 'multiTagInput-tag')
        .text(tag).on('click',() => {
            this.deleteTag(tag, tagElement);
        });
        return tagElement;
    }
    protected deleteTag(tag: string, tagElement: Element<'span'>): void {
        this.tags.delete(tag);
        tagElement.remove();
    }
    protected addTag(tag: string): Element<'span'> | void {
        if (this.tags.has(tag)) return;
        if (this.limit != -1 && this.tags.size >= this.limit) return this.dispatch('limit', tag);
        if (tag.length < 1 || !this.validator(tag)) return this.dispatch('invalid', tag);
        this.tags.add(tag);
        const newTag = this.newTag(tag);
        this.tagContainer.append(newTag);
        if (this.tagInput instanceof TextInput) this.tagInput.clear();
        this.dispatch('add', tag);
        return newTag;
    }
    public getTags() {
        return [...this.tags];
    }
    public remove(): void {
        this.component.remove();
    }
}

export namespace MultiTagInput {
    export interface options {
        limit?: number,
        minim?: number,
        options?: string[],
        placeholder?: string,
        validator?: Validator,
    }
    export type Validator = (tag: string) => boolean
    export type EventMap = {
        add: Events.Listener
        invalid: Events.Listener
        limit: Events.Listener
    }
}

export default MultiTagInput;