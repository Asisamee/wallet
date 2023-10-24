import React from "react";
import { Alert, Platform, View, Text, ScrollView, Pressable } from "react-native";
import { Address, beginCell, Cell, fromNano, external, SendMode, storeMessage, toNano, MessageRelaxed, internal, loadStateInit, comment } from "@ton/core";
import { MixpanelEvent, trackEvent } from "../../../analytics/mixpanel";
import { contractFromPublicKey } from "../../../engine/contractFromPublicKey";
import { ContractMetadata } from "../../../engine/metadata/Metadata";
import { LocalizedResources } from "../../../i18n/schema";
import { t } from "../../../i18n/t";
import { KnownWallet, KnownWallets } from "../../../secure/KnownWallets";
import { getCurrentAddress } from "../../../storage/appState";
import { WalletKeys } from "../../../storage/walletKeys";
import { warn } from "../../../utils/log";
import { backoff } from "../../../utils/time";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { ItemAddress } from "../../../components/ItemAddress";
import { ItemCollapsible } from "../../../components/ItemCollapsible";
import { ItemDivider } from "../../../components/ItemDivider";
import { ItemGroup } from "../../../components/ItemGroup";
import { ItemLarge } from "../../../components/ItemLarge";
import { PriceComponent } from "../../../components/PriceComponent";
import { RoundButton } from "../../../components/RoundButton";
import { TransferComponent } from "../../../components/transactions/TransferComponent";
import { WImage } from "../../../components/WImage";
import { formatCurrency } from "../../../utils/formatCurrency";
import { fromBnWithDecimals } from "../../../utils/withDecimals";
import { useTheme } from '../../../engine/hooks/useTheme';
import { useKeysAuth } from "../../../components/secure/AuthWalletKeys";
import { getJettonMaster } from '../../../engine/getters/getJettonMaster';
import { useClient4 } from '../../../engine/hooks/useClient4';
import { parseBody } from '../../../engine/legacy/transactions/parseWalletTransaction';
import { parseMessageBody } from '../../../engine/legacy/transactions/parseMessageBody';
import { resolveOperation } from '../../../engine/legacy/transactions/resolveOperation';
import { useNetwork } from '../../../engine/hooks/useNetwork';
import { usePrice } from '../../../engine/hooks/usePrice';
import { useSelectedAccount } from '../../../engine/hooks/useSelectedAccount';
import { fetchSeqno } from '../../../engine/api/fetchSeqno';
import { getLastBlock } from '../../../engine/accountWatcher';
import { JettonMasterState } from '../../../engine/metadata/fetchJettonMasterContent';
import { getAccountLite } from "../../../engine/getters/getAccountLite";
import { useCommitCommand } from "../../../engine/effects/dapps/useCommitCommand";

import Question from '../../../../assets/ic_question.svg';
import TonSign from '../../../../assets/ic_ton_sign.svg';
import LottieView from 'lottie-react-native';
import SignLock from '../../../../assets/ic_sign_lock.svg';

type Props = {
    text: string | null,
    job: string | null,
    order: {
        messages: {
            addr: {
                address: Address;
                balance: bigint,
                active: boolean
            },
            metadata: ContractMetadata,
            restricted: boolean,
            amount: bigint,
            amountAll: boolean,
            payload: Cell | null,
            stateInit: Cell | null,
        }[],
        app?: {
            domain: string,
            title: string
        }
    },
    fees: bigint,
    callback: ((ok: boolean, result: Cell | null) => void) | null,
    back?: number,
    totalAmount: bigint
}

export const TransferBatch = React.memo((props: Props) => {
    const authContext = useKeysAuth();
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();
    const client = useClient4(isTestnet);
    const selected = useSelectedAccount();
    const commitCommand = useCommitCommand();
    const [price, currency] = usePrice();
    const {
        text,
        order,
        job,
        fees,
        callback,
        back,
        totalAmount
    } = props;

    const { internals, totalJettons, gas } = React.useMemo(() => {
        const temp = [];
        const totalJettons = new Map<string, { jettonMaster: JettonMasterState, jettonAmount: bigint, gas: bigint }>();
        let gas = {
            total: BigInt(0),
            unusual: false
        };
        for (const message of order.messages) {
            let body = message.payload ? parseBody(message.payload) : null;
            let parsedBody = body && body.type === 'payload' ? parseMessageBody(body.cell) : null;

            // Read jetton master
            let jettonMaster: JettonMasterState | null = null;
            if (message.metadata.jettonWallet) {
                jettonMaster = getJettonMaster(message.metadata.jettonWallet!.master);
            }

            let jettonAmount: bigint | null = null;
            try {
                if (jettonMaster && message.payload) {
                    const temp = message.payload;
                    if (temp) {
                        const parsing = temp.beginParse();
                        parsing.loadUint(32);
                        parsing.loadUint(64);
                        jettonAmount = parsing.loadCoins();
                    }
                }
            } catch (e) {
                console.warn(e);
            }

            if (jettonAmount && jettonMaster && message.metadata.jettonWallet) {
                const addr = message.metadata.jettonWallet?.master.toString({ testOnly: isTestnet });
                const value = totalJettons.get(addr);
                if (!!value) {
                    value.jettonAmount = value.jettonAmount + jettonAmount;
                    totalJettons.set(addr, value);
                } else {
                    totalJettons.set(addr, {
                        jettonMaster,
                        jettonAmount,
                        gas: message.amount
                    });
                }

                gas.total = gas.total + message.amount;

                if (message.amount > toNano('0.2')) {
                    gas.unusual = true;
                }
            }

            // Resolve operation
            let operation = resolveOperation({
                body: body,
                amount: message.amount,
                account: message.addr.address,
                metadata: message.metadata,
                jettonMaster
            });

            // const contact = (engine.products.settings.addressBook.value.contacts ?? {})[operation.address.toString({ testOnly: isTestnet })];
            const friendlyTarget = message.addr.address.toString({ testOnly: isTestnet });
            let known: KnownWallet | undefined = undefined;
            if (KnownWallets(isTestnet)[friendlyTarget]) {
                known = KnownWallets(isTestnet)[friendlyTarget];
            } else if (operation.title) {
                known = { name: operation.title };
            }
            // } else if (!!contact) { // Resolve contact known wallet
            //     known = { name: contact.name }
            // }
            // const isSpam = !!(engine.products.settings.addressBook.value.denyList ?? {})[operation.address.toString({ testOnly: isTestnet })];
            // const spam = !!engine.persistence.serverConfig.item().value?.wallets.spam.find((s) => s === friendlyTarget) || isSpam;
            const spam = false;

            temp.push({
                message,
                operation,
                parsedBody,
                known,
                spam,
                jettonAmount,
                contact: null,
                jettonMaster
            });
        }

        return { internals: temp, totalJettons, gas };
    }, []);

    const jettonsGasAlert = React.useCallback(() => {
        Alert.alert(t('transfer.unusualJettonsGasTitle', { amount: fromNano(gas.total) }),
            t('transfer.unusualJettonsGasMessage'),
            [{ text: t('common.gotIt') }])
    }, [gas]);

    // Tracking
    const success = React.useRef(false);
    React.useEffect(() => {
        if (!success.current) {
            trackEvent(MixpanelEvent.TransferCancel, { order }, isTestnet);
        }
    }, []);


    // Confirmation
    const doSend = React.useCallback(async () => {
        async function confirm(title: LocalizedResources, message?: string) {
            return await new Promise<boolean>(resolve => {
                Alert.alert(t(title), `${message ? message + ' ' : ''}${t('transfer.confirm')}`, [{
                    text: t('common.yes'),
                    style: 'destructive',
                    onPress: () => {
                        resolve(true)
                    }
                }, {
                    text: t('common.no'),
                    onPress: () => {
                        resolve(false);
                    }
                }])
            });
        }

        // Load contract
        const acc = getCurrentAddress();
        const contract = await contractFromPublicKey(acc.publicKey);

        if (!selected) {
            return;
        }

        const messages: MessageRelaxed[] = [];
        for (const i of internals) {
            const target = i.message.addr.address;
            const restricted = i.message.restricted;

            // Check if same address
            if (target.equals(contract.address)) {
                Alert.alert(t('transfer.error.sendingToYourself'));
                return;
            }

            // Check if restricted
            if (restricted) {
                let cont = await confirm('transfer.error.addressCantReceive');
                if (!cont) {
                    return;
                }
            }

            // Check if restricted
            if (restricted) {
                let cont = await confirm('transfer.error.addressCantReceive');
                if (!cont) {
                    return;
                }
            }

            // Check bounce flag
            let bounce = true;
            if (!i.message.addr.active && !i.message.stateInit) {
                bounce = false;
            }

            const internalStateInit = !!i.message.stateInit
                ? loadStateInit(i.message.stateInit.asSlice())
                : null;

            const body = !!order.messages[0].payload
                ? order.messages[0].payload
                : text ? comment(text) : null;

            // Create message
            const msg = internal({
                to: i.message.addr.address,
                value: i.message.amount,
                init: internalStateInit,
                bounce,
                body,
            });

            if (msg) {
                messages.push(msg);
            }
        }

        const account = getAccountLite(selected.addressString);

        // Check amount
        if (account!.balance < totalAmount) {
            Alert.alert(t('transfer.error.notEnoughCoins'));
            return;
        }
        if (totalAmount === 0n) {
            Alert.alert(t('transfer.error.zeroCoins'));
            return;
        }


        // Read key
        let walletKeys: WalletKeys;
        try {
            walletKeys = await authContext.authenticate({ cancelable: true });
        } catch (e) {
            return;
        }


        let seqno = await fetchSeqno(client, await getLastBlock(), selected.address);

        // Create transfer
        let transfer: Cell;
        try {
            transfer = contract.createTransfer({
                seqno: seqno,
                secretKey: walletKeys.keyPair.secretKey,
                sendMode: order.messages[0].amountAll
                    ? SendMode.CARRY_ALL_REMAINING_BALANCE
                    : SendMode.IGNORE_ERRORS | SendMode.PAY_GAS_SEPARATELY,
                messages,
            });
        } catch (e) {
            warn('Failed to create transfer');
            return;
        }

        // Create external message
        const extMessage = external({
            to: contract.address,
            body: transfer,
            init: seqno === 0 ? contract.init : undefined
        });

        let msg = beginCell().store(storeMessage(extMessage)).endCell();

        // Sending transaction
        await backoff('transfer', () => client.sendMessage(msg.toBoc({ idx: false })));

        // Notify job
        if (job) {
            await commitCommand(true, job, transfer);
        }

        // Notify callback
        if (callback) {
            try {
                callback(true, transfer);
            } catch (e) {
                warn(e);
                // Ignore on error
            }
        }

        // Track
        success.current = true;
        trackEvent(MixpanelEvent.Transfer, { order }, isTestnet);

        // Register pending
        // TODO
        // engine.products.main.registerPending({
        //     id: 'pending-' + account.seqno,
        //     lt: null,
        //     fees: fees,
        //     amount: totalAmount.mul(BigInt(-1)),
        //     address: null,
        //     seqno: account.seqno,
        //     kind: 'out',
        //     body: null,
        //     status: 'pending',
        //     time: Math.floor(Date.now() / 1000),
        //     bounced: false,
        //     prev: null,
        //     mentioned: [],
        //     hash: msg.hash(),
        // });

        // Reset stack to root
        if (back && back > 0) {
            for (let i = 0; i < back; i++) {
                navigation.goBack();
            }
        } else {
            navigation.popToTop();
        }
    }, []);

    const anim = React.useRef<LottieView>(null);

    React.useLayoutEffect(() => {
        setTimeout(() => {
            anim.current?.play()
        }, 300);
    }, []);

    return (
        <>
            {!!order.app && (
                <View style={{
                    paddingTop: 12,
                    paddingBottom: 17,
                    paddingHorizontal: Platform.OS === 'ios' ? 40 + 8 : 16,
                }}>
                    <Text style={{
                        textAlign: 'center',
                        fontSize: 14,
                        fontWeight: '600'
                    }}>
                        {t('transfer.requestsToSign', { app: order.app.title })}
                    </Text>
                    <View style={{
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexDirection: 'row',
                        marginTop: 6
                    }}>
                        <SignLock />
                        <Text style={{
                            textAlign: 'center',
                            fontSize: 14,
                            fontWeight: '400',
                            marginLeft: 4,
                            color: theme.labelSecondary
                        }}>
                            {order.app.domain}
                        </Text>
                    </View>
                </View>
            )}
            <ScrollView
                style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', }}
                contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 16 }}
                contentInsetAdjustmentBehavior="never"
                keyboardShouldPersistTaps="always"
                keyboardDismissMode="none"
                automaticallyAdjustContentInsets={false}
                alwaysBounceVertical={false}
            >
                <View style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', flexDirection: 'column' }}>
                    <View style={{ justifyContent: 'center', alignItems: 'center', marginTop: 28 }}>
                        <LottieView
                            ref={anim}
                            source={require('../../../../assets/animations/sign.json')}
                            style={{ width: 120, height: 120 }}
                            autoPlay={false}
                            loop={false}
                        />
                        {Platform.OS === 'ios' && (
                            <Text style={{
                                fontWeight: '700',
                                fontSize: 30,
                                textAlign: 'center'
                            }}>
                                {order.messages.length > 1 ? t('transfer.confirmManyTitle', { count: order.messages.length }) : t('transfer.confirmTitle')}
                            </Text>
                        )}
                    </View>
                    <ItemGroup style={{ marginBottom: 16, marginTop: 30 }}>
                        <Text style={{
                            fontWeight: '700',
                            fontSize: 20,
                            color: theme.textColor,
                            marginHorizontal: 16,
                            marginVertical: 16,
                        }}>
                            {t('transfer.txsSummary')}
                        </Text>
                        <View>
                            <View style={{
                                flexDirection: 'row',
                                marginHorizontal: 16,
                                alignItems: 'center'
                            }}>
                                <View style={{
                                    backgroundColor: theme.accent,
                                    height: 20, width: 20,
                                    borderRadius: 20,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginRight: 12
                                }}>
                                    <TonSign height={10} width={10} color={'white'} />
                                </View>
                                <Text style={{
                                    fontWeight: '700',
                                    fontSize: 20,
                                    color: theme.textColor
                                }}>
                                    {fromNano(totalAmount) + ' TON'}
                                </Text>
                            </View>
                            <PriceComponent
                                amount={totalAmount}
                                style={{
                                    backgroundColor: theme.transparent,
                                    paddingHorizontal: 0,
                                    marginLeft: 48, marginTop: 4
                                }}
                                textStyle={{ color: theme.textColor, fontWeight: '400', fontSize: 14 }}
                            />
                        </View>
                        {totalJettons.size > 0 && (
                            Array.from(totalJettons).map((value) => {
                                return (
                                    <View
                                        key={value[0]}
                                        style={{
                                            minHeight: 40,
                                            flexDirection: 'row',
                                            marginHorizontal: 16,
                                            marginBottom: 16,
                                            alignItems: 'center'
                                        }}>
                                        <View style={{
                                            backgroundColor: theme.accent,
                                            height: 20, width: 20,
                                            borderRadius: 20,
                                            justifyContent: 'center',
                                            alignItems: 'center', marginTop: 2
                                        }}>
                                            <WImage
                                                src={value[1].jettonMaster.image?.preview256}
                                                blurhash={value[1].jettonMaster.image?.blurhash}
                                                width={20}
                                                heigh={20}
                                                borderRadius={20}
                                            />
                                        </View>
                                        <View style={{ marginLeft: 12 }}>
                                            <Text style={{
                                                fontWeight: '700',
                                                fontSize: 20,
                                                color: theme.textColor,
                                                marginLeft: 2
                                            }}>
                                                {`${fromBnWithDecimals(value[1].jettonAmount, value[1].jettonMaster.decimals)} ${value[1].jettonMaster.symbol}`}
                                            </Text>
                                        </View>
                                    </View>
                                )
                            })
                        )}
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginTop: totalJettons.size > 0 ? 0 : 16 }} />
                        <ItemCollapsible title={t('transfer.gasDetails')} hideDivider>
                            {totalJettons.size > 0 && (
                                <>
                                    <View style={{ flexDirection: 'column', paddingHorizontal: 16, alignItems: 'flex-start' }}>
                                        <View style={{ height: 30, flexDirection: 'row' }}>
                                            <Text style={{
                                                fontSize: 14,
                                                fontWeight: '500',
                                                color: theme.textSecondary,
                                                alignSelf: 'center',
                                                flexGrow: 1, flexBasis: 0
                                            }}>
                                                {t('transfer.jettonGas')}
                                            </Text>
                                        </View>
                                        <View style={{ flexDirection: 'column', paddingBottom: 4 }}>
                                            <View style={{ paddingBottom: gas.unusual ? 0 : 6 }}>
                                                <Text style={{
                                                    fontSize: 16,
                                                    color: gas.unusual ? theme.warningSecondary : theme.textColor,
                                                    fontWeight: gas.unusual ? '700' : '400'
                                                }}>
                                                    {(!isTestnet && price)
                                                        ? fromNano(gas.total) + ' TON' + ` (${formatCurrency((parseFloat(fromNano(gas.total.abs())) * price.price.usd * price.price.rates[currency]).toFixed(2), currency, false)})`
                                                        : fromNano(gas.total) + ' TON'
                                                    }
                                                </Text>
                                            </View>
                                        </View>
                                        {gas.unusual && (
                                            <Pressable
                                                onPress={jettonsGasAlert}
                                                style={({ pressed }) => {
                                                    return {
                                                        alignSelf: 'flex-start',
                                                        flexDirection: 'row',
                                                        borderRadius: 6, borderWidth: 1,
                                                        borderColor: theme.warningSecondaryBorder,
                                                        paddingHorizontal: 8, paddingVertical: 4,
                                                        marginBottom: 16,
                                                        justifyContent: 'center', alignItems: 'center',
                                                        opacity: pressed ? 0.3 : 1
                                                    }
                                                }}
                                            >
                                                <Text style={{
                                                    fontSize: 14,
                                                    fontWeight: '400',
                                                    color: theme.warningSecondary
                                                }}>
                                                    {t('transfer.unusualJettonsGas')}
                                                </Text>
                                                <Question style={{ marginLeft: 5 }} />
                                            </Pressable>
                                        )}
                                    </View>
                                    <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginBottom: 6 }} />
                                </>
                            )}
                            <ItemLarge
                                title={t('transfer.feeTotalTitle')}
                                text={fromNano(fees) + ' TON'}
                            />
                        </ItemCollapsible>
                    </ItemGroup>
                    <ItemGroup>
                        {internals.map((i, index) => {
                            return (
                                <TransferComponent
                                    key={'transfer' + index}
                                    transfer={i as any}
                                    first={index === 0}
                                    last={index >= internals.length - 1}
                                    index={index}
                                />
                            );
                        })}
                    </ItemGroup>
                    <ItemGroup style={{
                        marginTop: 16
                    }}>
                        <ItemCollapsible title={t('transfer.moreDetails')}>
                            {internals.map((i, index) => {
                                return (
                                    <>
                                        <ItemAddress
                                            key={'address' + index}
                                            title={`#${index + 1} ` + t('common.walletAddress')}
                                            text={i.operation.address.toString({ testOnly: isTestnet })}
                                        />
                                        {index < internals.length - 1 && (<ItemDivider key={`div-${index}`} />)}
                                    </>
                                );
                            })}
                        </ItemCollapsible>
                    </ItemGroup>
                    <View style={{ height: 56 }} />
                </View>
            </ScrollView>
            <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                <RoundButton
                    title={t('common.confirm')}
                    action={doSend}
                />
            </View>
        </>
    );
});