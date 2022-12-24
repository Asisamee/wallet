import React, { useState } from "react";
import { View, Text, Image } from "react-native";
import { TonTransport } from "ton-ledger";
import TransportHID from "@ledgerhq/react-native-hid";
import { RoundButton } from "../../../components/RoundButton";
import { t } from "../../../i18n/t";
import { Theme } from "../../../Theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { LedgerSelectAccount } from "./LedgerSelectAccount";

export const LedgerHID = React.memo(() => {
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();

    const [started, setStarted] = React.useState(false);
    const [account, setAccount] = React.useState<number | null>(null);
    const [screen, setScreen] = useState<'select-account' | 'load-address' | null>(null);
    const [device, setDevice] = React.useState<TonTransport | null>(null);

    let reset = React.useCallback(() => {
        setDevice(null);
        setAccount(null);
    }, []);

    const doStart = React.useMemo(() => {
        let started = false;
        return () => {
            if (started) {
                return;
            }
            started = true;
            setStarted(true);

            // Start
            (async () => {
                try {
                    let hid = await TransportHID.create();
                    setDevice(new TonTransport(hid));
                    setScreen('select-account');
                } catch (e) {
                    started = false;
                    console.warn(e);
                    setStarted(false);
                }
            })()
        };
    }, [started]);

    return (
        <View style={{ flexGrow: 1 }}>
            {!device && (
                <View style={{
                    marginHorizontal: 16,
                    marginBottom: 16,
                    borderRadius: 14,
                    alignItems: 'center',
                    padding: 16,
                    flexGrow: 1,
                }}>
                    <View style={{ flexGrow: 1 }} />
                    <Image style={{
                        width: 256, height: 256,
                    }}
                        source={require('../../../../assets/ic_ledger_s.png')}
                    />
                    <Text style={{
                        color: Theme.textColor,
                        fontWeight: '600',
                        fontSize: 18,
                        marginBottom: 12,
                        marginHorizontal: 16,
                    }}>
                        {t('hardwareWallet.actions.connect')}
                    </Text>
                    <Text style={{
                        color: Theme.textColor,
                        fontWeight: '400',
                        fontSize: 16,
                        marginBottom: 12,
                    }}>
                        {t('hardwareWallet.connectionHIDDescription')}
                    </Text>
                    <View style={{ flexGrow: 1 }} />
                    <RoundButton
                        title={t('common.continue')}
                        onPress={doStart}
                        style={{
                            width: '100%',
                        }}
                    />
                </View>
            )}
            {(!!device && screen === 'select-account') && (
                <LedgerSelectAccount reset={reset} device={device} />
            )}
        </View>
    );
});