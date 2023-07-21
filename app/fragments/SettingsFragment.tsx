import * as React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { ItemButton } from '../components/ItemButton';
import { fragment } from '../fragment';
import { useTypedNavigation } from '../utils/useTypedNavigation';
import { t } from '../i18n/t';
import { ProfileComponent } from './profile/ProfileComponent';
import { useEngine } from '../engine/Engine';
import BN from 'bn.js';
import { useAppConfig } from '../utils/AppConfigContext';
import { TabHeader } from '../components/topbar/TabHeader';
import { useTrackScreen } from '../analytics/mixpanel';

import Security from '../../assets/ic-security.svg';
import Spam from '../../assets/ic-spam.svg';
import Contacts from '../../assets/ic-contacts.svg';
import Currency from '../../assets/ic-currency.svg';
import Accounts from '../../assets/ic-accounts.svg';
import Terms from '../../assets/ic-terms.svg';
import Privacy from '../../assets/ic-privacy.svg';

export const SettingsFragment = fragment(() => {
    const { Theme, AppConfig } = useAppConfig();
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const oldWalletsBalance = engine.products.legacy.useState();

    const onVersionTap = React.useMemo(() => {
        let count = 0;
        let timer: any | null = null;
        return () => {
            count++;
            if (count > 5) {
                count = 0;
                navigation.navigate('DeveloperTools')
            } else {
                if (timer) {
                    clearTimeout(timer);
                }
                timer = setTimeout(() => {
                    timer = null;
                    count = 0;
                }, 1000);
            }
        };
    }, []);

    useTrackScreen('More', engine.isTestnet);

    return (
        <View style={{ flexGrow: 1 }}>
            <TabHeader title={t('settings.title')} />
            <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                style={{
                    flexGrow: 1,
                    backgroundColor: 'white',
                    paddingHorizontal: 16,
                    flexBasis: 0,
                }}
            >
                <ProfileComponent />
                <View style={{
                    marginBottom: 16, marginTop: 16,
                    backgroundColor: Theme.lightGrey,
                    borderRadius: 20,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <ItemButton
                        leftIconComponent={<Security width={24} height={24} />}
                        title={t('security.title')}
                        onPress={() => navigation.navigate('Security')}
                    />
                    {oldWalletsBalance.gt(new BN(0)) && (
                        <ItemButton
                            leftIcon={require('../../assets/ic_wallet_2.png')}
                            title={t('settings.migrateOldWallets')}
                            onPress={() => navigation.navigate('Migration')}
                        />
                    )}
                    <ItemButton
                        leftIconComponent={<Spam width={24} height={24} />}
                        title={t('settings.spamFilter')}
                        onPress={() => navigation.navigate('SpamFilter')}
                    />
                    <ItemButton
                        leftIconComponent={<Contacts width={24} height={24} />}
                        title={t('contacts.title')}
                        onPress={() => navigation.navigate('Contacts')}
                    />
                    <ItemButton
                        leftIconComponent={<Currency width={24} height={24} />}
                        title={t('settings.primaryCurrency')}
                        onPress={() => navigation.navigate('Currency')}
                    />
                </View>

                <View style={{
                    marginBottom: 16,
                    backgroundColor: Theme.lightGrey,
                    borderRadius: 20,
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <ItemButton
                        leftIconComponent={<Accounts width={24} height={24} />}
                        title={t('products.accounts')}
                        onPress={() => navigation.navigate('Accounts')}
                    />
                </View>

                <View style={{
                    marginBottom: 16,
                    backgroundColor: Theme.lightGrey,
                    borderRadius: 20,
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <ItemButton
                        leftIconComponent={<Terms width={24} height={24} />}
                        title={t('settings.termsOfService')}
                        onPress={() => navigation.navigate('Terms')}
                    />
                    <ItemButton
                        leftIconComponent={<Privacy width={24} height={24} />}
                        title={t('settings.privacyPolicy')}
                        onPress={() => navigation.navigate('Privacy')}
                    />
                </View>

                {__DEV__ && (
                    <View style={{
                        marginBottom: 16,
                        backgroundColor: Theme.lightGrey,
                        borderRadius: 20,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                        <ItemButton
                            title={'Dev Tools'}
                            onPress={() => navigation.navigate('DeveloperTools')}
                        />
                    </View>
                )}
                <View style={{
                    marginBottom: 4,
                    backgroundColor: Theme.lightGrey,
                    borderRadius: 20,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <ItemButton
                        dangerZone
                        title={t('common.logout')}
                        onPress={() => navigation.navigate('Logout')}
                    />
                    <ItemButton
                        dangerZone
                        title={t('deleteAccount.title')}
                        onPress={() => navigation.navigate('DeleteAccount')}
                    />
                </View>
                <Pressable
                    onPress={onVersionTap}
                    style={{
                        bottom: 14,
                        flexShrink: 1,
                        alignSelf: 'center',
                        borderRadius: 20,
                        overflow: 'hidden',
                        marginTop: 36, marginBottom: 32,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                    }}
                >
                    <Image
                        style={{
                            height: 48
                        }}
                        resizeMode={'contain'}
                        source={require('../../assets/ic-splash.png')}
                    />
                    <Text
                        style={{
                            color: Theme.darkGrey,
                            fontSize: 13,
                            lineHeight: 18,
                            fontWeight: '400',
                            alignSelf: 'center',
                        }}
                    >
                        v{AppConfig.version}
                    </Text>
                </Pressable>
            </ScrollView>
        </View>
    );
}, true);