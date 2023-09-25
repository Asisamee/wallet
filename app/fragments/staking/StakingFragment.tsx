import React, { useCallback, useMemo, useState } from "react";
import { View, Text, Platform, useWindowDimensions, Image, Pressable, TouchableHighlight } from "react-native";
import Animated, { SensorType, useAnimatedSensor, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Address, toNano } from "ton";
import { PriceComponent } from "../../components/PriceComponent";
import { ValueComponent } from "../../components/ValueComponent";
import { WalletAddress } from "../../components/WalletAddress";
import { useEngine } from "../../engine/Engine";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { StakingCycle } from "../../components/staking/StakingCycle";
import { StakingPendingComponent } from "../../components/staking/StakingPendingComponent";
import { openWithInApp } from "../../utils/openWithInApp";
import { useParams } from "../../utils/useParams";
import { TransferAction } from "./StakingTransferFragment";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { RestrictedPoolBanner } from "../../components/staking/RestrictedPoolBanner";
import { KnownPools } from "../../utils/KnownPools";
import { useAppConfig } from "../../utils/AppConfigContext";
import { StakingPoolType } from "./StakingPoolsFragment";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { useLedgerTransport } from "../ledger/components/LedgerTransportProvider";
import { ScreenHeader } from "../../components/ScreenHeader";
import { setStatusBarStyle } from "expo-status-bar";
import { StakingAnalyticsComponent } from "../../components/staking/StakingAnalyticsComponent";
import BN from "bn.js";

import InfoIcon from '@assets/ic-info-staking.svg';

export const StakingFragment = fragment(() => {
    const { Theme, AppConfig } = useAppConfig();
    const safeArea = useSafeAreaInsets();
    const initParams = useParams<{ backToHome?: boolean, pool: string }>();
    const [params, setParams] = useState(initParams);
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
    const member = pool?.member;
    const stakingCurrent = engine.products.whalesStakingPools.useFull();
    const ledgerStaking = engine.products.whalesStakingPools.useStaking(ledgerAddress);
    const staking = isLedger ? ledgerStaking : stakingCurrent;

    const animSensor = useAnimatedSensor(SensorType.GYROSCOPE, { interval: 100 });

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: withTiming(animSensor.sensor.value.y * 80) },
                { translateY: withTiming(animSensor.sensor.value.x * 80) },
            ]
        }
    });

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

    const openMoreInfo = useCallback(() => openWithInApp(AppConfig.isTestnet ? 'https://test.tonwhales.com/staking' : 'https://tonwhales.com/staking'), [AppConfig.isTestnet]);
    const navigateToCurrencySettings = useCallback(() => navigation.navigate('Currency'), []);
    const openPoolSelector = useCallback(() => {
        navigation.navigate(
            isLedger ? 'StakingPoolSelectorLedger' : 'StakingPoolSelector',
            {
                current: targetPool,
                callback: (pool: Address) => {
                    setParams((prev) => ({ ...prev, pool: pool.toFriendly({ testOnly: AppConfig.isTestnet }) }));
                }
            },
        )
    }, [isLedger, targetPool, setParams]);

    useFocusEffect(() => {
        setTimeout(() => {
            setStatusBarStyle(Theme.style === 'dark' ? 'light' : 'dark');
        }, 10);
    });

    return (
        <View style={{ flexGrow: 1 }}>
            <ScreenHeader
                style={{ marginTop: 32, paddingLeft: 16 }}
                onBackPressed={navigation.goBack}
                rightButton={
                    <Pressable
                        onPress={openMoreInfo}
                        style={({ pressed }) => ({
                            opacity: pressed ? 0.5 : 1,
                            position: 'absolute',
                            bottom: 12, right: 16
                        })}
                    >
                        <InfoIcon height={26} width={26} style={{ height: 26, width: 26 }} />
                    </Pressable>
                }
                titleComponent={
                    <Pressable
                        style={({ pressed }) => ({
                            alignItems: 'center',
                            opacity: pressed ? 0.5 : 1
                        })}
                        onPress={openPoolSelector}
                    >
                        <Text style={{
                            fontSize: 17, lineHeight: 24,
                            color: Theme.textPrimary,
                            fontWeight: '500',
                        }}>
                            {KnownPools(AppConfig.isTestnet)[params.pool].name}
                        </Text>
                    </Pressable>
                }
            />
            <Animated.ScrollView
                contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16 }}
                style={[{ flexGrow: 1 }]}
                contentInset={{ bottom: safeArea.bottom + 112 }}
                scrollEventThrottle={16}
            >
                <View
                    style={{
                        marginVertical: 16,
                        backgroundColor: Theme.cardBackground,
                        borderRadius: 20,
                        paddingHorizontal: 20, paddingVertical: 16,
                        overflow: 'hidden'
                    }}
                    collapsable={false}
                >
                    <Text
                        style={{
                            fontSize: 15, lineHeight: 20,
                            color: Theme.textThird,
                            opacity: 0.7,
                        }}
                    >
                        {t('products.staking.balance')}
                    </Text>
                    <Text style={{ fontSize: 27, color: Theme.textThird, fontWeight: '600', marginTop: 14 }}>
                        <ValueComponent
                            value={member?.balance || new BN(0)}
                            precision={4}
                            centFontStyle={{ opacity: 0.5 }}
                        />
                        <Text style={{
                            fontSize: 17,
                            lineHeight: Platform.OS === 'ios' ? 24 : undefined,
                            color: Theme.textThird,
                            marginRight: 8,
                            fontWeight: '500',
                            opacity: 0.5
                        }}>{' TON'}</Text>
                    </Text>
                    <Animated.View
                        style={[
                            {
                                position: 'absolute', top: 0, left: '50%',
                                marginTop: -20, marginLeft: -20,
                                height: 400, width: 400,
                                overflow: 'hidden'
                            },
                            animatedStyle
                        ]}
                        pointerEvents={'none'}
                    >
                        <Image
                            source={require('@assets/shine-blur.webp')}
                            style={{ height: 400, width: 400 }}
                        />
                    </Animated.View>
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
                                textStyle={{ color: Theme.textThird }}
                            />
                            <PriceComponent
                                showSign
                                amount={toNano(1)}
                                style={{ backgroundColor: 'rgba(255,255,255, .1)', marginLeft: 10 }}
                                textStyle={{ color: Theme.textThird }}
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
                            color: Theme.textSecondary,
                            fontWeight: '400',
                            fontFamily: undefined
                        }}
                        limitActions
                    />
                </View>
                <View
                    style={{
                        flexDirection: 'row',
                        backgroundColor: Theme.surfaceSecondary,
                        borderRadius: 20,
                        marginBottom: 16, marginTop: 32
                    }}
                    collapsable={false}
                >
                    <View style={{ flexGrow: 1, flexBasis: 0, marginRight: 7, borderRadius: 14, padding: 20 }}>
                        <Pressable
                            onPress={onTopUp}
                            disabled={!available}
                            style={({ pressed }) => {
                                return {
                                    opacity: (pressed || !available) ? 0.5 : 1,
                                    borderRadius: 14, flex: 1, paddingVertical: 10,
                                    marginHorizontal: 10
                                }
                            }}
                        >
                            <View style={{ justifyContent: 'center', alignItems: 'center', borderRadius: 14 }}>
                                <View style={{
                                    backgroundColor: Theme.accent,
                                    width: 32, height: 32,
                                    borderRadius: 16,
                                    alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Image source={require('@assets/ic-plus.png')} />
                                </View>
                                <Text
                                    style={{
                                        fontSize: 15,
                                        color: Theme.textPrimary,
                                        marginTop: 6,
                                        fontWeight: '400'
                                    }}>
                                    {t('products.staking.actions.top_up')}
                                </Text>
                            </View>
                        </Pressable>
                    </View>
                    <View style={{ flexGrow: 1, flexBasis: 0, borderRadius: 14, padding: 20 }}>
                        <Pressable
                            onPress={onUnstake}
                            disabled={
                                (member?.balance || new BN(0))
                                    .add(member?.pendingWithdraw || new BN(0))
                                    .add(member?.withdraw || new BN(0))
                                    .eq(new BN(0))
                            }
                            style={({ pressed }) => ({
                                opacity:
                                    ((member?.balance || new BN(0))
                                        .add(member?.pendingWithdraw || new BN(0))
                                        .add(member?.withdraw || new BN(0))
                                        .eq(new BN(0))
                                        || pressed
                                    ) ? 0.5 : 1,
                                borderRadius: 14, flex: 1, paddingVertical: 10,
                                marginHorizontal: 4
                            })}
                        >
                            <View style={{ justifyContent: 'center', alignItems: 'center', borderRadius: 14 }}>
                                <View style={{
                                    backgroundColor: Theme.accent,
                                    width: 32, height: 32,
                                    borderRadius: 16,
                                    alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Image source={require('@assets/ic_receive.png')} />
                                </View>
                                <Text
                                    style={{
                                        fontSize: 15,
                                        color: Theme.textPrimary,
                                        marginTop: 6,
                                        fontWeight: '400'
                                    }}
                                >
                                    {t('products.staking.actions.withdraw')}
                                </Text>
                            </View>
                        </Pressable>
                    </View>
                    <View style={{ flexGrow: 1, flexBasis: 0, borderRadius: 14, padding: 20 }}>
                        <Pressable
                            onPress={() => navigation.navigateStakingCalculator({ target: targetPool })}
                            style={({ pressed }) => ({
                                opacity: pressed ? 0.5 : 1,
                                borderRadius: 14, flex: 1, paddingVertical: 10,
                                marginHorizontal: 4
                            })}
                        >
                            <View style={{ justifyContent: 'center', alignItems: 'center', borderRadius: 14 }}>
                                <View style={{
                                    backgroundColor: Theme.accent,
                                    width: 32, height: 32,
                                    borderRadius: 16,
                                    alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Image source={require('@assets/ic-staking-calc.png')} />
                                </View>
                                <Text
                                    style={{
                                        fontSize: 15,
                                        color: Theme.textPrimary,
                                        marginTop: 6,
                                        fontWeight: '400'
                                    }}
                                >
                                    {t('products.staking.actions.calc')}
                                </Text>
                            </View>
                        </Pressable>
                    </View>
                </View>
                <StakingPendingComponent
                    target={targetPool}
                    member={member}
                />
                {!!pool && (
                    <StakingCycle
                        stakeUntil={pool.params.stakeUntil}
                        locked={pool.params.locked}
                        style={{ marginBottom: 16 }}
                    />
                )}
                {(type !== 'nominators' && !available) && (
                    <RestrictedPoolBanner type={type} />
                )}
                {AppConfig.isTestnet && (
                    <RestrictedPoolBanner type={'team'} />
                )}
                <StakingAnalyticsComponent pool={targetPool} />
                <View style={Platform.select({ android: { height: safeArea.bottom + 186 } })} />
            </Animated.ScrollView >
        </View>
    );
});

