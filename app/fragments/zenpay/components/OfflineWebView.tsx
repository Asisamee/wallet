import React, { useState } from "react";
import { Platform } from "react-native";
import WebView, { WebViewProps } from "react-native-webview";
import * as FileSystem from 'expo-file-system';
import { useEngine } from "../../../engine/Engine";

export type AWebViewRef = {
    injectJavaScript: (script: string) => void;
    reload: () => void;
    goBack: () => void;
}

export const OfflineWebView = React.memo(React.forwardRef((
    props: Omit<WebViewProps, "source"> & { uri: string, initialRoute?: string },
    ref: React.ForwardedRef<AWebViewRef>
) => {
    const engine = useEngine();
    const tref = React.useRef<WebView>(null);
    React.useImperativeHandle(ref, () => ({
        injectJavaScript: (script: string) => {
            tref.current!.injectJavaScript(script);
        },
        reload: () => {
            tref.current!.reload();
        },
        goBack: () => {
            tref.current!.goBack();
        }
    }));

    const [renderedOnce, setRenderedOnce] = useState(false);

    const injectedJavaScriptBeforeContentLoaded = React.useMemo(() => {
        if (props.initialRoute) {
            return `
            window.initialRoute = '${props.initialRoute}';
            ${props.injectedJavaScriptBeforeContentLoaded ?? ''}
            `;
        }
        return props.injectedJavaScriptBeforeContentLoaded;
    }, []);

    console.log({ initialRoute: props.initialRoute });

    return (
        <>
            {Platform.OS === 'android' && (
                <WebView
                    ref={tref}
                    {...props}
                    source={renderedOnce ? { // some wierd android bug with file:// protocol
                        uri: props.uri,
                        baseUrl: `${FileSystem.cacheDirectory}holders/`,
                    } : undefined}
                    onLoad={(e) => {
                        setRenderedOnce(true);
                        if (props.onLoad) {
                            props.onLoad(e);
                        }
                    }}
                    allowFileAccess={true}
                    allowFileAccessFromFileURLs={true}
                    allowUniversalAccessFromFileURLs={true}
                    startInLoadingState={true}
                    originWhitelist={['*']}
                    allowingReadAccessToURL={FileSystem.cacheDirectory + 'holders/' ?? ''}
                    onShouldStartLoadWithRequest={(e) => {
                        if (props.onShouldStartLoadWithRequest && renderedOnce) {
                            return props.onShouldStartLoadWithRequest(e);
                        }
                        return true;
                    }}
                    injectedJavaScriptBeforeContentLoaded={injectedJavaScriptBeforeContentLoaded}
                />
            )}
            {Platform.OS === 'ios' && (
                <WebView
                    ref={tref}
                    {...props}
                    source={{
                        uri: props.uri,
                        baseUrl: `${FileSystem.cacheDirectory}holders/`,
                    }}
                    onLoad={(e) => {
                        setRenderedOnce(true);
                        if (props.onLoad) {
                            props.onLoad(e);
                        }
                    }}
                    allowFileAccess={true}
                    allowFileAccessFromFileURLs={true}
                    allowUniversalAccessFromFileURLs={true}
                    originWhitelist={['*']}
                    allowingReadAccessToURL={FileSystem.cacheDirectory + 'holders/' ?? ''}
                    onShouldStartLoadWithRequest={(e) => {
                        if (props.onShouldStartLoadWithRequest && renderedOnce) {
                            return props.onShouldStartLoadWithRequest(e);
                        }
                        return true;
                    }}
                    injectedJavaScriptBeforeContentLoaded={injectedJavaScriptBeforeContentLoaded}
                />
            )}
        </>
    );
}));