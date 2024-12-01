import Api from '../../Api/Api.js';
import { Element, Component, Utilities } from '../../WebApp/WebApp.js';
import Loading from '../basic.components/Loading.js';

export class UserList extends Component<'div', UserList.EventMap> {
    protected component: Element<'div'>;
    protected userList: Element<'div'>;
    protected loading: Loading;
    protected endMessage: Element<'div'>;
    protected userElements: Element<'div'>[] = [];
    protected users: Api.Users.visible[] = [];
    public constructor(users: Api.Users.visible[] = []) { super()
        this.loading = new Loading('/client/src/logo.svg');
        this.endMessage =  Element.structure({type: 'div', attribs: { class: 'user endMessage' }, childs: [
            { type: 'p', text: 'no more users', attribs: { class: 'endMessage-text' } }
        ] });
        this.userList = Element.new('div').setAttribute('class', 'users');
        this.component = Element.new('div').setAttribute('class', 'UserList');
        this.component.append(this.userList);//@ts-ignore
        window.a = this;
    }
    public useOnceEndDispatcher = Utilities.debounce((): void => {
        if (this.userElements.length === 0) return;
        const finalPostElement = this.userElements[this.userElements.length - 1];
        const endHandler = () => {
            this.dispatch('end');
        };
        finalPostElement.observer.offOnce('visible', endHandler);
        finalPostElement.observer.once('visible', endHandler);
    }, 1000);
    public async addUsers(users: Api.Users.visible[], checkToContinue: boolean = false): Promise<void> {
        this.users.push(...users);
        const childs = users.map(this.newUser.bind(this));
        this.userElements.push(...childs);
        if (!checkToContinue) {
            this.userList.append(...childs); return;
        } 
        await Promise.all(childs.map((child) => {
            return new Promise<void>((resolve) => {
                child.observer.on('add', () => resolve());
                this.userList.append(child);
            });
        }));
    }
    protected newUser(user: Api.Users.visible): Element<'div'> {
        let element = Element.structure({type: 'div', attribs: { class: 'user' }, childs: [
            { type: 'img', attribs: { class: 'avatar', src: user.profile.avatar ?? '/client/src/logo.svg' }},
            { type: 'div', attribs: { class: 'info', }, childs: [
                { type: 'h2', attribs: { class: 'name' },  text: user.profile.username },
                { type: 'span', attribs: {class: 'role' }, text: `role: ${user.profile.role ?? 'user'}` }
            ]}
        ] });
        element.on('click', () => {
            if (element === this.endMessage) return;
            this.dispatch('select', user);
        });
        return element;
    }
    /**
     * Show or hide the end message.
     * @param show If true, the end message will be shown.
     */
    public showEndMessage(show: boolean = true): void {
        if (show) this.endMessage.appendTo(this.userList);
        else this.endMessage.remove();
    }
    /**
     * Show or hide the loading message.
     * @param show If true, the loading message will be shown.
     */
    public showLoading(show: boolean = true): void {
        if (!show) return this.loading.finish();
        this.loading.spawn(this.userList)
    }
}

export namespace UserList {
    export type EventMap = {
        select: (user: Api.Users.visible) => void;
        end: () => void;
    }
}
export default UserList;