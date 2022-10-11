import React, { useMemo } from "react";
import { View, Platform, Text, Image, Pressable, Alert, ToastAndroid, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { getCurrentAddress } from "../../storage/appState";
import { CloseButton } from "../../components/CloseButton";
import { Theme } from "../../Theme";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { useParams } from "../../utils/useParams";
import { Address, fromNano } from "ton";
import BN from "bn.js";
import { ValueComponent } from "../../components/ValueComponent";
import { formatDate, formatTime } from "../../utils/dates";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { AppConfig } from "../../AppConfig";
import { WalletAddress } from "../../components/WalletAddress";
import { Avatar } from "../../components/Avatar";
import { t } from "../../i18n/t";
import { MenuComponent } from "../../components/MenuComponent";
import { StatusBar } from "expo-status-bar";
import { useEngine } from "../../engine/Engine";
import { KnownWallet, KnownWallets } from "../../secure/KnownWallets";
import { confirmAlert } from "../../utils/confirmAlert";
import VerifiedIcon from '../../../assets/ic_verified.svg';
import ContactIcon from '../../../assets/ic_contacts.svg';
import CopyIcon from '../../../assets/ic_copy.svg';
import ExplorerIcon from '../../../assets/ic_explorer.svg';
import { RoundButton } from "../../components/RoundButton";
import { PriceComponent } from "../../components/PriceComponent";
import Clipboard from '@react-native-clipboard/clipboard';
import * as Haptics from 'expo-haptics';
import { openWithInApp } from "../../utils/openWithInApp";
import { parseBody } from "../../engine/transactions/parseWalletTransaction";
import { Body } from "../../engine/Transaction";

export const TransactionPreviewFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const params = useParams<{ transaction: string }>();
    const address = React.useMemo(() => getCurrentAddress().address, []);
    const engine = useEngine();
    let transaction = engine.products.main.useTransaction(params.transaction);
    let transactionHash = engine.transactions.getHash(address, transaction.base.lt);
    let operation = transaction.operation;
    let friendlyAddress = operation.address.toFriendly({ testOnly: AppConfig.isTestnet });
    let item = transaction.operation.items[0];
    let op: string;
    if (operation.op) {
        op = operation.op;
        if (op === 'airdrop') {
            op = t('tx.airdrop');
        }
    } else {
        if (transaction.base.kind === 'out') {
            if (transaction.base.status === 'pending') {
                op = t('tx.sending');
            } else {
                op = t('tx.sent');
            }
        } else if (transaction.base.kind === 'in') {
            if (transaction.base.bounced) {
                op = '⚠️ ' + t('tx.bounced');
            } else {
                op = t('tx.received');
            }
        } else {
            throw Error('Unknown kind');
        }
    }

    const contact = engine.products.settings.useContactAddress(operation.address);

    // Resolve built-in known wallets
    let known: KnownWallet | undefined = undefined;
    if (KnownWallets[friendlyAddress]) {
        known = KnownWallets[friendlyAddress];
    } else if (operation.title) {
        known = { name: operation.title };
    } else if (!!contact) { // Resolve contact known wallet
        known = { name: contact.name }
    }

    const spamMinAmount = engine.products.settings.useSpamMinAmount();
    const dontShowComments = engine.products.settings.useDontShowComments();
    const isSpam = engine.products.settings.useDenyAddress(operation.address);

    let spam = engine.products.serverConfig.useIsSpamWallet(friendlyAddress)
        || isSpam
        || (
            transaction.base.amount.abs().lt(spamMinAmount)
            && transaction.base.body?.type === 'comment'
            && !KnownWallets[friendlyAddress]
            && !AppConfig.isTestnet
        );


    const settings = engine.products.settings;
    const onMarkAddressSpam = React.useCallback(async (addr: Address) => {
        const confirmed = await confirmAlert('spamFilter.blockConfirm');
        if (confirmed) {
            settings.addToDenyList(addr);
        }
    }, []);

    const onAddressContact = React.useCallback((addr: Address) => {
        navigation.navigate('Contact', { address: addr.toFriendly({ testOnly: AppConfig.isTestnet }) });
    }, []);


    // 
    // Address actions
    // 
    const addressActions = [];

    if (!spam) {
        addressActions.push({
            title: t('spamFilter.blockConfirm'),
            id: 'block',
            image: Platform.OS === 'ios' ? 'exclamationmark.octagon' : undefined,
            attributes: { destructive: true },
            onAction: () => onMarkAddressSpam(operation.address || address)
        });
    }

    if (!known) {
        addressActions.push({
            title: t('contacts.contact'),
            id: 'contact',
            image: Platform.OS === 'ios' ? 'person.crop.circle' : undefined,
            onAction: () => onAddressContact(operation.address || address)
        });
    }

    return (
        <View style={{
            alignSelf: 'stretch', flexGrow: 1, flexBasis: 0,
            alignItems: 'center',
            backgroundColor: Theme.background,
            paddingTop: Platform.OS === 'android' ? safeArea.top + 24 : undefined,
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar style={{ position: 'absolute', top: safeArea.top, left: 0 }} pageTitle={op} />
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                {Platform.OS === 'ios' && (
                    <Text style={{ color: Theme.textColor, fontWeight: '600', fontSize: 17, marginTop: 17, marginHorizontal: 32 }} numberOfLines={1} ellipsizeMode="tail">
                        {op}
                    </Text>
                )}
            </View>
            <Text style={{ color: Theme.textSecondary, fontSize: 13, marginTop: 6 }}>
                {`${formatDate(transaction.base.time, 'dd.MM.yyyy')} ${formatTime(transaction.base.time)}`}
            </Text>
            {spam && (
                <View style={{
                    borderColor: '#ADB6BE',
                    borderWidth: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: 4,
                    marginTop: 13,
                    paddingHorizontal: 4
                }}>
                    <Text style={{ color: Theme.textSecondary, fontSize: 13 }}>{'SPAM'}</Text>
                </View>
            )}
            <ScrollView
                style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', }}
                contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 16 }}
                automaticallyAdjustContentInsets={false}
            >
                <View style={{
                    marginTop: 52,
                    backgroundColor: Theme.item,
                    borderRadius: 14,
                    justifyContent: 'center', alignItems: 'center',
                    paddingHorizontal: 16, paddingTop: 38, paddingBottom: 16,
                    width: '100%'
                }}>
                    <View style={{
                        width: 60, height: 60,
                        borderRadius: 56, borderWidth: 4, borderColor: Theme.item,
                        alignItems: 'center', justifyContent: 'center',
                        position: 'absolute', top: -28,
                    }}>
                        <Avatar address={friendlyAddress} id={friendlyAddress} size={56} image={transaction.icon ? transaction.icon : undefined} spam={spam} />
                    </View>
                    {transaction.base.status === 'failed' ? (
                        <Text style={{ color: 'orange', fontWeight: '600', fontSize: 16, marginRight: 2 }}>failed</Text>
                    ) : (
                        <>
                            <Text style={{ color: item.amount.gte(new BN(0)) ? spam ? Theme.textColor : '#4FAE42' : '#000000', fontWeight: '800', fontSize: 36, marginRight: 2 }} numberOfLines={1}>
                                <ValueComponent
                                    value={item.amount}
                                    decimals={item.kind === 'token' ? item.decimals : undefined}
                                    centFontStyle={{ fontSize: 30, fontWeight: '400' }}
                                    precision={5}
                                />
                                {item.kind === 'token' ? ' ' + item.symbol : ''}
                                {(item.kind === 'ton' && !AppConfig.isTestnet) ? ' ' + 'TON' : ''}
                            </Text>
                            {item.kind === 'ton' && (
                                <PriceComponent
                                    style={{
                                        backgroundColor: 'transparent',
                                        paddingHorizontal: 0,
                                        alignSelf: 'center'
                                    }}
                                    textStyle={{ color: Theme.price, fontWeight: '400' }}
                                    amount={item.amount}
                                />
                            )}
                        </>
                    )}
                </View>
                {(!operation.comment && body?.type === 'comment' && body.comment) && !(spam && !dontShowComments) && (
                    <View style={{
                        marginTop: 14,
                        backgroundColor: Theme.item,
                        borderRadius: 14,
                        justifyContent: 'center',
                        width: '100%'
                    }}>
                        <MenuComponent content={body.comment}>
                            <View style={{ paddingVertical: 16, paddingHorizontal: 16 }}>
                                <Text style={{ fontWeight: '400', color: Theme.textSubtitle, fontSize: 12 }}>
                                    {t('common.comment')}
                                </Text>
                                <Text
                                    style={{
                                        marginTop: 5,
                                        textAlign: 'left',
                                        fontWeight: '600',
                                        fontSize: 16,
                                        lineHeight: 20
                                    }}
                                >
                                    {body.comment}
                                </Text>
                            </View>
                        </MenuComponent>
                    </View>
                )}
                {(!(body?.type === 'comment' && body.comment) && operation.comment) && !(spam && !dontShowComments) && (
                    <View style={{
                        marginTop: 14,
                        backgroundColor: Theme.item,
                        borderRadius: 14,
                        justifyContent: 'center',
                        width: '100%'
                    }}>
                        <MenuComponent content={operation.comment}>
                            <View style={{ paddingVertical: 16, paddingHorizontal: 16 }}>
                                <Text style={{ fontWeight: '400', color: Theme.textSubtitle, fontSize: 12 }}>
                                    {t('common.comment')}
                                </Text>
                                <Text
                                    style={{
                                        marginTop: 5,
                                        textAlign: 'left',
                                        fontWeight: '600',
                                        fontSize: 16,
                                        lineHeight: 20
                                    }}
                                >
                                    {operation.comment}
                                </Text>
                            </View>
                        </MenuComponent>
                    </View>
                )}
                <View style={{ paddingVertical: 16, paddingHorizontal: 16 }}>
                    <WalletAddress
                        address={operation.address.toFriendly({ testOnly: AppConfig.isTestnet }) || address.toFriendly({ testOnly: AppConfig.isTestnet })}
                        textProps={{ numberOfLines: undefined }}
                        textStyle={{
                            textAlign: 'left',
                            fontWeight: '600',
                            fontSize: 16,
                            lineHeight: 20
                        }}
                        style={{
                            width: undefined,
                            marginTop: undefined
                        }}
                        actions={addressActions}
                    />
                    <View style={{
                        flexDirection: 'row',
                        width: '100%',
                        alignItems: 'center',
                    }}>
                        <Text style={{
                            marginTop: 5,
                            fontWeight: '400',
                            color: '#8E979D',
                            marginRight: 16, flexGrow: 1
                        }}>
                            {t('common.walletAddress')}
                        </Text>
                        {!!known && (
                            <Pressable
                                style={({ pressed }) => {
                                    return [{
                                        opacity: pressed && contact ? 0.3 : 1,
                                    }]
                                }}
                                onPress={() => {
                                    navigation.navigate('Contact', { address: operation.address.toFriendly({ testOnly: AppConfig.isTestnet }) });
                                }}
                                actions={[
                                    {
                                        title: t('contacts.contact'),
                                        id: 'contact',
                                        image: Platform.OS === 'ios' ? 'person.crop.circle' : undefined,
                                        onAction: () => onAddressContact(operation.address || address)
                                    },
                                    {
                                        title: t('spamFilter.blockConfirm'),
                                        id: 'block',
                                        image: Platform.OS === 'ios' ? 'exclamationmark.octagon' : undefined,
                                        attributes: { destructive: true },
                                        onAction: () => onMarkAddressSpam(operation.address || address)
                                    },
                                ]}
                            />
                            <Pressable
                                style={({ pressed }) => { return { opacity: pressed ? 0.3 : 1 }; }}
                                onPress={() => onCopy((operation.address || address).toFriendly({ testOnly: AppConfig.isTestnet }))}
                            >
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        justifyContent: 'flex-end',
                                        alignItems: 'center',
                                        marginTop: 5,
                                        flex: 1
                                    }}
                                >
                                    {!contact && (
                                        <VerifiedIcon
                                            width={14}
                                            height={14}
                                            style={{ alignSelf: 'center', marginRight: 4 }}
                                        />
                                    )}
                                    {!!contact && (
                                        <ContactIcon
                                            width={14}
                                            height={14}
                                            style={{ alignSelf: 'center', marginRight: 4 }}
                                        />
                                    )}
                                    <Text
                                        style={{
                                            fontWeight: '400',
                                            fontSize: 12,
                                            color: '#858B93',
                                            alignSelf: 'flex-start',
                                        }}
                                        numberOfLines={1}
                                        ellipsizeMode={'tail'}
                                    >
                                        {known.name}
                                    </Text>
                                </View>
                            </Pressable>
                        )}
                    </View>
                </View>
            </ScrollView>
            <View style={{ paddingHorizontal: 16 }}>
                {transaction.base.kind === 'out' && (transaction.base.body === null || transaction.base.body.type !== 'payload') && (
                    <View style={{ flexDirection: 'row', width: '100%', marginBottom: 8 }}>
                        <RoundButton
                            title={t('txPreview.sendAgain')}
                            style={{ flexGrow: 1 }}
                            onPress={() => navigation.navigateSimpleTransfer({
                                target: transaction.base.address!.toFriendly({ testOnly: AppConfig.isTestnet }),
                                comment: transaction.base.body && transaction.base.body.type === 'comment' ? transaction.base.body.comment : null,
                                amount: transaction.base.amount.neg(),
                                job: null,
                                stateInit: null,
                                jetton: null,
                                callback: null
                            })}
                            display={'secondary'}
                        />
                    </View>
                )}
                <View style={{ flexDirection: 'row', width: '100%', marginBottom: safeArea.bottom + 16, }}>
                    <RoundButton
                        title={t('common.close')}
                        style={{ flexGrow: 1 }}
                        onPress={navigation.goBack}
                        display={'default'}
                    />
                </View>
            </View>
            {Platform.OS === 'ios' && (
                <CloseButton
                    style={{ position: 'absolute', top: 12, right: 10 }}
                    onPress={navigation.goBack}
                />
            )}
        </View>
    );
});