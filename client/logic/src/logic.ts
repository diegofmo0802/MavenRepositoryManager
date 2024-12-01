import { app, loading, session } from './app.js';
import { rootScheme, components } from './scheme.js';
import { renderSession } from './Renders/Session.js';
import * as forms from './Renders/Form.js';
import Api from './Api/Api.js';
import { renderError } from './Renders/Basic.js';
//@ts-ignore
window.api = Api; window.app = app;

app.renderRoot(...rootScheme);
app.setComponents(components);

loading.spawn(app.root, 0, true);


app.addRender('/', () => renderError('404', 'No home router yet'));
app.addRender('/app/login', forms.renderLoginForm);
app.addRender('/app/register', forms.renderRegisterForm);
app.addRender('/app/new-version', forms.renderNewVersionForm);


session.on('login', () =>  app.router.setPage('/app/login'));
session.on('register', () => app.router.setPage('/app/register'));
session.on('option', async (option) => { switch(option) {
    case 'newPost': app.router.setPage('/app/new-version'); break;
    case 'profile': app.router.setPage('/app/profile'); break;
    case 'logout': {
        loading.spawn(app.getComponent('session').getElement());
        try {
            await Api.Auth.logout();
            console.log('[Auth]: logout');
            session.close();
            app.router.setPage('/');
        } catch(error) {
            renderError(500, error instanceof globalThis.Error ? error.message : 'Internal Error');
        } finally { loading.finish(); }
        break;
    }
}});

await renderSession();
app.init();
loading.finish(2000);