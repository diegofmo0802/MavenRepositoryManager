import { Element, Events, Component } from '../../WebApp/WebApp.js';


export class Loading extends Component<'div'> {
    protected component: Element<"div">;
    constructor(icon: string) { super();
        this.component = Element.structure({
            type: 'div', attribs: { class: 'Loading Loading-spawning' }, childs: [
                { type: 'div', childs: [
                    { type: 'img', attribs: { src: icon } },
                    { type: 'span' }, { type: 'span' }
                ] }
            ]
        });
    }
    public spawn(parent: Element, duration: number = 500, solid: boolean = false) {
        if (solid) this.component.setAttribute('solid', '');
        parent.append(this.component);
        this.component.animate([
            { opacity: 0 },
            { opacity: 1 }
        ], { duration, iterations: 1 });
    }
    public finish(duration: number = 500) {
        this.component.animate([
            { opacity: 1 },
            { opacity: 0 }
        ], { duration, iterations: 1 })
        .addEventListener('finish', () => {
            this.component.remove()
            this.component.removeAttribute('solid');
        });
    }
}

export namespace Loading {

}

export default Loading;