import React, { memo, useMemo } from "react";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { View, Text, StyleProp, ViewStyle, TextStyle, Pressable } from "react-native";
import { t } from "../../i18n/t";
import { useStakingActive, useStakingApy, useTheme } from "../../engine/hooks";
import { StakingPool } from "../../fragments/staking/components/StakingPool";
import { ItemDivider } from "../ItemDivider";

import StakingIcon from '@assets/ic-staking.svg';

const style: StyleProp<ViewStyle> = {
    height: 84,
    borderRadius: 20,
    marginVertical: 4,
    padding: 20
}

const icStyle: StyleProp<ViewStyle> = {
    width: 46, height: 46,
    marginRight: 12
}

const icStyleInner: StyleProp<ViewStyle> = {
    width: 46, height: 46,
    borderRadius: 23,
    alignItems: 'center', justifyContent: 'center'
}

const titleStyle: StyleProp<TextStyle> = {
    fontSize: 17, fontWeight: '600',
    lineHeight: 24
}

const subtitleStyle: StyleProp<TextStyle> = {
    fontSize: 15, fontWeight: '400',
    lineHeight: 20
}

export const StakingProductComponent = memo(() => {
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const active = useStakingActive();

    const apy = useStakingApy()?.apy;
    const apyWithFee = useMemo(() => {
        if (!!apy) {
            return (apy - apy * (5 / 100)).toFixed(2)
        }
    }, [apy]);

    return (
        <View style={{
            backgroundColor: theme.surfaceOnBg,
            borderRadius: 20,
            marginHorizontal: 16,
            marginBottom: 16
        }}>
            {!!active && active.map((p, i) => (
                <View key={`active-${p.address.toString()}`}>
                    <StakingPool
                        address={p.address}
                        balance={p.balance}
                        style={{
                            backgroundColor: theme.surfaceOnBg,
                            paddingHorizontal: 20
                        }}
                        hideCycle
                    />
                    <ItemDivider
                        marginVertical={0}
                    />
                </View>
            ))}
            <Pressable
                onPress={() => navigation.navigate('StakingPools')}
                style={({ pressed }) => {
                    return [style, { opacity: pressed ? 0.5 : 1, backgroundColor: theme.surfaceOnBg }]
                }}
            >
                <View style={{ alignSelf: 'stretch', flexDirection: 'row' }}>
                    <View style={icStyle}>
                        <View style={{ backgroundColor: theme.accent, ...icStyleInner }}>
                            <StakingIcon width={32} height={32} color={'white'} />
                        </View>
                    </View>
                    <View style={{
                        flexDirection: 'row',
                        flexGrow: 1, flexShrink: 1, alignItems: 'center',
                        justifyContent: 'space-between',
                        overflow: 'hidden'
                    }}>
                        <View style={{ flexGrow: 1, flexShrink: 1 }}>
                            <Text
                                style={{ color: theme.textPrimary, ...titleStyle }}
                                ellipsizeMode={'tail'}
                                numberOfLines={1}
                            >
                                {t('products.staking.title')}
                            </Text>
                            <Text style={{ color: theme.textSecondary, ...subtitleStyle, flexShrink: 1 }} numberOfLines={1} ellipsizeMode="tail">
                                {t("products.staking.subtitle.join", { apy: apyWithFee ?? '8' })}
                            </Text>
                        </View>
                    </View>
                </View>
            </Pressable>
        </View>
    );
})