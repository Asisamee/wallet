import React, { useCallback, useMemo } from "react";
import { View, Text, Platform, useWindowDimensions, Image, Pressable, TouchableHighlight } from "react-native";
import Animated, { } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Address, toNano } from "ton";
import { PriceComponent } from "../../components/PriceComponent";
import { ValueComponent } from "../../components/ValueComponent";
import { WalletAddress } from "../../components/WalletAddress";
import { useEngine } from "../../engine/Engine";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { StakingCycle } from "../../components/Staking/StakingCycle";
import { StakingPendingComponent } from "../../components/Staking/StakingPendingComponent";
import { openWithInApp } from "../../utils/openWithInApp";
import { useParams } from "../../utils/useParams";
import { TransferAction } from "./StakingTransferFragment";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { RestrictedPoolBanner } from "../../components/Staking/RestrictedPoolBanner";
import { KnownPools } from "../../utils/KnownPools";
import { CalculatorButton } from "../../components/Staking/CalculatorButton";
import { useAppConfig } from "../../utils/AppConfigContext";
import { StakingPoolType } from "./StakingPoolsFragment";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { useLedgerTransport } from "../ledger/components/LedgerTransportProvider";
import { ScreenHeader } from "../../components/ScreenHeader";
import { StatusBar, setStatusBarStyle } from "expo-status-bar";

import GraphIcon from '../../../assets/ic_graph.svg';
import InfoIcon from '../../../assets/ic-info-accent.svg';
import BN from "bn.js";

export const StakingFragment = fragment(() => {
    const { Theme, AppConfig } = useAppConfig();
    const safeArea = useSafeAreaInsets();
    const params = useParams<{ backToHome?: boolean, pool: string }>();
    const navigation = useTypedNavigation();
    const route = useRoute();
    const engine = useEngine();
    const isLedger = route.name === 'LedgerStaking';

    const ledgerContext = useLedgerTransport();
    const ledgerAddress = useMemo(() => {
        if (!isLedger || !ledgerContext?.addr?.address) return;
        try {
            return Address.parse(ledgerContext?.addr?.address);
        } catch {
            return;
        }
    }, [ledgerContext?.addr?.address]);

    const targetPool = Address.parse(params.pool);
    const pool = engine.products.whalesStakingPools.usePool(targetPool, ledgerAddress);
    const poolParams = pool?.params;
    const member = pool?.member;
    const stakingCurrent = engine.products.whalesStakingPools.useStakingCurrent();
    const ledgerStaking = engine.products.whalesStakingPools.useStaking(ledgerAddress);
    const staking = isLedger ? ledgerStaking : stakingCurrent;
    const stakingChart = engine.products.whalesStakingPools.useStakingChart(targetPool);

    let type: StakingPoolType = useMemo(() => {
        if (KnownPools(AppConfig.isTestnet)[params.pool].name.toLowerCase().includes('club')) {
            return 'club';
        }
        if (KnownPools(AppConfig.isTestnet)[params.pool].name.toLowerCase().includes('team')) {
            return 'team';
        }
        return 'nominators'
    }, [staking]);

    let available = useMemo(() => {
        if (AppConfig.isTestnet) {
            return true;
        }
        return !!staking?.config!.pools.find((v2) => Address.parse(v2).equals(targetPool))
    }, [staking, targetPool]);

    const onTopUp = useCallback(() => {
        if (isLedger) {
            navigation.navigate('LedgerStakingTransfer', {
                target: targetPool,
                amount: pool?.params.minStake.add(pool.params.receiptPrice).add(pool.params.depositFee),
                lockAddress: true,
                lockComment: true,
                action: 'top_up' as TransferAction,
            });
            return;
        }
        navigation.navigateStaking({
            target: targetPool,
            amount: pool?.params.minStake.add(pool.params.receiptPrice).add(pool.params.depositFee),
            lockAddress: true,
            lockComment: true,
            action: 'top_up' as TransferAction,
        });
    }, [targetPool, pool]);

    const onUnstake = useCallback(() => {
        if (isLedger) {
            navigation.navigate('LedgerStakingTransfer', {
                target: targetPool,
                lockAddress: true,
                lockComment: true,
                action: 'withdraw' as TransferAction,
            });
            return;
        }
        navigation.navigateStaking({
            target: targetPool,
            lockAddress: true,
            lockComment: true,
            action: 'withdraw' as TransferAction,
        });
    }, [targetPool]);

    const openMoreInfo = useCallback(
        () => {
            openWithInApp(AppConfig.isTestnet ? 'https://test.tonwhales.com/staking' : 'https://tonwhales.com/staking');
        },
        [],
    );

    const navigateToCurrencySettings = useCallback(() => navigation.navigate('Currency'), []);

    useFocusEffect(() => {
        setTimeout(() => {
            setStatusBarStyle('dark');
        }, 100);
    });

    return (
        <View style={{ flexGrow: 1, paddingBottom: safeArea.bottom }}>
            <ScreenHeader
                style={{ marginTop: 32 }}
                onBackPressed={navigation.goBack}
                rightButton={
                    <Pressable
                        onPress={openMoreInfo}
                        style={({ pressed }) => {
                            return {
                                opacity: pressed ? 0.3 : 1,
                                position: 'absolute',
                                bottom: 12, right: 16
                            }
                        }}
                    >
                        <InfoIcon height={26} width={26} style={{ height: 26, width: 26 }} />
                    </Pressable>
                }
                titleComponent={
                    <Pressable style={{
                        alignItems: 'center', backgroundColor: Theme.lightGrey,
                        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 32,
                        maxWidth: '70%'
                    }}>
                        <Text style={{
                            fontSize: 17, lineHeight: 24,
                            color: Theme.textColor,
                            fontWeight: '500',
                        }}>
                            {KnownPools(AppConfig.isTestnet)[params.pool].name}
                        </Text>
                    </Pressable>
                }
            />
            <Animated.ScrollView
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingTop: Platform.OS === 'android'
                        ? safeArea.top + 44
                        : undefined,
                    paddingHorizontal: 16,
                }}
                contentInset={{ top: isLedger ? 44 + 16 : 0 }}
                scrollEventThrottle={16}
            >
                <View
                    style={[
                        {
                            marginVertical: 16,
                            backgroundColor: Theme.walletBackground,
                            borderRadius: 20,
                            paddingHorizontal: 20, paddingVertical: 16,
                        }
                    ]}
                    collapsable={false}
                >
                    <Text
                        style={{
                            fontSize: 15, lineHeight: 20,
                            color: Theme.white,
                            opacity: 0.7,
                        }}
                    >
                        {t('products.staking.balance')}
                    </Text>
                    <Text style={{ fontSize: 27, color: Theme.white, fontWeight: '600', marginTop: 14 }}>
                        <ValueComponent
                            value={member?.balance || new BN(0)}
                            precision={4}
                            centFontStyle={{ opacity: 0.5 }}
                        />
                        <Text style={{
                            fontSize: 17,
                            lineHeight: Platform.OS === 'ios' ? 24 : undefined,
                            color: Theme.white,
                            marginRight: 8,
                            fontWeight: '500',
                            opacity: 0.5
                        }}>{' TON'}</Text>
                    </Text>
                    <View style={{
                        flexDirection: 'row', alignItems: 'center',
                        marginTop: 10
                    }}>
                        <Pressable
                            style={{ flexDirection: 'row', alignItems: 'center' }}
                            onPress={navigateToCurrencySettings}
                        >
                            <PriceComponent
                                amount={member?.balance || new BN(0)}
                                style={{ backgroundColor: 'rgba(255,255,255, .1)' }}
                            />
                            <PriceComponent
                                showSign
                                amount={toNano(1)}
                                style={{ backgroundColor: 'rgba(255,255,255, .1)', marginLeft: 10 }}
                            />
                        </Pressable>
                    </View>
                    <WalletAddress
                        value={targetPool.toFriendly({ testOnly: AppConfig.isTestnet })}
                        address={targetPool}
                        elipsise
                        style={{
                            marginTop: 20,
                            alignSelf: 'flex-start',
                        }}
                        textStyle={{
                            fontSize: 15,
                            lineHeight: 20,
                            textAlign: 'left',
                            color: Theme.darkGrey,
                            fontWeight: '400',
                            fontFamily: undefined
                        }}
                        limitActions
                    />
                </View>
                <View
                    style={{
                        flexDirection: 'row',
                        backgroundColor: Theme.lightGrey,
                        borderRadius: 20,
                        marginBottom: 16, marginTop: 32
                    }}
                    collapsable={false}
                >
                    <View style={{ flexGrow: 1, flexBasis: 0, marginRight: 7, borderRadius: 14, padding: 20 }}>
                        <TouchableHighlight
                            onPress={onTopUp}
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
                                    <Image source={require('../../../assets/ic-plus.png')} />
                                </View>
                                <Text
                                    style={{
                                        fontSize: 15,
                                        color: Theme.textColor,
                                        marginTop: 6,
                                        fontWeight: '400'
                                    }}>
                                    {t('products.staking.actions.top_up')}
                                </Text>
                            </View>
                        </TouchableHighlight>
                    </View>
                    <View style={{ flexGrow: 1, flexBasis: 0, borderRadius: 14, padding: 20 }}>
                        <TouchableHighlight
                            onPress={onUnstake}
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
                                <Text
                                    style={{
                                        fontSize: 15,
                                        color: Theme.textColor,
                                        marginTop: 6,
                                        fontWeight: '400'
                                    }}
                                >
                                    {t('products.staking.actions.withdraw')}
                                </Text>
                            </View>
                        </TouchableHighlight>
                    </View>
                </View>
                <StakingPendingComponent
                    target={targetPool}
                    params={poolParams}
                    member={member}
                />
                {pool && (
                    <StakingCycle
                        stakeUntil={pool.params.stakeUntil}
                        locked={pool.params.locked}
                        style={{
                            marginBottom: 14
                        }}
                    />
                )}
                {!AppConfig.isTestnet && <CalculatorButton target={targetPool} style={{ marginHorizontal: 16 }} />}
                {type !== 'nominators' && !available && (
                    <RestrictedPoolBanner type={type} />
                )}
            </Animated.ScrollView >
        </View>
    );
});

