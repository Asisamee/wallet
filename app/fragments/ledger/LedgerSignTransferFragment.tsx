import BN from 'bn.js';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Platform, Text, View, Alert, Pressable } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { contractFromPublicKey } from '../../engine/contractFromPublicKey';
import { backoff } from '../../utils/time';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { useRoute } from '@react-navigation/native';
import { fetchConfig } from '../../engine/api/fetchConfig';
import { t } from '../../i18n/t';
import { KnownWallet, KnownWallets } from '../../secure/KnownWallets';
import { fragment } from '../../fragment';
import { ContractMetadata } from '../../engine/metadata/Metadata';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { ScrollView } from 'react-native-gesture-handler';
import { ItemGroup } from '../../components/ItemGroup';
import { ItemLarge } from '../../components/ItemLarge';
import { ItemDivider } from '../../components/ItemDivider';
import { CloseButton } from '../../components/CloseButton';
import { MixpanelEvent, trackEvent } from '../../analytics/mixpanel';
import { DNS_CATEGORY_WALLET, resolveDomain, validateDomain } from '../../utils/dns/dns';
import TonSign from '../../../assets/ic_ton_sign.svg';
import TransferToArrow from '../../../assets/ic_transfer_to.svg';
import Contact from '../../../assets/ic_transfer_contact.svg';
import VerifiedIcon from '../../../assets/ic_verified.svg';
import TonSignGas from '../../../assets/ic_transfer_gas.svg';
import SignLock from '../../../assets/ic_sign_lock.svg';
import WithStateInit from '../../../assets/ic_sign_contract.svg';
import SmartContract from '../../../assets/ic_sign_smart_contract.svg';
import Staking from '../../../assets/ic_sign_staking.svg';
import Question from '../../../assets/ic_question.svg';
import { PriceComponent } from '../../components/PriceComponent';
import { Avatar } from '../../components/Avatar';
import { AddressComponent } from '../../components/AddressComponent';
import { ItemCollapsible } from '../../components/ItemCollapsible';
import { WImage } from '../../components/WImage';
import { ItemAddress } from '../../components/ItemAddress';
import { LedgerOrder } from '../secure/ops/Order';
import { TonTransport } from '@ton-community/ton-ledger';
import { fetchSeqno } from '../../engine/api/fetchSeqno';
import { pathFromAccountNumber } from '../../utils/pathFromAccountNumber';
import { delay } from 'teslabot';
import { resolveLedgerPayload } from './utils/resolveLedgerPayload';
import { useTransport } from './components/TransportContext';
import { LottieAnimView } from '../../components/LottieAnimView';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { AndroidToolbar } from '../../components/topbar/AndroidToolbar';
import { useLedgerAccount } from '../../engine/hooks';
import { useDenyAddress } from '../../engine/hooks';
import { useIsSpamWallet } from '../../engine/hooks';
import { useClient4 } from '../../engine/hooks';
import { useConfig } from '../../engine/hooks';
import { fetchMetadata } from '../../engine/metadata/fetchMetadata';
import { fetchJettonMaster } from '../../engine/getters/getJettonMaster';
import { useNetwork } from '../../engine/hooks';
import { useTheme } from '../../engine/hooks';
import { useAccountLite } from '../../engine/hooks';
import { JettonMasterState } from '../../engine/metadata/fetchJettonMasterContent';
import { parseBody } from '../../engine/transactions/parseWalletTransaction';
import { resolveOperation } from '../../engine/transactions/resolveOperation';
import { parseMessageBody } from '../../engine/transactions/parseMessageBody';
import { Address, Cell, SendMode, beginCell, external, fromNano, internal, storeMessage, storeMessageRelaxed } from '@ton/core';
import { WalletContractV4 } from '@ton/ton';
import { estimateFees } from '../../utils/estimateFees';
import { useContact } from '../../engine/hooks';

export type LedgerSignTransferParams = {
    order: LedgerOrder,
    text: string | null,
}

export type ATextInputRef = {
    focus: () => void;
}

type ConfirmLoadedProps = {
    restricted: boolean,
    target: {
        isTestOnly: boolean;
        address: Address;
        balance: bigint,
        active: boolean,
        domain?: string
    },
    text: string | null,
    order: LedgerOrder,
    jettonMaster: JettonMasterState | null,
    fees: bigint,
    metadata: ContractMetadata,
    transport: TonTransport,
    addr: { acc: number, address: string, publicKey: Buffer },
};

const LedgerTransferLoaded = React.memo((props: ConfirmLoadedProps) => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();
    const account = useLedgerAccount();
    const client = useClient4(isTestnet);
    const {
        restricted,
        target,
        text,
        order,
        jettonMaster,
        fees,
        metadata,
        transport,
        addr
    } = props;

    const [transferState, setTransferState] = React.useState<'confirm' | 'sending' | 'sent'>('confirm');

    // Resolve operation
    let payload = order.payload ? resolveLedgerPayload(order.payload) : null;
    let body = payload ? parseBody(payload) : null;
    let parsedBody = body && body.type === 'payload' ? parseMessageBody(body.cell) : null;
    let operation = resolveOperation({ body: body, amount: order.amount, account: Address.parse(order.target) }, isTestnet);

    // Resolve Jettion amount
    const jettonAmount = React.useMemo(() => {
        try {
            if (jettonMaster && payload) {
                const temp = payload;
                if (temp) {
                    const parsing = temp.beginParse();
                    parsing.loadUint(32);
                    parsing.loadUint(64);
                    return parsing.loadCoins();
                }
            }
        } catch (e) {
            console.warn(e);
        }

        return undefined;
    }, [order]);

    // Resolve operation
    let path = pathFromAccountNumber(addr.acc, isTestnet);

    // Tracking
    const success = React.useRef(false);
    React.useEffect(() => {
        if (!success.current) {
            trackEvent(MixpanelEvent.TransferCancel, { target: order.target, amount: order.amount.toString(10) });
        }
    }, []);

    const friendlyTarget = target.address.toString({ testOnly: isTestnet });
    // Contact wallets
    const contact = useContact(friendlyTarget);

    // Resolve built-in known wallets
    let known: KnownWallet | undefined = undefined;
    if (KnownWallets(isTestnet)[friendlyTarget]) {
        known = KnownWallets(isTestnet)[friendlyTarget];
    } else if (!!contact) { // Resolve contact known wallet
        known = { name: contact.name }
    }

    const isSpam = useDenyAddress(friendlyTarget);
    let spam = useIsSpamWallet(friendlyTarget) || isSpam

    // Confirmation
    const doSend = React.useCallback(async () => {
        let value: bigint = order.amount;

        // Parse address
        let address: Address = target.address;

        const contract = await contractFromPublicKey(addr.publicKey);
        const source = WalletContractV4.create({ workchain: 0, publicKey: addr.publicKey });

        try {
            // Fetch data
            const [[accountSeqno, account, targetState]] = await Promise.all([
                backoff('transfer-fetch-data', async () => {
                    let block = await backoff('ledger-lastblock', () => client.getLastBlock());
                    let seqno = await backoff('ledger-contract-seqno', () => fetchSeqno(client, block.last.seqno, contract.address));
                    return Promise.all([
                        seqno,
                        backoff('ledger-lite', () => client.getAccountLite(block.last.seqno, contract.address)),
                        backoff('ledger-target', () => client.getAccount(block.last.seqno, address))
                    ])
                }),
            ]);

            // Check bounce flag
            let bounce = true;
            if (targetState.account.state.type !== 'active' && !order.stateInit) {
                bounce = false;
                if (target.balance <= BigInt(0)) {
                    let cont = await confirm('transfer.error.addressIsNotActive');
                    if (!cont) {
                        navigation.goBack();
                        return;
                    }
                }
            }

            // Send sign request to Ledger
            let signed: Cell | null = null;
            try {
                signed = await transport.signTransaction(path, {
                    to: address!,
                    sendMode: order.amountAll
                        ? SendMode.CARRY_ALL_REMAINING_BALANCE : SendMode.IGNORE_ERRORS | SendMode.PAY_GAS_SEPARATELY,
                    amount: value!,
                    seqno: accountSeqno,
                    timeout: Math.floor(Date.now() / 1e3) + 60000,
                    bounce,
                    payload: order.payload ? order.payload : undefined,
                });
            } catch (error) {
                const focused = navigation.baseNavigation().isFocused();
                Alert.alert(t('hardwareWallet.errors.transactionRejected'), undefined, [{
                    text: focused ? t('common.back') : undefined,
                    onPress: () => {
                        if (focused) {
                            navigation.goBack();
                        }
                    }
                }]);
                return;
            }

            // Sending when accepted
            let extMessage = external({
                to: contract.address,
                body: signed,
                init: accountSeqno === 0 ? source.init : null
            });
            
            let msg = beginCell().store(storeMessage(extMessage)).endCell();

            // Transfer
            await backoff('ledger-transfer', async () => {
                try {
                    setTransferState('sending');
                    await client.sendMessage(msg.toBoc({ idx: false }));
                } catch (error) {
                    console.warn(error);
                }
            });

            // Awaiting
            await backoff('tx-await', async () => {
                while (true) {
                    if (!account.account.last) {
                        return;
                    }
                    const lastBlock = await client.getLastBlock();
                    const lite = await client.getAccountLite(lastBlock.last.seqno, contract.address);

                    if (BigInt(account.account.last.lt) < BigInt(lite.account.last?.lt || '0')) {
                        setTransferState('sent');
                        navigation.goBack();
                        return;
                    }

                    await delay(1000);
                }
            });
        } catch (e) {
            console.warn(e);
            Alert.alert(t('hardwareWallet.errors.transferFailed'), undefined, [{
                text: t('common.back'),
                onPress: () => {
                    navigation.goBack();
                }
            }]);
        }
    }, []);

    React.useEffect(() => {
        // Start transfer confirmation via Ledger
        doSend();
    }, []);

    const inactiveAlert = React.useCallback(
        () => {
            Alert.alert(t('transfer.error.addressIsNotActive'),
                t('transfer.error.addressIsNotActiveDescription'),
                [{ text: t('common.gotIt') }])
        },
        [],
    );

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
                            color: '#858B93'
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
                        {transferState === 'confirm' && (
                            <Animated.View entering={FadeIn} exiting={FadeOut} style={{ justifyContent: 'center', alignItems: 'center' }}>
                                <LottieAnimView
                                    autoPlayIos
                                    source={require('../../../assets/animations/sign.json')}
                                    style={{ width: 120, height: 120 }}
                                    autoPlay={true}
                                    loop={true}
                                />
                                <Text style={{
                                    fontWeight: '700',
                                    fontSize: 30,
                                    textAlign: 'center',
                                    marginTop: 8
                                }}>
                                    {t('hardwareWallet.actions.confirmOnLedger')}
                                </Text>
                            </Animated.View>
                        )}
                        {transferState === 'sending' && (
                            <Animated.View entering={FadeIn} exiting={FadeOut} style={{ justifyContent: 'center', alignItems: 'center' }}>
                                <LottieAnimView
                                    autoPlayIos
                                    source={require('../../../assets/animations/clock.json')}
                                    style={{ width: 120, height: 120 }}
                                    autoPlay={true}
                                    loop={true}
                                />
                                <Text style={{
                                    fontWeight: '700',
                                    fontSize: 30,
                                    textAlign: 'center',
                                    marginTop: 8
                                }}>
                                    {t('hardwareWallet.actions.sending')}
                                </Text>
                            </Animated.View>
                        )}
                        {transferState === 'sent' && (
                            <Animated.View entering={FadeIn} exiting={FadeOut} style={{ justifyContent: 'center', alignItems: 'center' }}>
                                <LottieAnimView
                                    autoPlayIos
                                    source={require('../../../assets/animations/done.json')}
                                    style={{ width: 120, height: 120 }}
                                    autoPlay={true}
                                    loop={true}
                                />
                                <Text style={{
                                    fontWeight: '700',
                                    fontSize: 30,
                                    textAlign: 'center',
                                    marginTop: 8
                                }}>
                                    {t('hardwareWallet.actions.sent')}
                                </Text>
                            </Animated.View>
                        )}
                    </View>
                    <View
                        style={{
                            marginTop: 30,
                            backgroundColor: theme.surfacePimary,
                            borderRadius: 14,
                            justifyContent: 'center',
                            paddingHorizontal: 16,
                            paddingVertical: 20,
                            marginBottom: 14
                        }}
                    >
                        <View>
                            {!jettonAmount && (
                                <>
                                    <View style={{
                                        marginLeft: 40 + 6,
                                        minHeight: 40,
                                        justifyContent: 'center'
                                    }}>
                                        <Text style={{
                                            fontWeight: '700',
                                            fontSize: 20,
                                            color: theme.textPrimary,
                                            marginLeft: 2,
                                        }}>
                                            {`${fromNano(order.amountAll ? (account?.balance ?? BigInt(0)) : order.amount)} TON`}
                                        </Text>
                                        <PriceComponent
                                            prefix={'~'}
                                            amount={order.amountAll ? (account?.balance ?? BigInt(0)) : order.amount}
                                            style={{
                                                backgroundColor: 'transparent',
                                                paddingHorizontal: 0,
                                                marginLeft: 2
                                            }}
                                            textStyle={{ color: theme.textPrimary, fontWeight: '400', fontSize: 14 }}
                                        />
                                        {!!operation.comment && operation.comment.length > 0 && (
                                            <View style={{
                                                backgroundColor: theme.background,
                                                padding: 10,
                                                borderRadius: 6,
                                                marginTop: 8,
                                                marginBottom: 22,
                                            }}>
                                                <Text>
                                                    {`💬 ${operation.comment}`}
                                                </Text>
                                                <View style={{
                                                    marginLeft: 40 + 6,
                                                    marginVertical: 14,
                                                    justifyContent: 'center',
                                                    minHeight: 22,
                                                    position: 'absolute',
                                                    left: -82, top: operation.comment.length > 32 ? 22 : 8, bottom: 0,
                                                }}>
                                                    <View>
                                                        <TransferToArrow />
                                                    </View>
                                                </View>
                                            </View>
                                        )}
                                        <View style={{
                                            position: 'absolute',
                                            left: -48, top: 0, bottom: 0,
                                            backgroundColor: theme.accent,
                                            height: 40, width: 40,
                                            borderRadius: 40,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            marginTop: 2
                                        }}>
                                            <TonSign />
                                        </View>
                                    </View>
                                    {!(!!operation.comment && operation.comment.length > 0) && (
                                        <View style={{
                                            marginLeft: 40 + 6,
                                            marginVertical: 14,
                                            justifyContent: 'center',
                                            minHeight: 22,
                                        }}>
                                            <View style={{
                                                position: 'absolute',
                                                left: -26 - 10, top: 0, bottom: 0,
                                            }}>
                                                <TransferToArrow />
                                            </View>
                                        </View>
                                    )}
                                </>
                            )}
                            {!!jettonAmount && !!jettonMaster && (
                                <>
                                    <View style={{
                                        position: 'absolute',
                                        top: 44,
                                        bottom: contact ? 48 : 44,
                                        left: 17,
                                        width: 2,
                                        borderRadius: 2,
                                        backgroundColor: theme.divider
                                    }} />
                                    <View style={{
                                        marginLeft: 40 + 6,
                                        minHeight: 40,
                                        justifyContent: 'center'
                                    }}>
                                        <Text style={{
                                            fontWeight: '700',
                                            fontSize: 20,
                                            color: theme.textPrimary,
                                            marginLeft: 2
                                        }}>
                                            {`${fromNano(jettonAmount)} ${jettonMaster.symbol}`}
                                        </Text>
                                        {!!operation.comment && operation.comment.length > 0 && (
                                            <View style={{
                                                backgroundColor: theme.background,
                                                padding: 10,
                                                borderRadius: 6,
                                                marginTop: 8
                                            }}>
                                                <Text>
                                                    {`💬 ${operation.comment}`}
                                                </Text>
                                            </View>
                                        )}
                                        <View style={{
                                            position: 'absolute',
                                            left: -48, top: 0, bottom: 0,
                                            backgroundColor: theme.accent,
                                            height: 40, width: 40,
                                            borderRadius: 40,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            marginTop: 2
                                        }}>
                                            <WImage
                                                src={jettonMaster.image?.preview256}
                                                blurhash={jettonMaster.image?.blurhash}
                                                width={40}
                                                heigh={40}
                                                borderRadius={40}
                                            />
                                        </View>
                                    </View>
                                    <View style={{
                                        marginLeft: 40 + 6,
                                        minHeight: 24,
                                        marginTop: 20, marginBottom: 30,
                                        justifyContent: 'center'
                                    }}>
                                        {!isTestnet && (
                                            <PriceComponent
                                                prefix={`${t('transfer.gasFee')} ${fromNano(order.amount)} TON (`}
                                                suffix={')'}
                                                amount={order.amountAll ? (account?.balance ?? BigInt(0)) : order.amount}
                                                style={{
                                                    backgroundColor: 'transparent',
                                                    paddingHorizontal: 0,
                                                    marginLeft: 2
                                                }}
                                                textStyle={{
                                                    color: '#858B93',
                                                    fontWeight: '400', fontSize: 14
                                                }}
                                            />
                                        )}
                                        {isTestnet && (
                                            <Text style={{
                                                color: '#858B93',
                                                fontWeight: '400', fontSize: 14,
                                                lineHeight: 16
                                            }}>
                                                {`${t('transfer.gasFee')} ${fromNano(order.amount)} TON`}
                                            </Text>
                                        )}
                                        <View style={{
                                            backgroundColor: theme.surfacePimary,
                                            shadowColor: 'rgba(0, 0, 0, 0.25)',
                                            shadowOffset: {
                                                height: 1,
                                                width: 0
                                            },
                                            shadowRadius: 3,
                                            shadowOpacity: 1,
                                            height: 24, width: 24,
                                            borderRadius: 24,
                                            position: 'absolute', top: 0, bottom: 0, left: -40,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                        }}>
                                            <TonSignGas />
                                        </View>
                                    </View>
                                </>
                            )}
                            {(!!contact || !!known) && (
                                <View style={{
                                    marginLeft: 40 + 6,
                                    minHeight: 40,
                                    justifyContent: 'center'
                                }}>
                                    <View style={{ flexDirection: 'row' }}>
                                        <Text style={{
                                            fontWeight: '700',
                                            fontSize: 20,
                                            color: theme.textPrimary,
                                            marginLeft: 2,
                                        }}>
                                            {`${contact?.name ?? known?.name}`}
                                        </Text>
                                        {known && (
                                            <VerifiedIcon
                                                width={20}
                                                height={20}
                                                style={{ alignSelf: 'center', marginLeft: 6 }}
                                            />
                                        )}
                                    </View>
                                    <Text style={{
                                        fontWeight: '400',
                                        fontSize: 14,
                                        color: '#858B93',
                                        marginLeft: 2,
                                        marginTop: 4
                                    }}>
                                        <AddressComponent address={target.address} />
                                    </Text>
                                    {!target.active && !order.stateInit && (
                                        <>
                                            <Pressable
                                                onPress={inactiveAlert}
                                                style={({ pressed }) => {
                                                    return {
                                                        alignSelf: 'flex-start',
                                                        flexDirection: 'row',
                                                        borderRadius: 6, borderWidth: 1,
                                                        borderColor: '#FFC165',
                                                        paddingHorizontal: 8, paddingVertical: 4,
                                                        marginTop: 4,
                                                        justifyContent: 'center', alignItems: 'center',
                                                        opacity: pressed ? 0.3 : 1
                                                    }
                                                }}
                                            >
                                                <Text style={{
                                                    fontSize: 14,
                                                    fontWeight: '400',
                                                    color: '#E19626'
                                                }}>
                                                    {t('transfer.error.addressIsNotActive')}
                                                </Text>
                                                <Question style={{ marginLeft: 5 }} />
                                            </Pressable>
                                        </>
                                    )}
                                    {contact && (
                                        <>
                                            <View style={{
                                                position: 'absolute',
                                                left: -48, top: 0, bottom: 0,
                                                backgroundColor: '#EDA652',
                                                height: 40, width: 40,
                                                borderRadius: 40,
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                marginBottom: 36
                                            }}>
                                                <Contact />
                                            </View>
                                            <View style={{
                                                alignSelf: 'flex-start',
                                                borderRadius: 6, borderWidth: 1,
                                                borderColor: '#DEDEDE',
                                                paddingHorizontal: 8, paddingVertical: 4,
                                                marginTop: 4
                                            }}>
                                                <Text>
                                                    {t('transfer.contact')}
                                                </Text>
                                            </View>
                                        </>
                                    )}
                                    {!contact && (
                                        <View style={{
                                            position: 'absolute',
                                            left: -48, top: 0, bottom: 0,
                                            height: 40, width: 40,
                                        }}>
                                            <Avatar
                                                address={friendlyTarget}
                                                id={friendlyTarget}
                                                size={40}
                                                spam={spam}
                                                dontShowVerified={true}
                                            />
                                        </View>
                                    )}
                                </View>
                            )}
                            {(!contact && !known) && (
                                <View style={{
                                    marginLeft: 40 + 6,
                                    minHeight: 40,
                                    justifyContent: 'center'
                                }}>
                                    <Text style={{
                                        fontWeight: '700',
                                        fontSize: 20,
                                        color: theme.textPrimary,
                                        marginLeft: 2
                                    }}>
                                        <AddressComponent address={target.address} />
                                    </Text>
                                    <View style={{
                                        position: 'absolute',
                                        left: -48, top: 0, bottom: 0,
                                        height: 40, width: 40,
                                    }}>
                                        <Avatar
                                            address={friendlyTarget}
                                            id={friendlyTarget}
                                            size={40}
                                            spam={spam}
                                            dontShowVerified={true}
                                        />
                                    </View>
                                    {!target.active && !order.stateInit && (
                                        <>
                                            <Pressable
                                                onPress={inactiveAlert}
                                                style={({ pressed }) => {
                                                    return {
                                                        alignSelf: 'flex-start',
                                                        flexDirection: 'row',
                                                        borderRadius: 6, borderWidth: 1,
                                                        borderColor: '#FFC165',
                                                        paddingHorizontal: 8, paddingVertical: 4,
                                                        marginTop: 4,
                                                        justifyContent: 'center', alignItems: 'center',
                                                        opacity: pressed ? 0.3 : 1
                                                    }
                                                }}
                                            >
                                                <Text style={{
                                                    fontSize: 14,
                                                    fontWeight: '400',
                                                    color: '#E19626'
                                                }}>
                                                    {t('transfer.error.addressIsNotActive')}
                                                </Text>
                                                <Question style={{ marginLeft: 5 }} />
                                            </Pressable>
                                        </>
                                    )}
                                </View>
                            )}
                        </View>

                        {!jettonAmount && (!!operation.op || (!operation.comment && !operation.op && !!text)) && (
                            <View>
                                <View style={{
                                    position: 'absolute',
                                    top: -2,
                                    bottom: 42,
                                    left: 17,
                                    width: 2,
                                    borderRadius: 2,
                                    backgroundColor: theme.divider
                                }} />
                                <View style={{
                                    marginLeft: 40 + 6,
                                    justifyContent: 'center'
                                }}>
                                    {!!operation.op && (
                                        <View style={{ marginLeft: 2, marginVertical: 30, minHeight: 24, justifyContent: 'center' }}>
                                            <Text style={{
                                                color: '#858B93',
                                                fontWeight: '400', fontSize: 14,
                                                lineHeight: 16
                                            }}>
                                                {t('transfer.smartContract')}
                                            </Text>
                                            <View style={{
                                                backgroundColor: theme.surfacePimary,
                                                shadowColor: 'rgba(0, 0, 0, 0.25)',
                                                shadowOffset: {
                                                    height: 1,
                                                    width: 0
                                                },
                                                shadowRadius: 3,
                                                shadowOpacity: 1,
                                                height: 24, width: 24,
                                                borderRadius: 24,
                                                position: 'absolute', top: 0, bottom: 0, left: -42,
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                            }}>
                                                <WithStateInit />
                                            </View>
                                        </View>
                                    )}
                                    {!operation.comment && !operation.op && !!text && (
                                        <View style={{ marginLeft: 2, marginVertical: 30, minHeight: 24, justifyContent: 'center' }}>
                                            <Text style={{
                                                color: '#858B93',
                                                fontWeight: '400', fontSize: 14,
                                                lineHeight: 16
                                            }}>
                                                {t('transfer.smartContract')}
                                            </Text>
                                            <View style={{
                                                backgroundColor: theme.surfacePimary,
                                                shadowColor: 'rgba(0, 0, 0, 0.25)',
                                                shadowOffset: {
                                                    height: 1,
                                                    width: 0
                                                },
                                                shadowRadius: 3,
                                                shadowOpacity: 1,
                                                height: 24, width: 24,
                                                borderRadius: 24,
                                                position: 'absolute', top: 0, bottom: 0, left: -42,
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                            }}>
                                                <WithStateInit />
                                            </View>
                                        </View>
                                    )}
                                </View>
                                <View style={{
                                    marginLeft: 40 + 6,
                                    justifyContent: 'center'
                                }}>
                                    {!!operation.op && (
                                        <View style={{ marginLeft: 2, minHeight: 40, justifyContent: 'center' }}>
                                            <Text style={{
                                                fontWeight: '400',
                                                fontSize: 17,
                                                color: theme.textPrimary,
                                            }}>
                                                {t(operation.op.res, operation.op.options)}
                                            </Text>
                                        </View>
                                    )}
                                    {!operation.comment && !operation.op && !!text && (
                                        <View style={{ marginLeft: 2, minHeight: 40, justifyContent: 'center' }}>
                                            <Text style={{
                                                flexShrink: 1,
                                                fontWeight: '500',
                                                fontSize: 14,
                                                color: theme.textPrimary,
                                                opacity: 0.4
                                            }}>
                                                {text}
                                            </Text>
                                        </View>
                                    )}
                                    <View style={{
                                        backgroundColor: '#60C75E',
                                        height: 40, width: 40,
                                        borderRadius: 40,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        position: 'absolute',
                                        left: -48, top: 0, bottom: 0,
                                    }}>
                                        {(parsedBody?.type === 'whales-staking::deposit' || parsedBody?.type === 'withdraw') && (
                                            <Staking />
                                        )}
                                        {!(parsedBody?.type === 'whales-staking::deposit' || parsedBody?.type === 'withdraw') && (
                                            <SmartContract />
                                        )}
                                    </View>
                                </View>
                            </View>
                        )}

                    </View>
                    <ItemGroup>
                        <ItemCollapsible title={t('transfer.moreDetails')}>
                            <ItemAddress
                                title={t('common.walletAddress')}
                                text={operation.address}
                                verified={!!known}
                                contact={!!contact}
                                secondary={known ? known.name : contact?.name ?? undefined}
                            />
                            {!!props.order.domain && (
                                <>
                                    <ItemDivider />
                                    <ItemLarge title={t('common.domain')} text={`${props.order.domain}.ton`} />
                                </>
                            )}
                            {!!operation.op && (
                                <>
                                    <ItemDivider />
                                    <ItemLarge title={t('transfer.purpose')} text={t(operation.op.res, operation.op.options)} />
                                </>
                            )}
                            {!operation.comment && !operation.op && !!text && (
                                <>
                                    <ItemDivider />
                                    <ItemLarge title={t('transfer.purpose')} text={text} />
                                </>
                            )}
                            {!operation.comment && !operation.op && payload && (
                                <>
                                    <ItemDivider />
                                    <ItemLarge title={t('transfer.unknown')} text={payload.hash().toString('base64')} />
                                </>
                            )}
                            {!!jettonAmount && (
                                <>
                                    <ItemDivider />
                                    <ItemLarge title={t('transfer.gasFee')} text={fromNano(order.amount) + ' TON'} />
                                </>
                            )}
                            <ItemDivider />
                            <ItemLarge title={t('transfer.feeTitle')} text={fromNano(fees) + ' TON'} />
                        </ItemCollapsible>
                    </ItemGroup>
                    <View style={{ height: 56 }} />
                </View>
            </ScrollView>
        </>
    );
});

export const LedgerSignTransferFragment = fragment(() => {
    const params: {
        order: LedgerOrder,
        text: string | null,
    } = useRoute().params! as any;

    const { ledgerConnection, tonTransport, addr } = useTransport();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();

    // Memmoize all parameters just in case
    const from = React.useMemo(() => addr, []);
    const target = React.useMemo(() => Address.parseFriendly(params.order.target), []);
    const order = React.useMemo(() => params.order, []);
    const text = React.useMemo(() => params.text, []);

    // Fetch all required parameters
    const [loadedProps, setLoadedProps] = React.useState<ConfirmLoadedProps | null>(null);
    const netConfig = useConfig();
    const { isTestnet } = useNetwork();
    const client = useClient4(isTestnet);

    React.useEffect(() => {

        // Await data
        if (!netConfig) {
            return;
        }

        if (!ledgerConnection || !tonTransport || !addr) {
            return;
        }

        let exited = false;

        backoff('transfer', async () => {

            if (!from) {
                return;
            }

            // Confirm domain-resolved wallet address
            if (order.domain) {
                const tonDnsRootAddress = Address.parse(netConfig.rootDnsAddress);
                try {
                    const tonZoneMatch = order.domain.match(/\.ton$/);
                    const tMeZoneMatch = order.domain.match(/\.t\.me$/);
                    let zone = null;
                    let domain = null;
                    if (tonZoneMatch || tMeZoneMatch) {
                        zone = tonZoneMatch ? '.ton' : '.t.me';
                        domain = zone === '.ton'
                            ? order.domain.slice(0, order.domain.length - 4)
                            : order.domain.slice(0, order.domain.length - 5)
                    }

                    if (!domain) {
                        throw Error('Invalid domain');
                    }

                    const valid = validateDomain(domain);
                    if (!valid) {
                        throw Error('Invalid domain');
                    }

                    const resolvedDomainWallet = await resolveDomain(client, tonDnsRootAddress, order.domain, DNS_CATEGORY_WALLET);
                    if (!resolvedDomainWallet) {
                        throw Error('Error resolving domain wallet');
                    }

                    if (
                        !resolvedDomainWallet
                        || !Address.isAddress(resolvedDomainWallet)
                        || !resolvedDomainWallet.equals(target!.address)
                    ) {
                        throw Error('Error resolving wallet address');
                    }
                } catch (e) {
                    Alert.alert(t('transfer.error.invalidDomain'), undefined, [{
                        text: t('common.close'),
                        onPress: () => navigation.goBack()
                    }]);
                    return;
                }
            }

            // Get contract
            const contract = contractFromPublicKey(from.publicKey);

            // Resolve payload 
            let payload: Cell | null = order.payload ? resolveLedgerPayload(order.payload) : null;

            // Create transfer
            let intMessage = internal({
                to: target.address,
                value: order.amount,
                bounce: false,
                body: payload,

            });

            let seqno = await backoff('transfer', () => fetchSeqno(client, 0, contract.address));
            let transfer = await contract.createTransfer({
                seqno: seqno,
                secretKey: Buffer.from('abacaba'),
                sendMode: SendMode.IGNORE_ERRORS | SendMode.PAY_GAS_SEPARATELY,
                messages: [intMessage]
            });

            // Fetch data
            const [
                config,
                [metadata, state]
            ] = await Promise.all([
                backoff('transfer', () => fetchConfig()),
                backoff('transfer', async () => {
                    let block = await backoff('transfer', () => client.getLastBlock());
                    return Promise.all([
                        backoff('transfer', () => fetchMetadata(client, block.last.seqno, target.address)),
                        backoff('transfer', () => client.getAccount(block.last.seqno, target.address))
                    ])
                }),
            ])
            if (exited) {
                return;
            }

            // Check if wallet is restricted
            let restricted = false;
            for (let r of config.wallets.restrict_send) {
                if (Address.parse(r).equals(target.address)) {
                    restricted = true;
                    break;
                }
            }

            // Read jetton master
            let jettonMaster: JettonMasterState | null = null;
            if (metadata.jettonWallet) {
                jettonMaster = await fetchJettonMaster(metadata.jettonWallet!.master, isTestnet);
            }

            // Estimate fee
            let inMsgExt = external({
                to: contract.address,
                body: transfer,
                init: seqno === 0 ? contract.init : null
            });

            let inMsg = beginCell().store(storeMessage(inMsgExt)).endCell();


            let fees = estimateFees(netConfig!, inMsg, [beginCell().store(storeMessageRelaxed(intMessage)).endCell()], [state!.account.storageStat]);

            // Set state
            setLoadedProps({
                restricted,
                target: {
                    isTestOnly: target.isTestOnly,
                    address: target.address,
                    balance: BigInt(state.account.balance.coins),
                    active: state.account.state.type === 'active',
                    domain: order.domain
                },
                order,
                jettonMaster,
                fees,
                metadata,
                addr: addr,
                transport: tonTransport,
                text
            });
        });

        return () => {
            exited = true;
        };
    }, [netConfig]);

    return (
        <>
            <AndroidToolbar style={{ marginTop: safeArea.top }} pageTitle={t('transfer.confirmTitle')} />
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <View style={{ flexGrow: 1, flexBasis: 0, paddingBottom: safeArea.bottom }}>
                {!loadedProps && (<View style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}><LoadingIndicator simple={true} /></View>)}
                {!!loadedProps && <LedgerTransferLoaded {...loadedProps} />}
            </View>
            {
                Platform.OS === 'ios' && (
                    <CloseButton
                        style={{ position: 'absolute', top: 12, right: 10 }}
                        onPress={() => {
                            navigation.goBack();
                        }}
                    />
                )
            }
        </>
    );
});