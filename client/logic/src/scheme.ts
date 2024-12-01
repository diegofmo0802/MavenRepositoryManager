import { Element } from "./WebApp/WebApp.js";
import { Button, Logo } from "./components/basic.components.js";
import app from "./app.js";

const menuOptions = Element.structure({
    type: 'div', attribs: { id: 'menuOptions' }, childs: [
        Button('Home').on('click', () => app.router.setPage('/'))
    ]
})


const session = Element.structure({
    type: 'div', attribs: { id: 'session' }
})

const menu = Element.structure({
    type: 'div', attribs: { id: 'menu' }, childs: [
        Logo('/client/src/logo.svg', 'Sky Gallery', '/'),
        menuOptions, session
    ]
});

const content = Element.new('div').setAttribute('id', 'content');

export const rootScheme = [ menu, content ];

export const components = {
    'menu': menu,
    'content': content,
    'menu.options': menuOptions,
    'session': session
}

export default rootScheme