import BN from 'bn.js';
import * as React from 'react';
import { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { Address } from 'ton';
import { KnownJettonMasters } from '../../../secure/KnownWallets';
import { TypedNavigation } from '../../../utils/useTypedNavigation';
import { confirmJettonAction } from '../../AccountsFragment';
import { AnimatedProductButton } from './AnimatedProductButton';
import { useAppConfig } from '../../../utils/AppConfigContext';
import { onJettonDisabled } from '../../../engine/effects/markJettonDisabled';

export const JettonProduct = React.memo((props: {
    navigation: TypedNavigation,
    jetton: {
        master: Address;
        wallet: Address;
        name: string;
        description: string;
        symbol: string;
        balance: BN;
        icon: string | null;
        decimals: number | null;
    },
    onPress?: () => void
    onLongPress?: () => void
}) => {
    let balance = props.jetton.balance;
    const { AppConfig } = useAppConfig();

    const isKnown = !!KnownJettonMasters(AppConfig.isTestnet)[props.jetton.master.toFriendly({ testOnly: AppConfig.isTestnet })];

    const promptDisable = React.useCallback(
        async () => {
            const c = await confirmJettonAction(true, props.jetton.symbol);
            if (c) onJettonDisabled(props.jetton.master);
        },
        [],
    );

    return (
        <AnimatedProductButton
            entering={FadeInUp}
            exiting={FadeOutDown}
            key={props.jetton.master.toFriendly()}
            name={props.jetton.name}
            subtitle={props.jetton.description}
            image={props.jetton.icon ? props.jetton.icon : undefined}
            value={balance}
            decimals={props.jetton.decimals}
            symbol={props.jetton.symbol}
            onPress={() => {
                if (props.onPress) {
                    props.onPress();
                    return;
                }
                props.navigation.navigateSimpleTransfer({
                    amount: null,
                    target: null,
                    comment: null,
                    jetton: props.jetton.wallet,
                    stateInit: null,
                    job: null,
                    callback: null
                })
            }}
            onLongPress={props.onLongPress ? props.onLongPress : promptDisable}
            style={{ marginVertical: 4 }}
            known={isKnown}
        />
    );
});