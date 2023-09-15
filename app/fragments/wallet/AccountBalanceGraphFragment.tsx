import { format } from "date-fns";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo } from "react";
import { Platform, TextInput, View, Text, TextInputProps, ScrollView } from "react-native";
import { GraphPoint, LineGraph } from "react-native-graph";
import Animated, { useAnimatedProps, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fromNano, toNano } from "@ton/core";
import { AndroidToolbar } from "../../components/topbar/AndroidToolbar";
import { CloseButton } from "../../components/CloseButton";
import { RoundButton } from "../../components/RoundButton";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { formatDate } from "../../utils/dates";
import { formatCurrency } from "../../utils/formatCurrency";
import { getSixDigitHex } from "../../utils/getSixDigitHex";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useTheme } from '../../engine/hooks/useTheme';
import { useAccountBalanceChart } from '../../engine/hooks/useAccountBalanceChart';
import { useAccountLite } from '../../engine/hooks/useAccountLite';
import { usePrice } from '../../engine/hooks/usePrice';
import { useNetwork } from '../../engine/hooks/useNetwork';
import { useSelectedAccount } from '../../engine/hooks/useSelectedAccount';

const AnimatedText = Animated.createAnimatedComponent(TextInput);

export const AccountBalanceGraphFragment = fragment(() => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const selected = useSelectedAccount();
    const account = useAccountLite(selected.addressString);
    const balanceChart = useAccountBalanceChart();
    // const last = engine.persistence.fullAccounts.item(engine.address).value?.last;

    const points: GraphPoint[] = useMemo(() => {
        const temp = (balanceChart?.chart || []).map((p: any) => {
            return {
                value: parseFloat(fromNano(p.balance)),
                date: new Date(p.ts)
            }
        });

        // TODO
        // if (account && last) {
        //     const latest = engine.transactions.get(engine.address, last.lt.toString(10));

        //     if (latest && (latest.time * 1000 > temp[temp.length - 1].date.getTime())) {
        //         temp.push({
        //             value: parseFloat(fromNano(account.balance)),
        //             date: new Date(account.transactions[0].time * 1000)
        //         });
        //     }
        // }

        return temp;
    }, [balanceChart, account]);

    const [price, currency] = usePrice();

    const rate = useMemo(() => {
        return price ? price.price.usd * price.price.rates[currency] : 0;
    }, [price, currency]);

    const balance = useMemo(() => {
        return fromNano(account?.balance || toNano('0'));
    }, [account]);

    const balanceShared = useSharedValue(balance);
    const pointerDate = useSharedValue('');
    const priceShared = useSharedValue(`${formatCurrency((parseFloat(balance) * rate).toFixed(2), currency)}`);

    useEffect(() => {
        balanceShared.value = parseFloat(balance).toFixed(2);
        priceShared.value = `${formatCurrency((parseFloat(balance) * rate).toFixed(2), currency)}`;
    }, [balance, rate]);

    const onPointSelected = useCallback(
        (point: GraphPoint) => {
            balanceShared.value = point.value.toFixed(2);
            priceShared.value = `${formatCurrency((parseFloat(point.value.toFixed(2)) * rate).toFixed(2), currency)}`;
            pointerDate.value = `${formatDate(Math.floor(point.date.getTime() / 1000), 'dd MMM')}`;
        },
        [rate],
    );

    const onGraphGestureEnded = useCallback(() => {
        balanceShared.value = parseFloat(balance).toFixed(2);
        priceShared.value = `${formatCurrency((parseFloat(balance) * rate).toFixed(2), currency)}`;
        pointerDate.value = ''
    }, [balance, rate]);

    const animatedTonProps = useAnimatedProps(() => {
        return {
            text: `${balanceShared.value} TON`,
        };
    });

    const animatedPriceProps = useAnimatedProps(() => {
        return {
            text: `${priceShared.value}`,
        };
    });

    const animatedPointerProps = useAnimatedProps(() => {
        return {
            text: `${pointerDate.value}`,
        };
    });

    const close = useCallback(() => navigation.goBack(), []);

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar pageTitle={t('common.balance')} />
            {Platform.OS === 'ios' && (
                <View style={{
                    marginTop: 17,
                    height: 32
                }}>
                    <Text style={{
                        fontWeight: '600',
                        marginLeft: 0,
                        fontSize: 17,
                        textAlign: 'center'
                    }}>
                        {t('common.balance')}
                    </Text>
                </View>
            )}
            <ScrollView>
                <View style={{
                    marginHorizontal: 16
                }}>
                    <Text style={[{
                        fontWeight: '600',
                        fontSize: 14, marginTop: 16
                    }]}>
                        {t('common.balance')}
                    </Text>
                    <AnimatedText
                        animatedProps={animatedTonProps as Partial<Animated.AnimateProps<TextInputProps>>}
                        style={{
                            fontSize: 30,
                            color: theme.textColor,
                            marginRight: 8,
                            fontWeight: '800',
                            height: 40,
                            marginTop: 2
                        }}
                        editable={false}
                    />
                    {(price && !isTestnet) && (
                        <View style={[{
                            backgroundColor: theme.accent,
                            borderRadius: 9,
                            height: 24,
                            alignSelf: 'flex-start',
                            justifyContent: 'center',
                            alignItems: 'flex-start',
                            paddingVertical: 4, paddingHorizontal: 8,
                            marginTop: 6
                        }]}>
                            <AnimatedText
                                animatedProps={animatedPriceProps as Partial<Animated.AnimateProps<TextInputProps>>}
                                style={{
                                    height: 40,
                                    marginTop: 2,
                                    color: 'white',
                                    fontSize: 14,
                                    fontWeight: '600',
                                    textAlign: "center",
                                    lineHeight: 16
                                }}
                                editable={false}
                            />
                        </View>
                    )}
                </View>
                {points.length > 0 && (
                    <View>
                        <LineGraph
                            style={[{
                                alignSelf: 'center',
                                width: '100%', aspectRatio: 1.2,
                                paddingHorizontal: 8,
                            }]}
                            selectionDotShadowColor={theme.accent}
                            verticalPadding={32}
                            lineThickness={5}
                            animated={true}
                            color={theme.accent}
                            points={points}
                            enablePanGesture={true}
                            enableFadeInMask={true}
                            gradientFillColors={[
                                `${getSixDigitHex(theme.accent)}00`,
                                `${getSixDigitHex(theme.accent)}ff`,
                                `${getSixDigitHex(theme.accent)}33`,
                                `${getSixDigitHex(theme.accent)}33`,
                                `${getSixDigitHex(theme.accent)}00`,
                            ]}
                            horizontalPadding={2}
                            onPointSelected={onPointSelected}
                            onGestureEnd={onGraphGestureEnded}
                            indicatorPulsating={false}
                            TopAxisLabel={() => <AnimatedText
                                animatedProps={animatedPointerProps as Partial<Animated.AnimateProps<TextInputProps>>}
                                style={{
                                    height: 40,
                                    marginTop: 2,
                                    color: theme.textColor,
                                    fontSize: 14,
                                    fontWeight: '600',
                                    textAlign: "center",
                                    lineHeight: 16
                                }}
                            />}
                        />
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            marginHorizontal: 16
                        }}>
                            <Text style={{
                                fontWeight: '600',
                                fontSize: 14, marginTop: 4
                            }}>
                                {formatDate(Math.floor(points[0].date.getTime() / 1000), 'dd MMM')}
                            </Text>
                            <Text style={{
                                fontWeight: '600',
                                fontSize: 14, marginTop: 4
                            }}>
                                {formatDate(Math.floor(points[points.length - 1].date.getTime() / 1000), 'dd MMM')}
                            </Text>
                        </View>
                    </View>
                )}
            </ScrollView>
            <View style={{
                flexDirection: 'row',
                alignItems: 'center', justifyContent: 'center',
                paddingBottom: safeArea.bottom, paddingHorizontal: 16
            }}>
                <RoundButton
                    title={t('common.close')}
                    display={"secondary"}
                    size={"large"}
                    style={{ width: '100%' }}
                    onPress={close}
                />
            </View>
            {Platform.OS === 'ios' && (
                <CloseButton
                    style={{ position: 'absolute', top: 12, right: 10 }}
                    onPress={close}
                />
            )}
        </View>
    );
});