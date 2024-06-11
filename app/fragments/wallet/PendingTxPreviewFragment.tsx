import React, { useCallback, useMemo } from "react";
import { Platform, ScrollView, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { getAppState } from "../../storage/appState";
import { useParams } from "../../utils/useParams";
import { valueText } from "../../components/ValueComponent";
import { formatDate, formatTime } from "../../utils/dates";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { Avatar } from "../../components/avatar/Avatar";
import { t } from "../../i18n/t";
import { KnownWallet, KnownWallets } from "../../secure/KnownWallets";
import { PriceComponent } from "../../components/PriceComponent";
import { copyText } from "../../utils/copyText";
import { ToastDuration, useToaster } from '../../components/toast/ToastProvider';
import { ScreenHeader } from "../../components/ScreenHeader";
import { ItemGroup } from "../../components/ItemGroup";
import { AboutIconButton } from "../../components/AboutIconButton";
import { useAppState, useBounceableWalletFormat, useDontShowComments, useNetwork, usePrice, useSelectedAccount, useTheme, useVerifyJetton } from "../../engine/hooks";
import { useWalletSettings } from "../../engine/hooks/appstate/useWalletSettings";
import { Address, fromNano, toNano } from "@ton/core";
import { StatusBar } from "expo-status-bar";
import { formatAmount, formatCurrency } from "../../utils/formatCurrency";
import { PerfText } from "../../components/basic/PerfText";
import { Typography } from "../../components/styles";
import { useAddressBookContext } from "../../engine/AddressBookContext";
import { PerfView } from "../../components/basic/PerfView";
import { PreviewFrom } from "./views/preview/PreviewFrom";
import { PreviewTo } from "./views/preview/PreviewTo";
import { AddressComponent } from "../../components/address/AddressComponent";
import { PendingTransaction } from "../../engine/state/pending";
import { parseBody } from "../../engine/transactions/parseWalletTransaction";
import { resolveOperation } from "../../engine/transactions/resolveOperation";
import { RoundButton } from "../../components/RoundButton";
import { SimpleTransferParams } from "../secure/SimpleTransferFragment";
import { TransferFragmentProps } from "../secure/TransferFragment";
import { fromBnWithDecimals, toBnWithDecimals } from "../../utils/withDecimals";

type PendingTxParams = (SimpleTransferParams & { type: 'simple' }) | (TransferFragmentProps & { type: 'transfer' });

function pendingTxToSimpleTransferParams(tx: PendingTransaction, testOnly: boolean): PendingTxParams | null {
    if (!tx.address) {
        return null;
    }

    // Skip batch transactions
    if (tx.body?.type === 'batch') {
        return null;
    }

    if (tx.body?.type === 'token') {
        const amount = fromBnWithDecimals(tx.body.amount, tx.body.jetton.decimals ?? 9);

        return {
            type: 'simple',
            target: tx.body.target.toString({ testOnly: true, bounceable: tx.body.bounceable }),
            comment: tx.body.comment,
            amount: toNano(amount),
            stateInit: null,
            job: null,
            jetton: tx.body.jetton.wallet,
            callback: null
        };
    }

    if (tx.body?.type === 'payload') {
        return {
            type: 'transfer',
            text: null,
            job: null,
            order: {
                type: 'order',
                messages: [{
                    target: tx.address?.toString({ testOnly, bounceable: tx.bounceable }) || '',
                    amount: -tx.amount,
                    amountAll: false,
                    stateInit: tx.body.stateInit || null,
                    payload: tx.body.cell
                }]
            }
        };
    }

    if (tx.body?.type === 'comment') {
        return {
            type: 'simple',
            target: tx.address?.toString({ testOnly, bounceable: tx.bounceable }) || '',
            comment: tx.body.comment,
            amount: -tx.amount,
            stateInit: null,
            job: null,
            jetton: null,
            callback: null
        };
    }

    return {
        type: 'simple',
        target: tx.address.toString({ testOnly, bounceable: tx.bounceable }),
        comment: null,
        amount: -tx.amount,
        stateInit: null,
        job: null,
        jetton: null,
        callback: null
    };
}

const PendingTxPreview = () => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const knownWallets = KnownWallets(isTestnet);
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const selected = useSelectedAccount()!;
    const toaster = useToaster();
    const appState = useAppState();
    const addressBook = useAddressBookContext();
    const [price, currency] = usePrice();
    const [dontShowComments,] = useDontShowComments();
    const [walletSettings,] = useWalletSettings(selected.address);
    const [bounceableFormat,] = useBounceableWalletFormat();

    const params = useParams<{ transaction: PendingTransaction, failed?: boolean }>();
    const tx = params.transaction;
    const repeatTransfer = useMemo(() => pendingTxToSimpleTransferParams(tx, isTestnet), [tx, isTestnet]);
    const body = tx.body?.type === 'payload' ? parseBody(tx.body.cell) : null;
    const amount = tx.body?.type === 'token'
        ? tx.body.amount
        : tx.amount > 0n
            ? tx.amount
            : -tx.amount;
    const fees = tx.fees;
    let comment = tx.body?.type === 'comment' ? tx.body.comment : undefined;
    if (body?.type === 'comment') {
        comment = body.comment;
    }
    if (tx.body?.type === 'token' && tx.body.comment) {
        comment = tx.body.comment;
    }

    const opAddress = tx.body?.type === 'token'
        ? tx.body.target.toString({ testOnly: isTestnet })
        : tx.address?.toString({ testOnly: isTestnet });
    const opAddressBounceable = tx.body?.type === 'token'
        ? tx.body.target.toString({ testOnly: isTestnet, bounceable: tx.body.bounceable })
        : tx.address?.toString({ testOnly: isTestnet, bounceable: tx.bounceable });
    const operation = !!opAddress ? resolveOperation({
        account: Address.parse(opAddress),
        amount: amount,
        body: body
    }, isTestnet) : undefined;
    const isOwn = appState.addresses.findIndex((a) => a.address.toString({ testOnly: isTestnet }) === opAddress) >= 0;

    const { verified } = useVerifyJetton({ master: opAddress });
    const knownWallet = knownWallets[opAddress ?? ''];
    const contact = addressBook.asContact(opAddress);
    const isSpam = addressBook.isDenyAddress(opAddress);

    let dateStr = `${formatDate(tx.time, 'MMMM dd, yyyy')} • ${formatTime(tx.time)}`;
    dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

    const feesPrise = useMemo(() => {
        if (!price) {
            return undefined;
        }

        const isNeg = fees < 0n;
        const abs = isNeg ? -fees : fees;

        return formatCurrency(
            (parseFloat(fromNano(abs)) * price.price.usd * price.price.rates[currency]).toFixed(3),
            currency,
            isNeg
        );
    }, [price, currency, fees]);

    let jetton = tx.body?.type === 'token' ? tx.body.jetton : null;
    let op = t('tx.sending');
    if (tx.status === 'sent') {
        op = t('tx.sent');
    } 
    if (params.failed) {
        op = t('tx.failed');
    }

    // Resolve built-in known wallets
    let known: KnownWallet | undefined = undefined;
    if (knownWallet) {
        known = knownWallet;
    }
    if (!!contact) { // Resolve contact known wallet
        known = { name: contact.name }
    }

    const participants = useMemo(() => {
        const appState = getAppState();
        const index = `${appState.addresses.findIndex((a) => selected.address?.equals(a.address)) + 1}`;

        if (!opAddressBounceable) {
            return {
                from: {
                    address: selected.address?.toString({ testOnly: isTestnet, bounceable: bounceableFormat }) || '',
                    name: walletSettings?.name || `${t('common.wallet')} ${index}`
                }
            }
        }

        return {
            from: {
                address: selected.address?.toString({ testOnly: isTestnet, bounceable: bounceableFormat }) || '',
                name: walletSettings?.name || `${t('common.wallet')} ${index}`
            },
            to: {
                address: opAddressBounceable,
                name: known?.name
            }
        }
    }, [opAddressBounceable, walletSettings, tx, known, bounceableFormat]);

    const onCopyAddress = useCallback((address: string) => {
        copyText(address);
        toaster.show({
            message: t('common.walletAddress') + ' ' + t('common.copied').toLowerCase(),
            type: 'default',
            duration: ToastDuration.SHORT,
        });
    }, []);

    const stringText = valueText({
        value: amount,
        precision: tx.body?.type === 'token' && jetton ? jetton.decimals ?? 9 : 9,
        decimals: tx.body?.type === 'token' && jetton ? jetton.decimals : undefined,
    });

    return (
        <PerfView
            style={{
                alignSelf: 'stretch', flexGrow: 1, flexBasis: 0,
                alignItems: 'center',
                paddingTop: Platform.OS === 'android' ? safeArea.top + 24 : undefined,
            }}
        >
            <StatusBar style={Platform.select({ android: theme.style === 'dark' ? 'light' : 'dark', ios: 'light' })} />
            <ScreenHeader
                onClosePressed={navigation.goBack}
                title={dateStr}
                titleStyle={Typography.regular15_20}
            />
            <ScrollView
                style={{ flexGrow: 1, alignSelf: 'stretch', marginTop: 16 }}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                automaticallyAdjustContentInsets={false}
                contentInset={{ bottom: safeArea.bottom + 16 }}
                alwaysBounceVertical={false}
            >
                <PerfView style={{
                    backgroundColor: theme.surfaceOnElevation,
                    borderRadius: 20,
                    padding: 20,
                    width: '100%',
                    overflow: 'hidden',
                    justifyContent: 'center', alignItems: 'center'
                }}>
                    <PerfView style={{ backgroundColor: theme.divider, position: 'absolute', top: 0, left: 0, right: 0, height: 54 }} />
                    <Avatar
                        size={68}
                        id={opAddress ?? ''}
                        address={opAddress}
                        showSpambadge
                        verified={verified}
                        borderWith={2.5}
                        borderColor={theme.surfaceOnElevation}
                        backgroundColor={theme.elevation}
                        markContact={!!contact}
                        icProps={{
                            isOwn: isOwn,
                            borderWidth: 2,
                            position: 'bottom',
                            size: 28
                        }}
                        theme={theme}
                        knownWallets={knownWallets}
                        hashColor
                    />
                    <PerfText
                        style={[
                            {
                                color: theme.textPrimary,
                                paddingTop: (!!contact || verified || isOwn || knownWallet) ? 16 : 8,
                            },
                            Typography.semiBold17_24
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {op}
                    </PerfText>
                    {!!participants.to ? (
                        <PerfView style={{ flexDirection: 'row', gap: 6, marginTop: 2, paddingHorizontal: 16 }}>
                            <PerfText
                                style={[{ color: theme.textPrimary, flexShrink: 1 }, Typography.regular17_24]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {participants.to.name}
                            </PerfText>
                            <PerfText
                                style={[{ color: theme.textSecondary }, Typography.regular17_24]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                <AddressComponent
                                    address={participants.to.address}
                                    bounceable={tx.body?.type === 'token' ? tx.body.bounceable : tx.bounceable}
                                    end={4}
                                    known={!!known}
                                    testOnly={isTestnet}
                                />
                            </PerfText>
                        </PerfView>
                    ) : (
                        !!operation?.op && (
                            <PerfText
                                style={[{ color: theme.textSecondary, marginTop: 2 }, Typography.regular15_20]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {t(operation.op.res, operation.op.options)}
                            </PerfText>
                        )
                    )}
                    <>
                        <Text
                            minimumFontScale={0.4}
                            adjustsFontSizeToFit={true}
                            numberOfLines={1}
                            style={[
                                {
                                    color: theme.textPrimary,
                                    marginTop: 12,
                                },
                                Typography.semiBold27_32
                            ]}
                        >
                            {`${stringText[0]}${stringText[1]}${tx.body?.type !== 'token' ? ' TON' : (jetton?.symbol ? ' ' + jetton?.symbol : '')}`}
                        </Text>
                        {tx.body?.type !== 'token' && (
                            <PriceComponent
                                style={{
                                    backgroundColor: theme.transparent,
                                    paddingHorizontal: 0,
                                    alignSelf: 'center',
                                    paddingVertical: 0,
                                    height: 'auto',
                                    paddingLeft: 0
                                }}
                                theme={theme}
                                textStyle={[{ color: theme.textSecondary }, Typography.regular17_24]}
                                amount={amount}
                            />
                        )}
                    </>
                </PerfView>
                {!(dontShowComments && isSpam) && !!comment && (
                    <ItemGroup style={{ marginTop: 16 }}>
                        <PerfView style={{ paddingHorizontal: 10, justifyContent: 'center' }}>
                            <PerfText style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                                {t('common.message')}
                            </PerfText>
                            <PerfView style={{ alignItems: 'flex-start' }}>
                                <PerfText style={[{ color: theme.textPrimary }, Typography.regular17_24]}>
                                    {comment}
                                </PerfText>
                            </PerfView>
                        </PerfView>
                    </ItemGroup>
                )}
                <ItemGroup style={{ marginVertical: 16 }}>
                    <PreviewFrom
                        onCopyAddress={onCopyAddress}
                        from={participants.from}
                        kind={'out'}
                        theme={theme}
                        isTestnet={isTestnet}
                        bounceableFormat={bounceableFormat}
                    />
                    {!!participants.to && (
                        <>
                            {!!participants.from.address && (
                                <PerfView style={{
                                    height: 1, alignSelf: 'stretch',
                                    backgroundColor: theme.divider,
                                    marginVertical: 16,
                                    marginHorizontal: 10
                                }} />
                            )}
                            <PreviewTo
                                onCopyAddress={onCopyAddress}
                                to={participants.to}
                                kind={'out'}
                                theme={theme}
                                testOnly={isTestnet}
                                bounceableFormat={bounceableFormat}
                            />
                        </>
                    )}
                </ItemGroup>
                <PerfView style={{
                    backgroundColor: theme.surfaceOnElevation,
                    padding: 20, borderRadius: 20,
                    flexDirection: 'row',
                    justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <PerfView>
                        <PerfText
                            style={[{ color: theme.textSecondary, marginBottom: 2 }, Typography.regular13_18]}>
                            {t('txPreview.blockchainFee')}
                        </PerfText>
                        <PerfText style={[{ color: theme.textPrimary }, Typography.regular17_24]}>
                            {!!fees
                                ? <>
                                    {`${formatAmount(fromNano(fees))}`}
                                    <PerfText style={{ color: theme.textSecondary }}>
                                        {` ${feesPrise}`}
                                    </PerfText>
                                </>
                                : '...'
                            }
                        </PerfText>
                    </PerfView>
                    <AboutIconButton
                        title={t('txPreview.blockchainFee')}
                        description={t('txPreview.blockchainFeeDescription')}
                        style={{ height: 24, width: 24, position: undefined, marginRight: 8 }}
                        size={24}
                    />
                </PerfView>
            </ScrollView>
            {params.failed && !!repeatTransfer && (
                <PerfView style={{ flexDirection: 'row', width: '100%', marginBottom: safeArea.bottom + 16, paddingHorizontal: 16 }}>
                    <RoundButton
                        title={t('txPreview.sendAgain')}
                        style={{ flexGrow: 1 }}
                        onPress={() => {
                            if (repeatTransfer.type === 'simple') {
                                navigation.navigateSimpleTransfer(repeatTransfer);
                            } else if (repeatTransfer.type === 'transfer') {
                                navigation.navigateTransfer(repeatTransfer);
                            }
                        }}
                    />
                </PerfView>
            )}
        </PerfView>
    );
}
PendingTxPreview.displayName = 'PendingTxPreview';

export const PendingTxPreviewFragment = fragment(PendingTxPreview);
PendingTxPreviewFragment.displayName = 'PendingTxPreviewFragment';