import { StatusBar } from "expo-status-bar";
import { useCallback } from "react";
import { Platform, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CloseButton } from "../../../components/CloseButton";
import { PasscodeSetup } from "../../../components/passcode/PasscodeSetup";
import { getAppState, getCurrentAddress, setAppState } from "../../../storage/appState";
import { BiometricsState, PasscodeState, decryptDataBatch, encryptData, generateNewKeyAndEncrypt } from "../../../storage/secureStorage";
import { loadWalletKeys } from "../../../storage/walletKeys";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { useEngine } from "../../../engine/Engine";
import { warn } from "../../../utils/log";
import { systemFragment } from "../../../systemFragment";
import { useAppConfig } from "../../../utils/AppConfigContext";
import { useRoute } from "@react-navigation/native";
import { AndroidToolbar } from "../../../components/topbar/AndroidToolbar";
import { t } from "../../../i18n/t";
import { storage } from "../../../storage/storage";
import { passcodeSetupShownKey } from "../../resolveOnboarding";

export const PasscodeSetupFragment = systemFragment(() => {
    const { AppConfig } = useAppConfig();
    const engine = useEngine();
    const settings = engine?.products?.settings;
    const route = useRoute();
    const init = route.name === 'PasscodeSetupInit';
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();

    const onPasscodeConfirmed = useCallback(async (passcode: string) => {
        const appState = getAppState();
        const current = getCurrentAddress();

        try {
            const decryptedKeys = await decryptDataBatch(appState.addresses.map(acc => acc.secretKeyEnc));
            const secretKeyEnc = await generateNewKeyAndEncrypt(false, decryptedKeys[appState.selected], passcode);

            const newSelectedAccount = {
                address: current.address,
                publicKey: current.publicKey,
                secretKeyEnc,
                utilityKey: current.utilityKey,
            };

            const newAddresses = [];
            for (let i = 0; i < decryptedKeys.length; i++) {
                const account = appState.addresses[i];
                if (i === appState.selected) {
                    continue;
                }
                const newEncKey = await encryptData(decryptedKeys[i], passcode);
                newAddresses.push({
                    address: account.address,
                    publicKey: account.publicKey,
                    secretKeyEnc: newEncKey,
                    utilityKey: account.utilityKey,
                });
            }
            newAddresses.push(newSelectedAccount);

            // Save new appState
            setAppState({
                addresses: newAddresses,
                selected: newAddresses.length - 1,
            }, AppConfig.isTestnet);

            if (!!settings) {
                settings.setPasscodeState(PasscodeState.Set);
                settings.setBiometricsState(BiometricsState.InUse);
            }
        } catch (e) {
            warn(`Failed to load wallet keys on PasscodeSetup ${init ? 'init' : 'change'}`);
            throw Error('Failed to load wallet keys');
        }

        if (init) {
            if (engine && !engine.ready) {
                navigation.navigateAndReplaceAll('Sync');
            } else {
                navigation.navigateAndReplaceAll('Home');
            }
        }
    }, []);

    return (
        <View style={{
            flex: 1,
            paddingTop: (Platform.OS === 'android' || init)
                ? safeArea.top
                : undefined,
        }}>
            {!init && (<AndroidToolbar />)}
            <StatusBar style={(Platform.OS === 'ios' && !init) ? 'light' : 'dark'} />
            <PasscodeSetup
                description={init ? t('security.passcodeSettings.enterNewDescription') : undefined}
                onReady={onPasscodeConfirmed}
                initial={init}
                onLater={init ? () => {
                    storage.set(passcodeSetupShownKey, true)
                    if (engine && !engine.ready) {
                        navigation.navigateAndReplaceAll('Sync');
                    } else {
                        navigation.navigateAndReplaceAll('Home');
                    }
                } : undefined}
                showSuccess={!init}
            />
            {Platform.OS === 'ios' && !init && (
                <CloseButton
                    style={{ position: 'absolute', top: 12, right: 10 }}
                    onPress={() => {
                        navigation.goBack();
                    }}
                />
            )}
        </View>
    );
});