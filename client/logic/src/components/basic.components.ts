import Api from "../Api/Api.js";
import { Element } from "../WebApp/WebApp.js";
import app from "../app.js";

export function Button(showText: string) {
    return Element.structure({
        type: 'button', attribs: { class: 'Button'}, text: showText
    });
}

export function ErrorPage(code: number | string, message: string, description?: string) {
    return Element.new('div').setAttribute('class', 'ErrorView').append(
        Element.new('h2').append(
            Element.new('p').text(code + ''),
            Element.new('p').text(message)
        ),
        Element.new('p').text(description ?? '')
    );
}

export function Logo(icon: string, text: string, url: string) {
    const events = { click: () => app.router.setPage(url) }
    return Element.structure({
        type: 'div', attribs: { class: 'Logo' }, childs: [
            { type: 'img', attribs: { src: icon }, events },
            { type: 'p', text, events },
        ]
    });
}