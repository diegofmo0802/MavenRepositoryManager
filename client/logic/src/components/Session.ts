import { Element, Events, Component } from '../WebApp/WebApp.js';
import Api from '../Api/Api.js';

class Session extends Component<'div', Session.EventMap> {
    protected component: Element<'div'>;
    protected options: Element<'div'> | undefined;
    protected user: Api.Users.visible | undefined;
    
    public constructor(user?: Api.Users.visible) {
        super();
        this.user = user;
        this.component = Element.new('div').setAttribute('class', 'session off-session');
        user ? this.loadSession(user) : this.close();
        this.setupEventListeners();
    }

    protected setupEventListeners() {
        this.component.on('click', () => this.toggleOptions());
        this.component.on('mouseleave', () => this.hideOptions());
    }

    public close() {
        this.clearComponent();
        this.renderLoggedOutState();
    }

    public loadSession(user: Api.Users.visible) {
        this.clearComponent();
        this.user = user;
        this.renderLoggedInState();
    }

    protected clearComponent() {
        this.options = undefined;
        this.component.clean();
    }

    protected renderLoggedOutState() {
        this.component.setAttribute('class', 'session off-session');
        this.component.append(
            { type: 'button', text: 'Login', attribs: { class: 'Button session-button-login' }, events: { click: () => this.dispatch('login') } },
            { type: 'button', text: 'Register', attribs: { class: 'Button session-button-register' }, events: { click: () => this.dispatch('register') } }
        );
    }

    protected renderLoggedInState() {
        this.options = this.createSessionOptions();
        this.component.setAttribute('class', 'session on-session');
        this.component.append(
            { type: 'div', attribs: { class: 'session-user' }, childs: [
                { type: 'img', attribs: { class: 'avatar', src: this.user?.profile.avatar ?? '/client/src/logo.svg' } },
                { type: 'p', text: this.user?.profile.username }
            ] }, this.options
        );
    }

    protected createSessionOptions(): Element<'div'> {
        return Element.new('div').setAttributes({class: 'session-options', show: 'false'}).append(
            { type: 'button', text: 'New Post', attribs: { class: 'Button session-button-new-post' }, events: { click: () => this.dispatch('option', 'newPost') } },
            { type: 'button', text: 'Profile', attribs: { class: 'Button session-button-profile' }, events: { click: () => this.dispatch('option', 'profile') } },
            { type: 'button', text: 'Log Out', attribs: { class: 'Button session-button-logout' }, events: { click: () => this.dispatch('option', 'logout') } }
        );
    }

    public toggleOptions() {
        if (this.options?.getAttribute('show') === 'true') {
            this.hideOptions();
        } else {
            this.showOptions();
        }
    }

    public showOptions() {
        if (!this.options) return;
        this.options.setAttribute('show', 'true');
        this.options.setAttribute('animating', 'true');
        this.options.animate([
            { height: 0 },
            { height: `${this.options.HTMLElement.clientHeight}px` }
        ], { duration: 250 }).addEventListener('finish', () => {
            this.options?.removeAttribute('animating');
        });
    }

    public hideOptions() {
        if (!this.options) return;
        if (this.options.getAttribute('show') === 'false') return;
        this.options.setAttribute('animating', 'true');
        this.options.animate([
            { height: `${this.options.HTMLElement.clientHeight}px` },
            { height: 0 }
        ], { duration: 250 }).addEventListener('finish', () => {
            this.options?.removeAttribute('animating');
            this.options?.setAttribute('show', 'false');
        });
    }
}

namespace Session {
    export type Options = 'newPost' | 'profile' | 'logout';
    export type SelectOptionListener = (option: Options) => void;
    export type EventMap = {
        option: SelectOptionListener;
        login: Events.Listener;
        register: Events.Listener;
    }
}

export default Session;