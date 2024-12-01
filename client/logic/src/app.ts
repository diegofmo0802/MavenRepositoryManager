import Loading from "./components/basic.components/Loading.js";
import App from "./WebApp/WebApp.js";
import Session from "./components/Session.js";

export const app = App.getInstance('#app');
export const loading = new Loading('/client/src/logo.svg');
export const session = new Session();

/* app.registerWorker('/worker.js', {
    type: 'module',
    scope: '/'
}); */

export default app;