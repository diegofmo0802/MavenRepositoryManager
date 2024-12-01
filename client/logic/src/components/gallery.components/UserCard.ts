import Api from "../../Api/Api.js";
import { Component, Element } from "../../WebApp/WebApp.js";

export class UserCard extends Component<'div'> {
    protected component: Element<"div">;
    protected currentNotice: number | null = null;
    protected notice: Element<'p'>;
    constructor(
        public readonly user: Api.Users.visible,
        options: UserCard.options = {}
    ) { super();
        const cardUrl = `/api/users/${user._id}/card`;
        const url = `https://sky.mysaml.com/app/profile/${user._id}`;

        const componentClass = 'UserCard' + (options.class ? ` ${options.class}` : '');
        const id = options.id;
        
        const card = Element.new('img').setAttributes({ class: 'UserCard-Card', src: cardUrl });
        this.notice = Element.new('p', ':p').setAttributes({ class: 'UserCard-Notice', show: 'false' });

        const downloadButton = Element.new('button', 'Download').setAttribute('class', 'Button UserCard-Download');
        const copyButton = Element.new('button', 'Copy URL').setAttribute('class', 'Button UserCard-Copy');

        this.component = Element.new('div', null, { class: componentClass });
        if (id) this.component.setAttribute('id', id);

        this.component.append(
            card, this.notice,
            { type: 'div', attribs: { class: 'UserCard-Buttons' }, childs: [
                downloadButton, copyButton
            ] }
        );

        downloadButton.addEventListener('click', async () => {
            try {
                const url = card.getAttribute('src');
                if (url == null) return this.showNotify('Error downloading card');

                const link = Element.new('a');
                const canvas = Element.new('canvas');
                const ctx = canvas.HTMLElement.getContext('2d');
                if (ctx == null) return this.showNotify('Error downloading card');

                this.showNotify('Downloading card...', null);
                const response = await fetch(url);
                const blob = await response.blob();
                const type = blob.type;
                const content = await blob.text();

                const img = new Image();
                img.src = `data:${type};utf8,${encodeURIComponent(content)}`;
                await img.decode();
                canvas.HTMLElement.width = img.width;
                canvas.HTMLElement.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                console.log(url);

                const dataURL = canvas.HTMLElement.toDataURL('image/png');
                link.setAttribute('href', dataURL);
                link.setAttribute('download', `${this.user.profile.username}-card.png`);
                link.HTMLElement.click();

                this.showNotify('Card downloaded');
            } catch(error) {
                console.log(error);
                this.showNotify('Error downloading card');
            }
        });
        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(url);
            this.showNotify('URL copied');
        });
    }
    public showNotify(text: string, time: number | null = 2000) {
        this.notice.setAttribute('show', 'true');
        this.notice.text(text);
        if (!time) return;
        if (this.currentNotice) window.clearTimeout(this.currentNotice);
        this.currentNotice = window.setTimeout(() => {
            this.notice.setAttribute('show', 'false');
            this.currentNotice = null;
        }, time);
    }
}
export namespace UserCard {
    export interface options {
        class?: string;
        id?: string;
    }
}
export default UserCard;