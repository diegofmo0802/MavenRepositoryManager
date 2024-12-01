import { Element, Events, Component } from '../../WebApp/WebApp.js';

export class SwitchInput extends Component<'div', SwitchInput.EventMap> {
    protected component: Element<"div">;
    protected state: boolean;
    public constructor(defaultState: boolean = true, label: string = '') { super();
        const id = 'switchInput-' + Math.random().toString(36).substring(2, 9);
        
        this.state = defaultState;

        this.component = Element.structure({
            type: 'div', attribs: { class: `switchInput ${this.state ? 'active' : ''}` }, childs: [
                { type: 'label', text: label, attribs: { for: id }, events: {
                    click: () => this.toggleState()
                } },
                { type: 'div', attribs: { id, class: 'switch-track' }, childs: [
                    { type: 'div', attribs: { class: 'switch-knob' } }
                ], events: {
                    click: () => this.toggleState()
                } }
            ]
        })
    }
    public toggleState() {
        this.state = !this.state;
        this.component.HTMLElement.classList.toggle('active');
        this.dispatch('change', this.state);
    }
    public getState(): boolean {
        return this.state;
    }
    public remove(): void {
        this.component.remove();
    }
}

export namespace SwitchInput {
    export type Listener = (state: boolean) => void;
    export type EventMap = {
        change: Listener;
    }
}

export default SwitchInput;