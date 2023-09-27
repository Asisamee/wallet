import React, { useMemo } from "react";
import { BN } from "bn.js";
import { useEngine } from "../../engine/Engine";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { View, Text, StyleProp, ViewStyle, TextStyle, Pressable } from "react-native";
import { PriceComponent } from "../PriceComponent";
import { t } from "../../i18n/t";
import { ValueComponent } from "../ValueComponent";
import { useAppConfig } from "../../utils/AppConfigContext";
import { ProductBanner } from "./ProductBanner";

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

export const StakingProductComponent = React.memo(() => {
    const { Theme, AppConfig } = useAppConfig();
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const staking = engine.products.whalesStakingPools.useFull();
    const cards = engine.products.holders.useCards();
    const showJoin = staking.total.eq(new BN(0));

    const apy = engine.products.whalesStakingPools.useStakingApy()?.apy;
    const apyWithFee = useMemo(() => {
        if (!!apy) {
            return (apy - apy * (5 / 100)).toFixed(2)
        }
    }, [apy]);

    if (!showJoin) {
        return (
            <Pressable
                onPress={() => navigation.navigate('StakingPools')}
                style={({ pressed }) => {
                    return [style, { opacity: pressed ? 0.5 : 1, backgroundColor: Theme.surfaceSecondary }]
                }}
            >
                <View style={{ alignSelf: 'stretch', flexDirection: 'row' }}>
                    <View style={icStyle}>
                        <View style={{ backgroundColor: Theme.accent, ...icStyleInner }}>
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
                                style={{ color: Theme.textPrimary, ...titleStyle }}
                                ellipsizeMode={'tail'}
                                numberOfLines={1}
                            >
                                {t('products.staking.title')}
                            </Text>
                            <Text style={{ color: Theme.textSecondary, ...subtitleStyle, flexShrink: 1 }} numberOfLines={1} ellipsizeMode="tail">
                                {t("products.staking.subtitle.joined", { apy: apyWithFee ?? '8' })}
                            </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ color: Theme.textPrimary, ...titleStyle }}>
                                <ValueComponent
                                    value={staking.total}
                                    precision={3}
                                />
                                {' TON'}
                            </Text>
                            <PriceComponent
                                amount={staking.total}
                                style={{
                                    backgroundColor: Theme.transparent,
                                    paddingHorizontal: 0, paddingVertical: 0,
                                    alignSelf: 'flex-end',
                                    height: undefined
                                }}
                                textStyle={{ color: Theme.textSecondary, ...subtitleStyle }}
                            />
                        </View>
                    </View>
                </View>
            </Pressable>
        );
    }

    if (cards.length > 0) {
        return null;
    }

    return (
        <ProductBanner
            onPress={() => navigation.navigate('StakingPools')}
            title={t('products.staking.title')}
            subtitle={AppConfig.isTestnet ? t('products.staking.subtitle.devPromo') : t("products.staking.subtitle.join", { apy: apyWithFee ?? '8' })}
            illustration={require('@assets/banner-staking.png')}
        />
    );
})