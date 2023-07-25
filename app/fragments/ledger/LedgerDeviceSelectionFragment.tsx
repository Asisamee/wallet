import React, { useCallback } from "react";
import { View, Text, ScrollView } from "react-native";
import TransportBLE from "@ledgerhq/react-native-hw-transport-ble";
import { t } from "../../i18n/t";
import { BleDevice } from "./components/BleDevice";
import { checkMultiple, PERMISSIONS, requestMultiple } from 'react-native-permissions';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RoundButton } from "../../components/RoundButton";
import { useAppConfig } from "../../utils/AppConfigContext";
import * as Application from 'expo-application';
import * as IntentLauncher from 'expo-intent-launcher';
import { fragment } from "../../fragment";
import { useLedgerTransport } from "./components/LedgerTransportProvider";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useTypedNavigation } from "../../utils/useTypedNavigation";

export const LedgerDeviceSelectionFragment = fragment(() => {
    const { Theme } = useAppConfig();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const ledgerContext = useLedgerTransport();
    const devices = (
        (ledgerContext?.bleSearchState?.type === 'completed' && ledgerContext?.bleSearchState?.success)
        || (ledgerContext?.bleSearchState?.type === 'ongoing') && ledgerContext?.bleSearchState.devices.length > 0
    ) ? ledgerContext.bleSearchState.devices : [];

    const onDeviceSelect = useCallback(async (device: any) => {
        const transport = await TransportBLE.open(device.id);
        ledgerContext?.setLedgerConnection({ type: 'ble', transport });
    }, [ledgerContext]);

    const newScan = useCallback(() => {
        console.log('new scan');
        ledgerContext?.startBleSearch();
    }, [ledgerContext]);

    if (ledgerContext?.bleSearchState?.type === 'permissions-failed') {
        return (
            <View style={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
                <Text style={{
                    fontSize: 18,
                    fontWeight: '600',
                    marginHorizontal: 16,
                    marginVertical: 16,
                    textAlign: 'center'
                }}>
                    {t('hardwareWallet.errors.permissions')}
                </Text>
                <RoundButton
                    title={t('hardwareWallet.actions.givePermissions')}
                    action={async () => {
                        const checkCoarse = await checkMultiple([
                            PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
                            PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
                        ]);

                        if (checkCoarse[PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION] !== 'granted'
                            || checkCoarse[PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION] !== 'granted') {
                            const requestLocation = await requestMultiple([
                                PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
                                PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
                            ]);
                            if (requestLocation[PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION] !== 'granted'
                                || requestLocation[PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION] !== 'granted') {
                                // Open system app settings
                                const pkg = Application.applicationId;
                                IntentLauncher.startActivityAsync(
                                    IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
                                    { data: 'package:' + pkg }
                                );
                                return;
                            }
                        }

                        const scanConnect = await checkMultiple([
                            PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
                            PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
                        ]);

                        if (scanConnect[PERMISSIONS.ANDROID.BLUETOOTH_SCAN] !== 'granted'
                            || scanConnect[PERMISSIONS.ANDROID.BLUETOOTH_CONNECT] !== 'granted') {
                            let resScanConnect = await requestMultiple([
                                PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
                                PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
                            ]);
                            if (resScanConnect[PERMISSIONS.ANDROID.BLUETOOTH_SCAN] !== 'granted'
                                || resScanConnect[PERMISSIONS.ANDROID.BLUETOOTH_CONNECT] !== 'granted') {
                                // Open system app settings
                                const pkg = Application.applicationId;
                                IntentLauncher.startActivityAsync(
                                    IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
                                    { data: 'package:' + pkg }
                                );
                                return;
                            }
                        }
                    }}
                    style={{
                        marginBottom: safeArea.bottom + 16,
                        marginHorizontal: 16,
                    }}
                />
            </View>
        );
    }

    console.log({ devices, bleSearchState: ledgerContext?.bleSearchState });

    return (
        <View style={{ flexGrow: 1 }}>
            <ScreenHeader
                title={t('hardwareWallet.title')}
                onBackPressed={navigation.goBack}
            />
            <Text style={{
                color: Theme.textColor,
                fontWeight: '600',
                fontSize: 32, lineHeight: 38,
                marginBottom: 16,
                marginHorizontal: 8,
                textAlign: 'center'
            }}>
                {t('hardwareWallet.devices')}
            </Text>
            <ScrollView style={{
                flexGrow: 1
            }}>
                {devices.map((device: any) => {
                    return (
                        <BleDevice key={`ledger-${device.id}`} device={device} onSelect={onDeviceSelect} />
                    );
                })}
            </ScrollView>
            <View style={{
                flexDirection: 'row',
                position: 'absolute',
                bottom: safeArea.bottom + 16,
                left: 0, right: 0,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: Theme.background,
            }}>
                <RoundButton
                    title={t('hardwareWallet.actions.scanBluetooth')}
                    display={'secondary'}
                    size={'normal'}
                    style={{ paddingHorizontal: 8 }}
                    onPress={newScan}
                />
            </View>
        </View>
    )
});