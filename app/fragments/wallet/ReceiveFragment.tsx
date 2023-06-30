import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { getCurrentAddress } from "../../storage/appState";
import { View, Platform, Text, Pressable, Share, LayoutAnimation } from "react-native";
import { t } from "../../i18n/t";
import { QRCode } from "../../components/QRCode/QRCode";
import { useParams } from "../../utils/useParams";
import { CopyButton } from "../../components/CopyButton";
import { ShareButton } from "../../components/ShareButton";
import { JettonMasterState } from "../../engine/sync/startJettonMasterSync";
import { Address } from "ton";
import { useEngine } from "../../engine/Engine";
import { WImage } from "../../components/WImage";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useAppConfig } from "../../utils/AppConfigContext";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useImage } from "@shopify/react-native-skia";
import { getMostPrevalentColorFromBytes } from "../../utils/image/getMostPrevalentColorFromBytes";
import { KnownJettonMasters } from "../../secure/KnownWallets";

import Verified from '../../../assets/ic-verified.svg';
import TonIcon from '../../../assets/ic_ton_account.svg';
import Chevron from '../../../assets/ic_chevron_forward.svg';

export const ReceiveFragment = fragment(() => {
    const { Theme, AppConfig } = useAppConfig();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const params = useParams<{ addr?: string, ledger?: boolean }>();
    const address = React.useMemo(() => {
        if (params.addr) {
            return Address.parse(params.addr);
        }
        return getCurrentAddress().address;
    }, [params]);
    const friendly = address.toFriendly({ testOnly: AppConfig.isTestnet });
    const [jetton, setJetton] = useState<{ master: Address, data: JettonMasterState } | null>(null);

    const isVerified = useMemo(() => {
        if (!jetton) {
            return true;
        }
        return !!KnownJettonMasters(AppConfig.isTestnet)[jetton?.master.toFriendly({ testOnly: AppConfig.isTestnet })];
    }, [jetton]);

    const onAssetSelected = useCallback((address?: Address) => {
        if (address) {
            const data = engine.persistence.jettonMasters.item(address).value;
            if (data) {
                setJetton({ master: address, data });
                return;
            }
        }
        setJetton(null);
    }, []);

    const link = useMemo(() => {
        if (jetton) {
            return `https://${AppConfig.isTestnet ? 'test.' : ''}tonhub.com/transfer`
                + `/${address.toFriendly({ testOnly: AppConfig.isTestnet })}`
                + `?jetton=${jetton.master.toFriendly({ testOnly: AppConfig.isTestnet })}`
        }
        return `https://${AppConfig.isTestnet ? 'test.' : ''}tonhub.com/transfer`
            + `/${address.toFriendly({ testOnly: AppConfig.isTestnet })}`
    }, [jetton]);

    const [mainColor, setMainColor] = useState('#0088CC');
    const isDark = useMemo(() => {
        if (mainColor === '#0088CC') {
            return true;
        }
        const [r, g, b] = mainColor.match(/\d+/g)?.map(Number) ?? [0, 0, 0];
        const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        return luminance < 0.7;
    }, [mainColor]);

    const image = useImage(jetton?.data?.image?.preview256);
    useEffect(() => {
        if (image) {
            const bytes = image.encodeToBytes();
            const color = getMostPrevalentColorFromBytes(bytes);
            setMainColor(color);
            return;
        }
        setMainColor('#0088CC');
    }, [image]);

    useLayoutEffect(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }, [mainColor]);

    return (
        <View style={{
            alignSelf: 'stretch', flexGrow: 1,
            justifyContent: 'space-between', alignItems: 'center',
            backgroundColor: mainColor,
        }}>
            <ScreenHeader
                title={t('receive.title')}
                onClosePressed={navigation.goBack}
                textColor={isDark ? '#fff' : '#000'}
                tintColor={isDark ? '#fff' : '#000'}
            />
            <View style={{ paddingHorizontal: 40, width: '100%' }}>
                <View style={{
                    justifyContent: 'center',
                    backgroundColor: Theme.item,
                    borderRadius: 20,
                    minHeight: 358,
                    padding: 32,
                    paddingTop: 52,
                    marginBottom: 16
                }}>
                    <View style={{
                        height: 62, width: 62, borderRadius: 32,
                        position: 'absolute', top: -28,
                        alignSelf: 'center',
                        backgroundColor: Theme.item,
                        justifyContent: 'center', alignItems: 'center',
                    }}>
                        <View style={{ backgroundColor: Theme.accent, height: 58, width: 58, borderRadius: 30 }}>

                        </View>
                    </View>
                    <View style={{ height: Platform.OS === 'ios' ? 260 : 240, justifyContent: 'center', alignItems: 'center' }}>
                        <QRCode
                            data={link}
                            size={Platform.OS === 'ios' ? 260 : 240}
                            icon={jetton?.data.image}
                            color={mainColor}
                        />
                    </View>
                </View>
                <View style={{ backgroundColor: Theme.item, borderRadius: 20, padding: 20 }}>
                    <Pressable
                        style={({ pressed }) => {
                            return {
                                opacity: pressed ? 0.3 : 1,
                            }
                        }}
                        onPress={() => {
                            if (params.ledger) {
                                navigation.navigate('LedgerAssets', { callback: onAssetSelected });
                                return;
                            }
                            navigation.navigate('Assets', { callback: onAssetSelected });
                        }}
                    >
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <View style={{
                                flexDirection: 'row',
                            }}>
                                <View style={{ height: 46, width: 46, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                    {!!jetton && (
                                        <WImage
                                            src={jetton.data.image?.preview256}
                                            blurhash={jetton.data.image?.blurhash}
                                            width={46}
                                            heigh={46}
                                            borderRadius={23}
                                            lockLoading
                                        />
                                    )}
                                    {!jetton && (
                                        <TonIcon width={46} height={46} />
                                    )}
                                    {isVerified && (
                                        <Verified
                                            height={16} width={16}
                                            style={{
                                                height: 16, width: 16,
                                                position: 'absolute', right: -2, bottom: -2,
                                            }}
                                        />
                                    )}
                                </View>
                                <View style={{ justifyContent: 'space-between' }}>
                                    <Text style={{
                                        fontSize: 17,
                                        color: Theme.textColor,
                                        fontWeight: '600',
                                        lineHeight: 24
                                    }}>
                                        {`${jetton?.data.symbol ?? `TON ${t('common.wallet')}`}`}
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 15,
                                            fontWeight: '400',
                                            lineHeight: 20,
                                            color: Theme.price,
                                        }}
                                        selectable={false}
                                        ellipsizeMode={'middle'}
                                    >
                                        {
                                            friendly.slice(0, 6)
                                            + '...'
                                            + friendly.slice(friendly.length - 6)
                                        }
                                    </Text>
                                </View>
                            </View>
                            <Chevron style={{ height: 16, width: 16 }} height={16} width={16} />
                        </View>
                    </Pressable>
                </View>
            </View>
            <View style={{ flexGrow: 1 }} />
            <View style={{
                width: '100%',
                flexDirection: 'row',
                justifyContent: 'space-evenly',
                paddingBottom: 16 + safeArea.bottom,
                paddingTop: 20,
                paddingHorizontal: 16,
                backgroundColor: Theme.item,
                borderTopEndRadius: 20,
                borderTopStartRadius: 20,
            }}>
                <CopyButton
                    style={{ marginRight: 8, backgroundColor: isDark ? '#F7F8F9' : '#808080', borderWidth: 0 }}
                    body={link}
                    textStyle={{ color: mainColor, fontSize: 17, fontWeight: '600', lineHeight: 24 }}
                />
                <ShareButton
                    style={{ marginRight: 8, backgroundColor: isDark ? '#F7F8F9' : '#808080', borderWidth: 0 }}
                    body={link}
                    textStyle={{ color: mainColor, fontSize: 17, fontWeight: '600', lineHeight: 24 }}
                />
            </View>
        </View>
    );
});