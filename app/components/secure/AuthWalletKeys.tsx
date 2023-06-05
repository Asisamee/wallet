import React, { useCallback, useState } from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Pressable, Text } from 'react-native';
import { WalletKeys, loadWalletKeys, loadWalletKeysWithPassword } from '../../storage/walletKeys';
import { PasscodeInput } from '../passcode/PasscodeInput';
import { t } from '../../i18n/t';
import { PasscodeState, getBiometricsMigrated, getBiometricsEncKey, passcodeStateKey } from '../../storage/secureStorage';
import { useAppConfig } from '../../utils/AppConfigContext';
import { useEngine } from '../../engine/Engine';
import { getCurrentAddress } from '../../storage/appState';
import { storage } from '../../storage/storage';
import { warn } from '../../utils/log';
import { Address } from 'ton';

export type AuthStyle = {
    backgroundColor?: string,
    cancelable?: boolean,
}

export type AuthProps = {
    promise: { resolve: (keys: WalletKeys) => void, reject: () => void },
    style?: AuthStyle
}

export type AuthWalletKeysType = {
    authenticate: (style?: AuthStyle) => Promise<WalletKeys>,
    authenticateWithPasscode: (style?: AuthStyle) => Promise<WalletKeys>,
}

export function getPasscodeState(address: Address, isTestnet: boolean) {
    return storage.getString(`${address.toFriendly({ testOnly: isTestnet })}/${passcodeStateKey}`);
}

export const AuthWalletKeysContext = React.createContext<AuthWalletKeysType | null>(null);

export const AuthWalletKeysContextProvider = React.memo((props: { children?: any }) => {
    const engine = useEngine();
    const { Theme, AppConfig } = useAppConfig();
    const [auth, setAuth] = useState<AuthProps | null>(null);

    const authenticate = useCallback(async (style?: AuthStyle) => {

        // Reject previous auth promise
        if (auth) {
            auth.promise.reject();
        }

        // Clear previous auth
        setAuth(null);

        const acc = getCurrentAddress();

        // Check if migrated to new Passcode and Biometrics keys system
        const migrated = getBiometricsMigrated(AppConfig.isTestnet);

        try {
            if (migrated) {
                const passcodeState = getPasscodeState(acc.address, AppConfig.isTestnet);
                if (passcodeState === PasscodeState.Set) {
                    const passcodeKeys = new Promise<WalletKeys>((resolve, reject) => {
                        const passcodeState = getPasscodeState(acc.address, AppConfig.isTestnet);
                        if (passcodeState !== PasscodeState.Set) {
                            setAuth(null);
                            reject();
                            return;
                        }
                        setAuth({ promise: { resolve, reject }, style });
                    });
                    return passcodeKeys;
                }

                const biometricsEncKey = getBiometricsEncKey(acc.address.toFriendly({ testOnly: AppConfig.isTestnet }));
                // Should never happen
                if (!biometricsEncKey) {
                    throw new Error('Biometrics key not found');
                }
                const keys = await loadWalletKeys(biometricsEncKey);
                return keys;
            } else {
                try {
                    const keys = await loadWalletKeys(acc.secretKeyEnc);
                    return keys;
                } catch (e) {
                    const passcodeKeys = new Promise<WalletKeys>((resolve, reject) => {
                        const passcodeState = getPasscodeState(acc.address, AppConfig.isTestnet);
                        if (passcodeState !== PasscodeState.Set) {
                            setAuth(null);
                            reject();
                            return;
                        }
                        setAuth({ promise: { resolve, reject }, style });
                    });
                    return passcodeKeys;
                }
            }
        } catch (e) {
            warn('Failed to load wallet keys');
            throw Error('Failed to load wallet keys');
        }
    }, [auth]);

    // Passcode only auth
    const authenticateWithPasscode = useCallback((style?: AuthStyle) => {
        
        // Reject previous auth promise
        if (auth) {
            auth.promise.reject();
        }

        // Clear previous auth
        setAuth(null);

        return new Promise<WalletKeys>((resolve, reject) => {
            const acc = getCurrentAddress();
            const passcodeState = getPasscodeState(acc.address, AppConfig.isTestnet);
            if (passcodeState !== PasscodeState.Set) {
                reject();
            }
            setAuth({ promise: { resolve, reject }, style });
        });
    }, [auth]);

    return (
        <AuthWalletKeysContext.Provider value={{ authenticate, authenticateWithPasscode }}>
            {props.children}
            {auth !== null && (
                <Animated.View
                    style={[
                        {
                            backgroundColor: auth.style?.backgroundColor ?? Theme.background,
                            flexGrow: 1,
                            justifyContent: 'center',
                            alignItems: 'center',
                        },
                    ]}
                    exiting={FadeOut}
                    entering={FadeIn}
                >
                    <PasscodeInput
                        title={t('security.passcodeSettings.enterCurrent')}
                        onEntered={async (pass) => {
                            if (!pass) {
                                auth.promise.reject();
                                setAuth(null);
                                return;
                            }
                            const acc = getCurrentAddress();
                            try {
                                const keys = await loadWalletKeysWithPassword(
                                    acc.address.toFriendly({ testOnly: engine.isTestnet }),
                                    pass
                                );
                                auth.promise.resolve(keys);
                            } catch (e) {
                                auth.promise.reject();
                            }
                            setAuth(null);
                        }}
                        onRetryBiometrics={async () => {
                            try {
                                const acc = getCurrentAddress();
                                const keys = await loadWalletKeys(acc.secretKeyEnc);
                                auth.promise.resolve(keys);
                                setAuth(null);
                            } catch (e) {
                                warn('Failed to load wallet keys');
                            }
                        }}
                    />
                    {auth.style?.cancelable && (
                        <Pressable
                            style={({ pressed }) => {
                                return {
                                    position: 'absolute', top: 24, right: 16,
                                    opacity: pressed ? 0.5 : 1,
                                }
                            }}
                            onPress={() => {
                                auth.promise.reject();
                                setAuth(null);
                            }}
                        >
                            <Text style={{
                                color: Theme.accent,
                                fontSize: 17,
                                fontWeight: '500',
                            }}>
                                {t('common.cancel')}
                            </Text>
                        </Pressable>
                    )}
                </Animated.View>
            )}
        </AuthWalletKeysContext.Provider>
    );
});

export function useKeysAuth() {
    const context = React.useContext(AuthWalletKeysContext);
    if (!context) {
        throw new Error('useKeysAuth must be used within a AuthWalletKeysContextProvider');
    }
    return context;
}

