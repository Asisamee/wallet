import { useKeyboard } from "@react-native-community/hooks";
import { StatusBar, setStatusBarStyle } from "expo-status-bar";
import React, { useCallback, useMemo, useState } from "react";
import { Platform, View, Text, ScrollView, KeyboardAvoidingView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ATextInput } from "../../components/ATextInput";
import { RoundButton } from "../../components/RoundButton";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { parseAmountToValidBN } from "../../utils/parseAmount";
import { useParams } from "../../utils/useParams";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { formatCurrency } from "../../utils/formatCurrency";
import { ValueComponent } from "../../components/ValueComponent";
import { TransferAction } from "./StakingTransferFragment";
import { usePrice, useStakingPool, useTheme } from "../../engine/hooks";
import { Address, fromNano } from "@ton/core";
import { useLedgerTransport } from "../ledger/components/TransportContext";
import { StakingCalcComponent } from "../../components/staking/StakingCalcComponent";

export const StakingCalculatorFragment = fragment(() => {
    const theme = useTheme();
    const params = useParams<{ target: Address }>();
    const navigation = useTypedNavigation();
    const keyboard = useKeyboard();
    const safeArea = useSafeAreaInsets();
    const [price, currency] = usePrice();
    const ledgerContext = useLedgerTransport();
    const route = useRoute();

    const isLedger = route.name === 'LedgerStakingCalculator';

    const ledgerAddress = useMemo(() => {
        if (!isLedger || !ledgerContext?.addr?.address) return;
        try {
            return Address.parse(ledgerContext?.addr?.address);
        } catch { }
    }, [ledgerContext?.addr?.address]);

    const pool = useStakingPool(params.target, ledgerAddress);

    const [amount, setAmount] = useState(pool?.member?.balance ? fromNano(pool.member.balance) : '');

    const onChangeAmount = useCallback((value: string) => {
        let amount = value;
        if (amount.length <= 10) {
            setAmount(amount);
            return;
        }

        if (amount.includes(',')) {
            amount = amount.replace(',', '.');
            const parts = amount.split('.');
            if (parts.length === 2) {
                if (parts[0].length <= 10) {
                    setAmount(amount);
                } else {
                    setAmount((prev) => prev);
                }
            }
        }

        if (amount.includes('.')) {
            const parts = amount.split('.');
            if (parts.length === 2) {
                if (parts[0].length <= 10) {
                    setAmount(amount);
                } else {
                    setAmount((prev) => prev);
                }
            }
        }
    }, [setAmount]);

    const priceText = useMemo(() => {
        if (!amount) {
            return;
        }
        const validAmount = parseAmountToValidBN(amount);
        const isNeg = validAmount < 0n;
        const abs = isNeg ? -validAmount : validAmount;

        return formatCurrency(
            (parseFloat(fromNano(validAmount)) * (price ? price?.price.usd * price.price.rates[currency] : 0)).toFixed(2),
            currency,
            isNeg
        );
    }, [amount, price, currency]);

    useFocusEffect(() => {
        setTimeout(() => {
            setStatusBarStyle(
                Platform.OS === 'ios'
                    ? 'light'
                    : theme.style === 'dark' ? 'light' : 'dark'
            )
        }, 10);
    });

    return (
        <>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <ScreenHeader
                title={t('products.staking.calc.text')}
                onClosePressed={navigation.goBack}
            />
            <ScrollView
                style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', }}
                contentInset={{ bottom: keyboard.keyboardShown ? (keyboard.keyboardHeight - safeArea.bottom) : 0.1 /* Some weird bug on iOS */, top: 0.1 /* Some weird bug on iOS */ }}
                contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 16 }}
                contentInsetAdjustmentBehavior="never"
                keyboardShouldPersistTaps="always"
                automaticallyAdjustContentInsets={false}
                scrollEventThrottle={16}
            >
                <View style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', flexDirection: 'column' }}>
                    <View
                        style={{
                            marginVertical: 16,
                            backgroundColor: theme.surfaceSecondary,
                            borderRadius: 20,
                            justifyContent: 'center',
                            padding: 20
                        }}
                    >
                        <View style={{
                            flexDirection: 'row',
                            marginBottom: 12,
                            justifyContent: 'space-between'
                        }}>
                            <Text style={{
                                fontWeight: '400',
                                fontSize: 15, lineHeight: 20,
                                color: theme.textSecondary,
                            }}>
                                {`${t('common.balance')}: `}
                                <ValueComponent
                                    precision={4}
                                    value={pool?.member?.balance || 0n}
                                    centFontStyle={{ opacity: 0.5 }}
                                />
                            </Text>
                        </View>
                        <ATextInput
                            index={0}
                            value={amount}
                            onValueChange={setAmount}
                            keyboardType={'numeric'}
                            style={{
                                backgroundColor: theme.background,
                                paddingHorizontal: 16, paddingVertical: 14,
                                borderRadius: 16,
                            }}
                            inputStyle={{
                                fontSize: 17, fontWeight: '400',
                                textAlignVertical: 'top',
                                color: theme.textPrimary,
                                width: 'auto',
                                flexShrink: 1
                            }}
                            suffux={priceText}
                            hideClearButton
                            prefix={'TON'}
                        />
                    </View>
                    {!!pool && (
                        <StakingCalcComponent
                            amount={amount}
                            pool={pool}
                        />
                    )}
                </View>
            </ScrollView>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'position' : undefined}
                style={{
                    marginHorizontal: 16, marginTop: 16,
                    marginBottom: safeArea.bottom + 16,
                }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 16}
            >
                <RoundButton
                    title={t('products.staking.calc.goToTopUp')}
                    onPress={() => {
                        navigation.replace(
                            isLedger ? 'LedgerStakingTransfer' : 'StakingTransfer',
                            {
                                target: params.target,
                                amount: (pool?.params.minStake ?? 0n) + (pool?.params?.receiptPrice ?? 0n) + (pool?.params?.depositFee ?? 0n),
                                lockAddress: true,
                                lockComment: true,
                                action: 'top_up' as TransferAction,
                            }
                        )
                    }}
                />
            </KeyboardAvoidingView>
        </>

    );
});