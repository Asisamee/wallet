import * as React from 'react';
import { Image, LayoutAnimation, Platform, Pressable, Text, View } from 'react-native';
import { getCurrentAddress } from '../../storage/appState';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { TransactionView } from './views/TransactionView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ValueComponent } from '../../components/ValueComponent';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { resolveUrl } from '../../utils/resolveUrl';
import { Address } from 'ton';
import { TouchableHighlight } from 'react-native-gesture-handler';
import { WalletAddress } from '../../components/WalletAddress';
import { t } from '../../i18n/t';
import { PriceComponent } from '../../components/PriceComponent';
import { ProductsComponent } from './products/ProductsComponent';
import { fragment } from '../../fragment';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { Engine, useEngine } from '../../engine/Engine';
import { WalletState } from '../../engine/products/WalletProduct';
import { useLinkNavigator } from "../../useLinkNavigator";
import { useAppConfig } from '../../utils/AppConfigContext';
import { StatusBar } from 'expo-status-bar';

import Chart from '../../../assets/ic-chart.svg';
import ChevronDown from '../../../assets/ic-chevron-down.svg';
import Scanner from '../../../assets/ic-scanner.svg';

const PendingTxs = React.memo((props: {
    txs: { id: string, time: number }[],
    next: { lt: string, hash: string } | null,
    address: Address,
    engine: Engine,
    onPress: (tx: string) => void
}) => {
    const { Theme } = useAppConfig();
    return (
        <>
            <View style={{ marginTop: 8, backgroundColor: Theme.background }} collapsable={false}>
                <Text style={{ fontSize: 18, fontWeight: '700', marginHorizontal: 16, marginVertical: 8 }}>{t('wallet.pendingTransactions')}</Text>
            </View>
            {props.txs.map((t, i) => {
                return (
                    <View
                        key={'tx-view' + t}
                        style={{ marginHorizontal: 16, borderRadius: 14, backgroundColor: Theme.item, overflow: 'hidden' }}
                        collapsable={false}
                    >
                        <TransactionView
                            key={'tx-' + t}
                            own={props.address}
                            engine={props.engine}
                            tx={t.id}
                            separator={i < props.txs.length - 1}
                            onPress={props.onPress}
                        />
                    </View>
                )
            })}
        </>
    );
});

function WalletComponent(props: { wallet: WalletState }) {
    const { Theme, AppConfig } = useAppConfig();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const address = React.useMemo(() => getCurrentAddress().address, []);
    const engine = useEngine();
    const balanceChart = engine.products.main.useAccountBalanceChart();
    const account = props.wallet;

    //
    // Transactions
    //

    const openTransactionFragment = React.useCallback((transaction: string) => {
        if (transaction) {
            navigation.navigate('Transaction', {
                transaction: transaction
            });
        }
    }, [navigation]);
    const linkNavigator = useLinkNavigator(AppConfig.isTestnet);

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

    const onOpenBuy = React.useCallback(
        () => {
            navigation.navigate('Buy');
        },
        [],
    );

    const openGraph = React.useCallback(() => {
        if (balanceChart && balanceChart.chart.length > 0) {
            navigation.navigate('AccountBalanceGraph');
        }
    }, [account]);

    const navigateToCurrencySettings = React.useCallback(() => {
        navigation.navigate('Currency');
    }, []);

    React.useLayoutEffect(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }, [account.pending.length]);

    return (
        <View style={{ flexGrow: 1, paddingBottom: safeArea.bottom, backgroundColor: '#131928' }}>
            <StatusBar style="light" />
            <Animated.ScrollView
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingTop: Platform.OS === 'android'
                        ? safeArea.top + 44
                        : undefined,
                    backgroundColor: Theme.item
                }}
                contentInset={{ top: 0, bottom: 52 }}
                contentOffset={{ y: -(44 + safeArea.top), x: 0 }}
                removeClippedSubviews={true}
            >
                <View
                    style={{
                        backgroundColor: '#131928',
                        paddingTop: safeArea.top,
                        paddingHorizontal: 16,
                        borderBottomEndRadius: 24,
                        borderBottomStartRadius: 24,
                        paddingBottom: 20,
                    }}
                    collapsable={false}
                >

                    <View style={{
                        height: 44,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{
                                width: 24, height: 24,
                                backgroundColor: Theme.accent,
                                borderRadius: 12
                            }}>
                            </View>
                            <Text style={{ marginLeft: 12, fontWeight: '500', fontSize: 17, color: '#AAB4BF' }}>
                                {'Wallet 1'}
                            </Text>
                            <ChevronDown
                                style={{
                                    height: 16,
                                    width: 16,
                                    marginLeft: 8,
                                }}
                                height={16}
                                width={16}
                                color={'#AAB4BF'}
                            />
                        </View>
                        <View style={{ flexDirection: 'row' }}>
                            <Chart
                                style={{
                                    height: 24,
                                    width: 24,
                                }}
                                height={24}
                                width={24}
                                color={'#AAB4BF'}
                            />
                            <Scanner
                                style={{
                                    height: 24,
                                    width: 24,
                                    marginLeft: 14
                                }}
                                height={24}
                                width={24}
                                color={'#AAB4BF'}
                            />
                        </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{
                            fontSize: 32,
                            color: 'white',
                            marginRight: 8,
                            fontWeight: '500',
                        }}>

                            <ValueComponent precision={6} value={account.balance} />
                            <Text style={{
                                fontSize: 17,
                                color: '#838D99',
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
                            textAlign: 'left',
                            color: '#838D99',
                            fontWeight: '400',
                            fontFamily: undefined
                        }}
                        lockActions
                    />
                    <View style={{
                        flexDirection: 'row',
                        marginHorizontal: 16,
                        backgroundColor: '#1F283E',
                        borderRadius: 20,
                        paddingVertical: 20,
                        marginTop: 24
                    }} collapsable={false}>
                        {
                            // TODO export to component
                            (!AppConfig.isTestnet && Platform.OS === 'android') && (
                                <View style={{ flexGrow: 1, flexBasis: 0, marginRight: 7, borderRadius: 14 }}>
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
                                            <Text style={{ fontSize: 15, color: Theme.item, marginTop: 6 }}>{t('wallet.actions.buy')}</Text>
                                        </View>
                                    </TouchableHighlight>
                                </View>
                            )
                        }
                        <View style={{ flexGrow: 1, flexBasis: 0, marginRight: 7, borderRadius: 14 }}>
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
                        <View style={{ flexGrow: 1, flexBasis: 0, borderRadius: 14 }}>
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
                </View>

                {account.pending.length > 0 && Platform.OS === 'android' && (
                    <Animated.View entering={FadeInUp} exiting={FadeOutDown}>
                        <PendingTxs
                            txs={account.pending}
                            next={account.next}
                            address={address}
                            engine={engine}
                            onPress={openTransactionFragment}
                        />
                    </Animated.View>
                )}

                {account.pending.length > 0 && Platform.OS !== 'android' && (
                    <PendingTxs
                        txs={account.pending}
                        next={account.next}
                        address={address}
                        engine={engine}
                        onPress={openTransactionFragment}
                    />
                )}

                {/* Jettons, Extensions & other products */}
                <ProductsComponent />

                <View style={{ height: 56 + safeArea.bottom }} />
            </Animated.ScrollView>
        </View >
    );
}

export const WalletFragment = fragment(() => {
    const engine = useEngine();
    const account = engine.products.main.useAccount();
    if (!account) {
        return (
            <View style={{ flexGrow: 1, flexBasis: 0, justifyContent: 'center', alignItems: 'center' }}>
                <LoadingIndicator />
            </View>
        );
    } else {
        return <WalletComponent wallet={account} />
    }
}, true);