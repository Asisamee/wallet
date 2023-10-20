import * as React from 'react';
import { ActivityIndicator, Linking, NativeSyntheticEvent, Platform, Share, View } from 'react-native';
import WebView from 'react-native-webview';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DomainSubkey } from '../../../engine/legacy/products/ExtensionsProduct';
import { ShouldStartLoadRequest, WebViewMessageEvent } from 'react-native-webview/lib/WebViewTypes';
import { extractDomain } from '../../../engine/utils/extractDomain';
import { resolveUrl } from '../../../utils/resolveUrl';
import { useLinkNavigator } from "../../../useLinkNavigator";
import { warn } from '../../../utils/log';
import { createInjectSource, dispatchResponse } from './inject/createInjectSource';
import { useInjectEngine } from './inject/useInjectEngine';
import { contractFromPublicKey, walletConfigFromContract } from '../../../engine/contractFromPublicKey';
import { protectNavigation } from './protect/protectNavigation';
import { RoundButton } from '../../../components/RoundButton';
import { t } from '../../../i18n/t';
import MoreIcon from '../../../../assets/ic_more.svg';
import { generateAppLink } from '../../../utils/generateAppLink';
import { MixpanelEvent, trackEvent, useTrackEvent } from '../../../analytics/mixpanel';
import { useTypedNavigation } from '../../../utils/useTypedNavigation';
import ContextMenu, { ContextMenuOnPressNativeEvent } from 'react-native-context-menu-view';
import { useTheme } from '../../../engine/hooks/useTheme';
import { useNetwork } from '../../../engine/hooks/useNetwork';
import { getCurrentAddress } from '../../../storage/appState';
import { ConfigStore } from '../../../utils/ConfigStore';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { useDomainKey } from '../../../engine/hooks/dapps/useDomainKey';
import { createDomainSignature } from '../../../engine/utils/createDomainSignature';

export const AppComponent = memo((props: {
    endpoint: string,
    color: string,
    dark: boolean,
    foreground: string,
    title: string,
    domainKey: DomainSubkey
}) => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const domain = useMemo(() => extractDomain(props.endpoint), []);

    const domainKey = useDomainKey(domain);
    //
    // Track events
    //
    const navigation = useTypedNavigation();
    const start = useMemo(() => {
        return Date.now();
    }, []);
    const close = useCallback(() => {
        navigation.goBack();
        trackEvent(MixpanelEvent.AppClose, { url: props.endpoint, domain, duration: Date.now() - start, protocol: 'ton-x' }, isTestnet);
    }, []);
    useTrackEvent(MixpanelEvent.AppOpen, { url: props.endpoint, domain, protocol: 'ton-x' }, isTestnet);

    // 
    // Actions menu
    // 

    const onShare = useCallback(() => {
        const link = generateAppLink(props.endpoint, props.title, isTestnet);
        if (Platform.OS === 'ios') {
            Share.share({ title: t('receive.share.title'), url: link });
        } else {
            Share.share({ title: t('receive.share.title'), message: link });
        }
    }, [props]);

    const onReview = useCallback(() => {
        navigation.navigateReview({ type: 'review', url: props.endpoint });
    }, [props]);

    const onReport = useCallback(() => {
        navigation.navigateReview({ type: 'report', url: props.endpoint });
    }, [props]);

    //
    // View
    //

    const safeArea = useSafeAreaInsets();
    let [loaded, setLoaded] = useState(false);
    const webRef = useRef<WebView>(null);
    const opacity = useSharedValue(1);
    const animatedStyles = useAnimatedStyle(() => {
        return {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: props.color,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: withTiming(opacity.value, { duration: 300 }),
        };
    });

    //
    // Navigation
    //

    const linkNavigator = useLinkNavigator(isTestnet);
    const loadWithRequest = useCallback((event: ShouldStartLoadRequest): boolean => {
        if (extractDomain(event.url) === extractDomain(props.endpoint)) {
            return true;
        }

        // Resolve internal url
        const resolved = resolveUrl(event.url, isTestnet);
        if (resolved) {
            linkNavigator(resolved);
            return false;
        }

        // Secondary protection
        let prt = protectNavigation(event.url, props.endpoint);
        if (prt) {
            return true;
        }

        // Resolve linking
        Linking.openURL(event.url);
        return false;
    }, []);

    //
    // Injection
    //

    const injectSource = useMemo(() => {
        const currentAccount = getCurrentAddress();
        const contract = contractFromPublicKey(currentAccount.publicKey);
        const config = walletConfigFromContract(contract);

        const walletConfig = config.walletConfig;
        const walletType = config.type;

        if (!domainKey) {
            return '';
        }

        let domainSign = createDomainSignature(domain, domainKey);

        return createInjectSource({
            version: 1,
            platform: Platform.OS,
            platformVersion: Platform.Version,
            network: isTestnet ? 'testnet' : 'mainnet',
            address: currentAccount.address.toString({ testOnly: isTestnet }),
            publicKey: currentAccount.publicKey.toString('base64'),
            walletConfig,
            walletType,
            signature: domainSign.signature,
            time: domainSign.time,
            subkey: {
                domain: domainSign.subkey.domain,
                publicKey: domainSign.subkey.publicKey,
                time: domainSign.subkey.time,
                signature: domainSign.subkey.signature
            }
        });
    }, [domainKey]);
    const injectionEngine = useInjectEngine(domain, props.title, isTestnet);
    const handleWebViewMessage = useCallback((event: WebViewMessageEvent) => {
        const nativeEvent = event.nativeEvent;

        // Resolve parameters
        let data: any;
        let id: number;
        try {
            let parsed = JSON.parse(nativeEvent.data);
            if (typeof parsed.id !== 'number') {
                warn('Invalid operation id');
                return;
            }
            id = parsed.id;
            data = parsed.data;
        } catch (e) {
            warn(e);
            return;
        }

        // Execute
        (async () => {
            let res = { type: 'error', message: 'Unknown error' };
            try {
                res = await injectionEngine.execute(data);
            } catch (e) {
                warn(e);
            }
            dispatchResponse(webRef, { id, data: res });
        })();

    }, []);

    const handleAction = useCallback((e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>) => {
        if (e.nativeEvent.name === t('common.share')) onShare();
        if (e.nativeEvent.name === t('review.title')) onReview();
        if (e.nativeEvent.name === t('report.title')) onReport();
    }, [onShare, onReview, onReport]);

    return (
        <>
            <View style={{ backgroundColor: props.color, flexGrow: 1, flexBasis: 0, alignSelf: 'stretch' }}>
                <View style={{ height: safeArea.top }} />
                <WebView
                    ref={webRef}
                    source={{ uri: props.endpoint }}
                    startInLoadingState={true}
                    style={{ backgroundColor: props.color, flexGrow: 1, flexBasis: 0, alignSelf: 'stretch' }}
                    onLoadEnd={() => {
                        setLoaded(true);
                        opacity.value = 0;
                    }}
                    contentInset={{ top: 0, bottom: 0 }}
                    autoManageStatusBarEnabled={false}
                    allowFileAccessFromFileURLs={false}
                    allowUniversalAccessFromFileURLs={false}
                    decelerationRate="normal"
                    allowsInlineMediaPlayback={true}
                    injectedJavaScriptBeforeContentLoaded={injectSource}
                    onShouldStartLoadWithRequest={loadWithRequest}
                    onMessage={handleWebViewMessage}
                />

                <Animated.View
                    style={animatedStyles}
                    pointerEvents={loaded ? 'none' : 'box-none'}
                >
                    <ActivityIndicator size="large" color={props.foreground} />
                </Animated.View>

            </View>
            <View style={{ flexDirection: 'row', height: 50 + safeArea.bottom, alignItems: 'center', justifyContent: 'center', paddingBottom: safeArea.bottom, backgroundColor: props.color }}>
                <RoundButton
                    title={t('common.close')}
                    display="secondary"
                    size="normal"
                    style={{ paddingHorizontal: 8 }}
                    onPress={close}
                />
                <ContextMenu
                    style={{
                        position: 'absolute',
                        top: 8, right: 16,
                        height: 32
                    }}
                    dropdownMenuMode
                    onPress={handleAction}
                    actions={[
                        { title: t('report.title'), systemIcon: Platform.OS === 'ios' ? 'exclamationmark.triangle' : undefined, destructive: true },
                        { title: t('review.title'), systemIcon: Platform.OS === 'ios' ? 'star' : undefined },
                        { title: t('common.share'), systemIcon: Platform.OS === 'ios' ? 'square.and.arrow.up' : undefined },
                    ]}
                >
                    <MoreIcon color={'black'} height={30} width={30} />
                </ContextMenu>
                <View style={{
                    position: 'absolute',
                    top: 0.5, left: 0, right: 0,
                    height: 0.5,
                    width: '100%',
                    backgroundColor: theme.headerDivider,
                    opacity: 0.08
                }} />
            </View>
        </>
    );
});