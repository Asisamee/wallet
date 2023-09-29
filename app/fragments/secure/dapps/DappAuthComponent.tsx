import { memo, useMemo } from "react";
import { AppManifest } from "../../../engine/api/fetchManifest";
import { ConnectRequest } from "@tonconnect/protocol";
import { ReturnStrategy } from "../../../engine/tonconnect/types";
import { AppData } from "../../../engine/api/fetchAppData";
import { Platform, View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppConfig } from "../../../utils/AppConfigContext";
import { RoundButton } from "../../../components/RoundButton";
import { t } from "../../../i18n/t";
import { WImage } from "../../../components/WImage";
import { getCurrentAddress } from "../../../storage/appState";
import { extractDomain } from "../../../engine/utils/extractDomain";
import { useImageColors } from "../../../utils/useImageColors";
import { AndroidImageColors, IOSImageColors } from "react-native-image-colors/build/types";

import TonhubLogo from '@assets/tonhub-logo.svg';
import IcConnectLine from '@assets/ic-connect-line.svg';
import { Canvas, ImageSVG, Skia } from "@shopify/react-native-skia";

export type TonConnectSignState =
    { type: 'loading' }
    | { type: 'expired', returnStrategy?: ReturnStrategy }
    | {
        type: 'initing',
        name: string,
        url: string,
        app: AppManifest,
        protocolVersion: number,
        request: ConnectRequest,
        clientSessionId?: string,
        returnStrategy?: ReturnStrategy
    }
    | { type: 'completed', returnStrategy?: ReturnStrategy }
    | { type: 'authorized', returnStrategy?: ReturnStrategy }
    | { type: 'failed', returnStrategy?: ReturnStrategy }

export type TonXSignState =
    { type: 'loading' }
    | { type: 'expired' }
    | { type: 'initing', name: string, url: string, app?: AppData | null }
    | { type: 'completed' }
    | { type: 'authorized' }
    | { type: 'failed' }


export type SignState =
    ({ connector: 'ton-connect' } & TonConnectSignState)
    | ({ connector: 'ton-x' } & TonXSignState);


export const DappAuthComponent = memo(({
    state,
    onApprove,
    onCancel,
}: {
    state: SignState,
    onApprove: () => Promise<void>,
    onCancel?: () => void,
}) => {
    const safeArea = useSafeAreaInsets();
    const { Theme, AppConfig } = useAppConfig();

    const addressString = useMemo(() => {
        const address = getCurrentAddress().address;
        const friendly = address?.toFriendly({ testOnly: AppConfig.isTestnet });
        if (!friendly) {
            return '';
        }
        return `${friendly.slice(0, 4)}...${friendly?.slice(-4)}`;
    }, []);

    const name = useMemo(() => {
        if (state.type !== 'initing') {
            return ''
        }
        if (state.connector === 'ton-connect') {
            return state.app ? state.app.name : state.name;
        }
        return state.app ? state.app.title : state.name;
    }, [state]);

    const iconUrl = useMemo(() => {
        if (state.type === 'initing') {
            return state.connector === 'ton-connect' ? state.app?.iconUrl : state.app?.image?.preview256;
        }
        return undefined;
    }, [state]);

    const domain = useMemo(() => {
        if (state.type !== 'initing') {
            return '';
        }
        try {
            return extractDomain(state.app ? state.app.url : state.url);
        } catch {
            return '';
        }
    }, [state]);

    const dAppIconColors = useImageColors(iconUrl);
    const primaryIconColor = useMemo(() => {
        if (!dAppIconColors) {
            return '#3CADF5';
        }

        return Platform.select({
            android: (dAppIconColors as AndroidImageColors).dominant,
            ios: (dAppIconColors as IOSImageColors).primary,
        }) || '#3CADF5';
    }, [dAppIconColors]);

    const connectLineSvg = useMemo(() => {
        return Skia.SVG.MakeFromString(
            `<svg xmlns="http://www.w3.org/2000/svg" width="79" height="51" viewBox="0 0 79 51" fill="none">
            <path d="M16.8405 23.9492C16.8405 23.9492 16.9389 26.6872 15.0678 28.1756C13.1967 29.6641 11.3008 29.6641 11.3008 29.6641M27.9199 44.4336V37.0488V25.5M38.9994 44.4336V31.5" stroke="${primaryIconColor}" stroke-width="4" stroke-linecap="round"/>
            <path d="M61.1595 33.6797V27.5195C61.1595 27.5195 61.0611 24.7815 62.9322 23.2931C64.8033 21.8047 66.6992 21.8047 66.6992 21.8047M50.0801 11.9688V26.9688M39.0006 7.96875V15.3215V16.9688" stroke="url(#paint0_linear_11710_129036)" stroke-width="4" stroke-linecap="round"/>
            <defs>
              <linearGradient id="paint0_linear_11710_129036" x1="40.8466" y1="30.9336" x2="80.2159" y2="30.9336" gradientUnits="userSpaceOnUse">
                <stop stop-color="${primaryIconColor}"/>
                <stop offset="0.497277" stop-color="#6E49FD"/>
              </linearGradient>
            </defs>
          </svg>`
        )!;
    }, [primaryIconColor]);

    const title = useMemo(() => {
        switch (state.type) {
            case 'loading':
                return '...';
            case 'expired':
                return t('auth.expired');
            case 'initing':
                return t('auth.title', { name: name });
            case 'completed':
                return t('auth.completed');
            case 'authorized':
                return t('auth.authorized');
            case 'failed':
                return t('auth.failed');
        }
    }, [state, name]);

    const description = useMemo(() => {
        if (state.type === 'initing') {
            return (
                <>
                    <Text style={{ color: Theme.accent }}>
                        {domain + ' '}
                    </Text>
                    {t('auth.message', { wallet: addressString })}
                </>
            )
        }
    }, [state, domain, addressString]);

    return (
        <View style={{ flexGrow: 1, paddingBottom: safeArea.bottom }}>
            <View style={{ flexGrow: 1 }} />
            <View style={{
                flexShrink: Platform.OS === 'ios' ? 1 : undefined,
                flexGrow: Platform.OS === 'ios' ? 0 : 1,
                backgroundColor: Theme.background,
                borderTopEndRadius: Platform.OS === 'android' ? 0 : 20,
                borderTopStartRadius: Platform.OS === 'android' ? 0 : 20,
                padding: 16,
                paddingBottom: safeArea.bottom + 16
            }}>
                <View>
                    <View style={{
                        borderRadius: 20,
                        backgroundColor: Theme.surfaceSecondary,
                        width: '100%',
                        paddingVertical: 44,
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexDirection: 'row',
                        marginBottom: 32
                    }}>
                        <WImage
                            heigh={72}
                            width={72}
                            style={{}}
                            src={iconUrl}
                            borderRadius={16}
                        />
                        <View style={{ width: 80, height: 50 }}>
                            <IcConnectLine
                                height={50}
                                width={80}
                                style={{ width: 80, height: 50 }}
                            />
                            <Canvas style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                                <ImageSVG
                                    svg={connectLineSvg}
                                    x={0}
                                    y={0}
                                    width={80}
                                    height={50}
                                />
                            </Canvas>
                        </View>
                        <TonhubLogo
                            height={72}
                            width={72}
                            style={{ height: 72, width: 72 }}
                        />
                    </View>
                    {state.type === 'loading' ? (
                        <>
                            <View style={{
                                width: 120, height: 34,
                                marginBottom: 12,
                                backgroundColor: Theme.textSecondary,
                                borderRadius: 12, opacity: 0.7
                            }} />
                            <View style={{
                                width: '100%', height: 24,
                                backgroundColor: Theme.textSecondary,
                                borderTopLeftRadius: 12,
                                borderTopRightRadius: 12,
                                borderBottomRightRadius: 12,
                                opacity: 0.7
                            }} />
                            <View style={{
                                width: 120, height: 24,
                                marginBottom: 36,
                                backgroundColor: Theme.textSecondary,
                                borderBottomLeftRadius: 12,
                                borderBottomRightRadius: 12,
                                opacity: 0.7
                            }} />
                        </>
                    ) : (
                        <>
                            <Text
                                style={{
                                    fontSize: 32,
                                    fontWeight: '600',
                                    marginBottom: 12,
                                    color: Theme.textPrimary
                                }}
                            >
                                {title}
                            </Text>
                            <Text
                                style={{
                                    fontSize: 17,
                                    fontWeight: '500',
                                    marginBottom: 36,
                                    color: Theme.textSecondary
                                }}
                            >
                                {description}
                            </Text>
                        </>
                    )}
                    <RoundButton
                        style={{ marginBottom: 16 }}
                        title={t('common.connect')}
                        disabled={!onApprove || state.type !== 'initing'}
                        action={onApprove}
                        loading={state.type === 'loading'}
                    />
                    <RoundButton
                        style={{ marginBottom: 16 }}
                        display={'secondary'}
                        disabled={!onCancel}
                        title={t('common.cancel')}
                        onPress={onCancel}
                    />
                </View>
            </View>
        </View>
    );
});