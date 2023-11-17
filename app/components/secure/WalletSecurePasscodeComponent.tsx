import * as React from 'react';
import { Alert, Platform, View } from 'react-native';
import { getAppState, getBackup, getCurrentAddress, markAddressSecured } from '../../storage/appState';
import { contractFromPublicKey } from '../../engine/contractFromPublicKey';
import { t } from '../../i18n/t';
import { systemFragment } from '../../systemFragment';
import { warn } from '../../utils/log';
import { deriveUtilityKey } from '../../storage/utilityKeys';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { PasscodeSetup } from '../passcode/PasscodeSetup';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { WalletSecureComponent } from './WalletSecureComponent';
import { DeviceEncryption, getDeviceEncryption } from '../../storage/getDeviceEncryption';
import { LoadingIndicator } from '../LoadingIndicator';
import { storage } from '../../storage/storage';
import { BiometricsState, PasscodeState, encryptData, generateNewKeyAndEncryptWithPasscode, getBiometricsState, getPasscodeState, passcodeStateKey } from '../../storage/secureStorage';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { useKeysAuth } from './AuthWalletKeys';
import { mnemonicToWalletKey } from '@ton/crypto';
import { useNetwork, useSetAppState, useTheme } from '../../engine/hooks';

export const WalletSecurePasscodeComponent = systemFragment((props: {
    mnemonics: string,
    import: boolean,
    onBack?: () => void,
}) => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();
    const authContext = useKeysAuth();
    const setAppState = useSetAppState();

    const [state, setState] = useState<{ passcode: string, deviceEncryption: DeviceEncryption }>();
    const [loading, setLoading] = useState(false);

    const onComplete = useCallback(() => {
        const address = getBackup();
        let state = getAppState();
        if (!state) {
            throw Error('Invalid state');
        }
        markAddressSecured(address.address);
        navigation.navigateAndReplaceAll('Home');
    }, []);

    useEffect(() => {
        const appState = getAppState();
        if (appState.addresses.length <= 0) {
            return;
        }
        (async () => {
            setLoading(true);
            try {
                // Encrypted token
                let secretKeyEnc: Buffer | undefined = undefined;

                // Resolve key
                const key = await mnemonicToWalletKey(props.mnemonics.split(' '));

                // Resolve utility key
                const utilityKey = await deriveUtilityKey(props.mnemonics.split(' '));

                // Resolve contract
                const contract = await contractFromPublicKey(key.publicKey);

                // Authenticate
                const passcodeState = getPasscodeState();
                const biometricsState = getBiometricsState();
                const useBiometrics = (biometricsState === BiometricsState.InUse);

                if (useBiometrics) {
                    secretKeyEnc = await encryptData(Buffer.from(props.mnemonics));
                } else if (passcodeState === PasscodeState.Set) {
                    const authRes = await authContext.authenticateWithPasscode();
                    if (authRes) {
                        secretKeyEnc = await encryptData(Buffer.from(props.mnemonics), authRes.passcode);
                    }
                }

                if (!secretKeyEnc) {
                    throw new Error('Invalid app key');
                }

                // Persist state
                const state = getAppState();
                setAppState({
                    addresses: [
                        ...state.addresses,
                        {
                            address: contract.address,
                            publicKey: key.publicKey,
                            secretKeyEnc, // With passcode
                            utilityKey,
                            addressString: contract.address.toString({ testOnly: isTestnet })
                        }
                    ],
                    selected: state.addresses.length
                }, isTestnet);
                onComplete();
            } catch {
                Alert.alert(t('errors.secureStorageError.title'), t('errors.secureStorageError.message'));
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const onConfirmed = useCallback(async (passcode: string) => {
        setLoading(true);
        try {

            // Encrypted token
            let secretKeyEnc: Buffer;

            // Resolve key
            const key = await mnemonicToWalletKey(props.mnemonics.split(' '));

            // Resolve utility key
            const utilityKey = await deriveUtilityKey(props.mnemonics.split(' '));

            // Resolve contract
            const contract = await contractFromPublicKey(key.publicKey);

            const passcodeState = storage.getString(passcodeStateKey);
            const isPasscodeSet = (passcodeState === PasscodeState.Set);

            const appState = getAppState();

            if (isPasscodeSet && appState.addresses.length > 0) {
                // Use prev app key
                try {
                    secretKeyEnc = await encryptData(Buffer.from(props.mnemonics), passcode);
                } catch (e) {
                    console.warn(e)
                    warn('Failed to encrypt with passcode');
                    return;
                }
            } else {
                // Generate New Key
                try {
                    secretKeyEnc = await generateNewKeyAndEncryptWithPasscode(Buffer.from(props.mnemonics), passcode);
                } catch {
                    // Ignore
                    warn('Failed to generate new key');
                    return;
                }
            }

            // Persist state
            setAppState({
                addresses: [
                    ...appState.addresses,
                    {
                        address: contract.address,
                        publicKey: key.publicKey,
                        secretKeyEnc, // With passcode
                        utilityKey,
                        addressString: contract.address.toString({ testOnly: isTestnet })
                    }
                ],
                selected: appState.addresses.length
            }, isTestnet);

            const deviceEncryption = await getDeviceEncryption();

            let disableEncryption =
                (deviceEncryption === 'none')
                || (deviceEncryption === 'device-biometrics')
                || (deviceEncryption === 'device-passcode')
                || (Platform.OS === 'android' && Platform.Version < 30);

            const account = getCurrentAddress();
            markAddressSecured(account.address);

            // Skip biometrics setup if encryption is disabled
            if (disableEncryption) {
                if (props.import) {
                    let state = getAppState();
                    if (!state) {
                        throw Error('Invalid state');
                    }
                }
                navigation.navigateAndReplaceAll('Home');
                return;
            }

            setState({ passcode, deviceEncryption });
        } catch {
            Alert.alert(t('errors.secureStorageError.title'), t('errors.secureStorageError.message'));
        } finally {
            setLoading(false);
        }
    }, [setAppState]);

    const resetConfirmedAddressState = useCallback(() => {
        if (!state) {
            return;
        }

        try {
            const appState = getAppState();
            const account = getCurrentAddress();

            const newAddresses = appState.addresses.filter((a) => !a.address.equals(account.address));

            if (newAddresses.length > 0) {
                setAppState({
                    addresses: newAddresses,
                    selected: newAddresses.length - 1,
                }, isTestnet);
            } else {
                setAppState({ addresses: [], selected: -1 }, isTestnet);
            }
        } catch {
            // Ignore
        }

    }, [state, setAppState]);

    return (
        <View style={{ flexGrow: 1, width: '100%', paddingTop: 32 }}>
            {!state && !loading && (
                <Animated.View
                    style={[
                        { flex: 1 },
                        Platform.select({ android: { paddingTop: 0, paddingBottom: 16 }, ios: { paddingBottom: undefined } })
                    ]}
                >
                    <PasscodeSetup
                        style={props.import ? { backgroundColor: theme.backgroundPrimary } : undefined}
                        onReady={onConfirmed}
                        onBack={() => {
                            if (props.onBack) {
                                resetConfirmedAddressState();
                                props.onBack();
                            } else {
                                navigation.goBack();
                            }
                        }}
                        description={t('secure.passcodeSetupDescription')}
                        screenHeaderStyle={props.import ? { paddingHorizontal: 16 } : undefined}
                    />
                </Animated.View>
            )}

            {state && !loading && (
                <Animated.View
                    style={{ justifyContent: 'center', flexGrow: 1 }}
                    key={'content'}
                    entering={FadeIn}
                >
                    <WalletSecureComponent
                        deviceEncryption={state.deviceEncryption}
                        passcode={state.passcode}
                        import={props.import}
                        callback={(res: boolean) => {
                            if (res) {
                                onComplete();
                            } else {
                                resetConfirmedAddressState();
                                setState(undefined);
                            }
                        }}
                        onLater={onComplete}
                    />
                </Animated.View>
            )}

            {loading && (
                <Animated.View
                    style={{
                        position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
                        justifyContent: 'center', alignItems: 'center',
                    }}
                    entering={FadeIn}
                    exiting={FadeOut}
                >
                    <LoadingIndicator simple />
                </Animated.View>
            )}
        </View>
    );
});