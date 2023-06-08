import WebView from "react-native-webview";

const mainButtonAPI = `
window['main-button'] = (() => {
    let requestId = 0;
    let callbacks = {};

    const setText = (text) => {
        window.ReactNativeWebView.postMessage(JSON.stringify({ data: { name: 'main-button.setText', args: { text } } }));
    };

    const onClick = (callback) => {
        let id = requestId++;
        window.ReactNativeWebView.postMessage(JSON.stringify({ id, data: { name: 'main-button.onClick' } }));
        callbacks[id] = callback;
    };

    const showProgress = (leaveActive) => {
        window.ReactNativeWebView.postMessage(JSON.stringify({ data: { name: 'main-button.showProgress', args: { leaveActive } } }));
    };

    const hideProgress = () => {
        window.ReactNativeWebView.postMessage(JSON.stringify({ data: { name: 'main-button.hideProgress' } }));
    };

    const show = () => {
        window.ReactNativeWebView.postMessage(JSON.stringify({ data: { name: 'main-button.show' } }));
    };

    const hide = () => {
        window.ReactNativeWebView.postMessage(JSON.stringify({ data: { name: 'main-button.hide' } }));
    };

    const enable = () => {
        window.ReactNativeWebView.postMessage(JSON.stringify({ data: { name: 'main-button.enable' } }));
    };

    const disable = () => {
        window.ReactNativeWebView.postMessage(JSON.stringify({ data: { name: 'main-button.disable' } }));
    };

    const setParams = (params) => {
        window.ReactNativeWebView.postMessage(JSON.stringify({ data: { name: 'main-button.setParams', args: params } }));
    };

    const __response = (ev) => {
        if (ev && typeof ev.id === 'number' && ev.data && callbacks[ev.id]) {
            let c = callbacks[ev.id];
            delete callbacks[ev.id];
            c(ev.data);
        }
    }

    const obj = { setText, onClick, showProgress, hideProgress, show, hide, enable, disable, setParams, __response };
    Object.freeze(obj);
    return obj;
})();
`

export function createInjectSource(config: any, additionalInjections?: string, useMainButtonAPI?: boolean) {
    return `
    ${additionalInjections || ''}
    ${useMainButtonAPI ? mainButtonAPI : ''}
    window['ton-x'] = (() => {
        let requestId = 0;
        let callbacks = {};
        let config = ${JSON.stringify(config)};
        let __IS_TON_X = true;
    
        const call = (name, args, callback) => {
            let id = requestId++;
            window.ReactNativeWebView.postMessage(JSON.stringify({ id, data: { name, args } }));
            callbacks[id] = callback;
        };

        const __response = (ev) => {
            if (ev && typeof ev.id === 'number' && ev.data && callbacks[ev.id]) {
                let c = callbacks[ev.id];
                delete callbacks[ev.id];
                c(ev.data);
            }
        }
        
        const obj = { call, config, __IS_TON_X, __response };
        Object.freeze(obj);
        return obj;
    })();
    true;
    `;
};

export function dispatchMainButtonResponse(webRef: React.RefObject<WebView>, data: any) {
    let injectedMessage = `window['main-button'].__response(${JSON.stringify(data)}); true;`;
    webRef.current?.injectJavaScript(injectedMessage);
}

export function dispatchResponse(webRef: React.RefObject<WebView>, data: any) {
    let injectedMessage = `window['ton-x'].__response(${JSON.stringify(data)}); true;`;
    webRef.current?.injectJavaScript(injectedMessage);
}