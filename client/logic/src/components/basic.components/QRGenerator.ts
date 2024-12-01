import { Element, Component } from '../../WebApp/WebApp.js';
import QR, { Drawer } from "../../QR-Code/QR.js";
import Style from 'QR-Code/Style.js';

export class QRGenerator extends Component<'div'> {
    protected component: Element<'div'>;
    protected Error: Element<'p'>;
    protected Viewer: Element<'img'>;
    protected showing: Promise<any> | null = null;
    public constructor(options: QRGenerator.options = {}) { super();
        const componentClass = 'QRGenerator' + (options.class ? ` ${options.class}` : '');
        const id = options.id;
        const downloadButton = Element.new('button', 'Download').setAttribute('class', 'Button QRGenerator-Download');

        this.Error = Element.new('p').setAttribute('class', 'QRGenerator-Error');
        this.Viewer = Element.new('img').setAttribute('class', 'QRGenerator-Viewer');
        this.component = Element.new('div').setAttribute('class', componentClass);

        downloadButton.addEventListener('click', async () => {
            const url = this.Viewer.getAttribute('src');
            if (url == null) return;
            const link = Element.new('a');
            link.setAttribute('download', 'QR.png');
            link.setAttribute('href', url);
            link.HTMLElement.click();
        });

        if (id) this.component.setAttribute('id', id);
        this.component.append(this.Viewer, this.Error, downloadButton);
    }
    public async generate(data: string, options: QRGenerator.generateOptions = {}): Promise<void> {
        const { correctionLevel = 'L', style = {} } = options;
        const eccLevel = QR.isSupportedEccLevel(correctionLevel) ? correctionLevel : 'L';
        const qr = new QR(data, {
            eccLevel: eccLevel
        });
        const drawer = qr.imageDrawer;
        if (drawer == null) {
            const errorMessage = 'Posible browser incompatible with Canvas API';
            this.Error.text(errorMessage);
            throw new Error(errorMessage);
        }
        await this.show(drawer, style);
    }
    protected async show(drawer: Drawer, style: QRGenerator.customizeOptions = {}): Promise<void> {
        if (this.showing) await this.showing;
        this.showing = this.loadQrImage(drawer, style);
        await this.showing;
        this.showing = null;
    }
    protected async loadQrImage(drawer: Drawer, style: QRGenerator.customizeOptions = {}) {
        const { activeModule = null, inactiveModule = null, moduleMargin = null, moduleRadius = null, background = null, icon = null, size = null } = style;
        const styleManager = drawer.style;
        if (moduleMargin) styleManager.moduleMargin = moduleMargin;
        if (moduleRadius) styleManager.moduleRadius = moduleRadius;
        if (background) styleManager.background = background;
        if (activeModule) styleManager.activeColor = activeModule;
        if (inactiveModule) styleManager.inactiveColor = inactiveModule;
        if (icon) await drawer.addImage(icon);
        const DataUrl = await drawer.dataUrl(style.size);
        this.Viewer.setAttribute('src', DataUrl);
    }
    public remove(): void {
        this.component.remove();
    }
}
export namespace QRGenerator {
    export interface options {
        class?: string;
        id?: string;
    }
    export interface generateOptions {
        correctionLevel?: string;
        style?: customizeOptions;
    }
    export interface customizeOptions {
        moduleMargin?: Style.SizeValue;
        moduleRadius?: Style.SizeValue;
        background?: Style.ColorValue | Style.gradient;
        activeModule?: Style.ColorValue | Style.gradient;
        inactiveModule?: Style.ColorValue | Style.gradient;
        size?: number;
        icon?: string;
    }
}
export default QRGenerator;