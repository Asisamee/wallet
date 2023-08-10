import * as React from 'react';
import { Image, Platform, Pressable, Text, View } from 'react-native';
import { getAppState, getCurrentAddress } from '../../storage/appState';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ValueComponent } from '../../components/ValueComponent';
import { resolveUrl } from '../../utils/resolveUrl';
import { TouchableHighlight } from 'react-native-gesture-handler';
import { t } from '../../i18n/t';
import { PriceComponent } from '../../components/PriceComponent';
import { fragment } from '../../fragment';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { useEngine } from '../../engine/Engine';
import { WalletState } from '../../engine/products/WalletProduct';
import { useLinkNavigator } from "../../useLinkNavigator";
import { useAppConfig } from '../../utils/AppConfigContext';
import { ProductsComponent } from '../../components/products/ProductsComponent';
import { useCallback, useEffect, useMemo } from 'react';
import { WalletAddress } from '../../components/WalletAddress';
import Animated, { useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useBottomSheet } from '../../components/modal/BottomSheetModal';
import { Avatar } from '../../components/Avatar';
import { useTrackScreen } from '../../analytics/mixpanel';

import Chart from '../../../assets/ic-chart.svg';
import ChevronDown from '../../../assets/ic-chevron-down.svg';
import Scanner from '../../../assets/ic-scanner.svg';
import BN from 'bn.js';

function WalletComponent(props: { wallet: WalletState }) {
    const { Theme, AppConfig } = useAppConfig();
    const linkNavigator = useLinkNavigator(AppConfig.isTestnet);
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const modal = useBottomSheet();
    const address = useMemo(() => getCurrentAddress().address, []);
    const engine = useEngine();
    const walletSettings = engine.products.wallets.useWalletSettings(address);
    const balanceChart = engine.products.main.useAccountBalanceChart();
    const account = props.wallet;
    const currentWalletIndex = getAppState().selected;

    const onQRCodeRead = (src: string) => {
        try {
            let res = resolveUrl(src, AppConfig.isTestnet);
            if (res) {
                linkNavigator(res);
            }
        } catch (error) {
            // Ignore
        }
    };

    const openScanner = useCallback(() => navigation.navigateScanner({ callback: onQRCodeRead }), []);
    const onOpenBuy = useCallback(() => navigation.navigate('Buy'), []);
    const navigateToCurrencySettings = useCallback(() => navigation.navigate('Currency'), []);
    const openGraph = useCallback(() => {
        if (balanceChart && balanceChart.chart.length > 0) {
            navigation.navigate('AccountBalanceGraph');
        }
    }, [account]);

    // Wallet Account modal
    const onAccountPress = useCallback(() => {
        navigation.navigate('AccountSelector');
    }, [modal]);

    // ScrollView background color animation
    const scrollBackgroundColor = useSharedValue(1);
    // Views border radius animation on scroll
    const scrollBorderRadius = useSharedValue(24);

    const onScroll = useAnimatedScrollHandler((event) => {
        if ((event.contentOffset.y) >= 0) { // Overscrolled to top
            scrollBackgroundColor.value = 1;
        } else { // Overscrolled to bottom
            scrollBackgroundColor.value = 0;
        }
        if (event.contentOffset.y <= -(safeArea.top - 290)) {
            scrollBorderRadius.value = 24;
        } else {
            const diffRadius = (safeArea.top - 290) + event.contentOffset.y;
            scrollBorderRadius.value = 24 - diffRadius
        }
    }, []);

    const scrollStyle = useAnimatedStyle(() => {
        return { backgroundColor: scrollBackgroundColor.value === 0 ? '#131928' : 'white', };
    });

    const viewCardStyle = useAnimatedStyle(() => {
        return {
            borderBottomEndRadius: scrollBorderRadius.value,
            borderBottomStartRadius: scrollBorderRadius.value,
        }
    });

    return (
        <View style={{ flexGrow: 1, backgroundColor: Theme.item }}>
            <StatusBar style={'light'} />
            <View
                style={{
                    backgroundColor: '#131928',
                    paddingTop: safeArea.top,
                    paddingHorizontal: 16
                }}
                collapsable={false}
            >
                <View style={{
                    height: 44,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <Pressable
                        style={({ pressed }) => {
                            return {
                                opacity: pressed ? 0.5 : 1
                            }
                        }}
                        onPress={onAccountPress}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{
                                width: 24, height: 24,
                                backgroundColor: Theme.accent,
                                borderRadius: 12
                            }}>
                                <Avatar
                                    id={address.toFriendly({ testOnly: AppConfig.isTestnet })}
                                    size={24}
                                    borderWith={0}
                                    hash={walletSettings?.avatar}
                                />
                            </View>
                            <Text
                                style={{
                                    marginLeft: 12, fontWeight: '500',
                                    fontSize: 17,
                                    color: Theme.greyForIcon, maxWidth: '70%'
                                }}
                                ellipsizeMode='tail'
                                numberOfLines={1}
                            >
                                {walletSettings?.name || `${t('common.wallet')} ${currentWalletIndex + 1}`}
                            </Text>
                            <ChevronDown
                                style={{
                                    height: 16,
                                    width: 16,
                                    marginLeft: 8,
                                }}
                                height={16}
                                width={16}
                                color={Theme.greyForIcon}
                            />
                        </View>
                    </Pressable>
                    <View style={{ flexDirection: 'row' }}>
                        {account.transactions.length > 0 && (
                            <Pressable
                                style={({ pressed }) => { return { opacity: pressed ? 0.5 : 1 } }}
                                onPress={openGraph}
                            >
                                <Chart
                                    style={{
                                        height: 24,
                                        width: 24,
                                    }}
                                    height={24}
                                    width={24}
                                    color={Theme.greyForIcon}
                                />
                            </Pressable>
                        )}
                        <Pressable
                            style={({ pressed }) => { return { opacity: pressed ? 0.5 : 1 } }}
                            onPress={openScanner}
                        >
                            <Scanner
                                style={{
                                    height: 24,
                                    width: 24,
                                    marginLeft: 14
                                }}
                                height={24}
                                width={24}
                                color={Theme.greyForIcon}
                            />
                        </Pressable>
                    </View>
                </View>
            </View>
            <Animated.ScrollView
                style={[{ flexBasis: 0 }, scrollStyle]}
                contentContainerStyle={{ paddingBottom: 16, backgroundColor: 'white' }}
                showsVerticalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={16}
                decelerationRate={'normal'}
                alwaysBounceVertical={false}
            >
                <Animated.View
                    style={[{
                        backgroundColor: '#131928',
                        paddingHorizontal: 16,
                        paddingVertical: 20,
                    }, viewCardStyle]}
                    collapsable={false}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{
                            fontSize: 32,
                            color: Theme.white,
                            marginRight: 8,
                            fontWeight: '500',
                            lineHeight: 38,
                        }}>
                            <ValueComponent precision={6} value={account.balance} />
                            <Text style={{
                                fontSize: 17,
                                lineHeight: Platform.OS === 'ios' ? 24 : undefined,
                                color: Theme.darkGrey,
                                marginRight: 8,
                                fontWeight: '500',
                            }}>{' TON'}</Text>
                        </Text>
                    </View>
                    <View style={{
                        flexDirection: 'row', alignItems: 'center',
                        marginTop: 8
                    }}>
                        <Pressable onPress={navigateToCurrencySettings}>
                            <PriceComponent amount={account.balance} />
                        </Pressable>
                    </View>
                    <View style={{ flexGrow: 1 }} />
                    <WalletAddress
                        value={address.toFriendly({ testOnly: AppConfig.isTestnet })}
                        address={address}
                        elipsise
                        style={{
                            marginTop: 12,
                            alignSelf: 'flex-start',
                        }}
                        textStyle={{
                            fontSize: 13,
                            lineHeight: 18,
                            textAlign: 'left',
                            color: Theme.darkGrey,
                            fontWeight: '400',
                            fontFamily: undefined
                        }}
                        limitActions
                    />
                    <View
                        style={{
                            flexDirection: 'row',
                            marginHorizontal: 16,
                            backgroundColor: '#1F283E',
                            borderRadius: 20,
                            marginTop: 24
                        }}
                        collapsable={false}
                    >
                        {
                            (!AppConfig.isTestnet && Platform.OS === 'android') && (
                                <View style={{ flexGrow: 1, flexBasis: 0, marginRight: 7, borderRadius: 14, padding: 20 }}>
                                    <TouchableHighlight
                                        onPress={onOpenBuy}
                                        underlayColor={Theme.selector}
                                        style={{ borderRadius: 14 }}
                                    >
                                        <View style={{ justifyContent: 'center', alignItems: 'center', borderRadius: 14 }}>
                                            <View style={{
                                                backgroundColor: Theme.accent,
                                                width: 32, height: 32,
                                                borderRadius: 16,
                                                alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <Image source={require('../../../assets/ic_buy.png')} />
                                            </View>
                                            <Text style={{ fontSize: 15, lineHeight: 20, color: Theme.item, marginTop: 6 }}>{t('wallet.actions.buy')}</Text>
                                        </View>
                                    </TouchableHighlight>
                                </View>
                            )
                        }
                        <View style={{ flexGrow: 1, flexBasis: 0, marginRight: 7, borderRadius: 14, padding: 20 }}>
                            <TouchableHighlight
                                onPress={() => navigation.navigate('Receive')}
                                underlayColor={Theme.selector}
                                style={{ borderRadius: 14 }}
                            >
                                <View style={{ justifyContent: 'center', alignItems: 'center', borderRadius: 14 }}>
                                    <View style={{
                                        backgroundColor: Theme.accent,
                                        width: 32, height: 32,
                                        borderRadius: 16,
                                        alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <Image source={require('../../../assets/ic_receive.png')} />
                                    </View>
                                    <Text style={{ fontSize: 15, color: Theme.item, marginTop: 6, fontWeight: '400' }}>{t('wallet.actions.receive')}</Text>
                                </View>
                            </TouchableHighlight>
                        </View>
                        <View style={{ flexGrow: 1, flexBasis: 0, borderRadius: 14, padding: 20 }}>
                            <TouchableHighlight
                                onPress={() => navigation.navigateSimpleTransfer({ amount: null, target: null, stateInit: null, job: null, comment: null, jetton: null, callback: null })}
                                underlayColor={Theme.selector}
                                style={{ borderRadius: 14 }}
                            >
                                <View style={{ justifyContent: 'center', alignItems: 'center', borderRadius: 14 }}>
                                    <View style={{
                                        backgroundColor: Theme.accent,
                                        width: 32, height: 32,
                                        borderRadius: 16,
                                        alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <Image source={require('../../../assets/ic_send.png')} />
                                    </View>
                                    <Text style={{ fontSize: 15, color: Theme.item, marginTop: 6, fontWeight: '400' }}>{t('wallet.actions.send')}</Text>
                                </View>
                            </TouchableHighlight>
                        </View>
                    </View>
                </Animated.View>
                <ProductsComponent />
            </Animated.ScrollView>
        </View>
    );
}

export const WalletFragment = fragment(() => {
    const engine = useEngine();
    const account = engine.products.main.useAccount();
    const navigation = useTypedNavigation();
    useTrackScreen('Wallet', engine.isTestnet);

    useEffect(() => {
        if (!account) {
            navigation.setOptions({ tabBarStyle: { display: 'none' } });
            return;
        }
        navigation.setOptions({ tabBarStyle: { display: 'flex' } });
    }, [account, navigation]);
    if (!account) {
        return (
            <View style={{ flexGrow: 1, flexBasis: 0, justifyContent: 'center', alignItems: 'center' }}>
                <StatusBar style={'dark'} />
                <LoadingIndicator />
            </View>
        );
    } else {
        return <WalletComponent wallet={account} />
    }
}, true);