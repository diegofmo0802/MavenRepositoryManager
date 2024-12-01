import { Element, Events, Component } from '../../WebApp/WebApp.js';

export class SelectInput<options extends string[] = string[]> extends Component<'select', SelectInput.EventMap<options>> {
    protected component: Element<"select">;
    protected placeholder: string;
    public constructor(options: options, placeholder: string = 'select') { super();
        this.placeholder = placeholder;

        this.component = Element.new('select').setAttributes({
            name: 'select',
            class: 'selectInput'
        }).append(
            Element.new('option').text(this.placeholder),
            ...options.map(option => Element.new('option').text(option))
        );

        this.component.on('change', () => this.dispatch('send', this.getSelected()));
    }
    public getSelected(): options[number] {
        if (this.component.HTMLElement.value == this.placeholder) return '';
        return this.component.HTMLElement.value;
    }
    public remove(): void {
        this.component.remove();
    }
}

export namespace SelectInput {
    export type Listener<options extends string[] = string[]> = (selected: options[number]) => void;
    export type EventMap<options extends string[] = string[]> = {
        send: Listener<options>;
    }
}

export default SelectInput;