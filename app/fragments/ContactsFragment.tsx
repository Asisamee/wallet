import { StatusBar } from "expo-status-bar";
import React, { RefObject, createRef, useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Platform, View, Text, ScrollView, KeyboardAvoidingView, LayoutAnimation } from "react-native";
import Animated, { FadeInDown, FadeInLeft, FadeOutRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Address } from "@ton/core";
import { AddressDomainInput } from "../components/address/AddressDomainInput";
import { AndroidToolbar } from "../components/topbar/AndroidToolbar";
import { ATextInputRef } from "../components/ATextInput";
import { CloseButton } from "../components/CloseButton";
import { ContactItemView } from "../components/Contacts/ContactItemView";
import { RoundButton } from "../components/RoundButton";
import { fragment } from "../fragment";
import { t } from "../i18n/t";
import { formatDate, getDateKey } from "../utils/dates";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import { TransactionView } from "./wallet/views/TransactionView";
import LottieView from 'lottie-react-native';
import { useClient4, useDontShowComments, useAddressBook, useNetwork, useSelectedAccount, useSpamMinAmount, useTheme, useAccountTransactions, useServerConfig } from '../engine/hooks';
import { useContacts } from "../engine/hooks/contacts/useContacts";
import { TransactionDescription } from '../engine/types';

export const ContactsFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const { isTestnet } = useNetwork();
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const contacts = useContacts();
    const account = useSelectedAccount();
    const client = useClient4(isTestnet);
    const transactions = useAccountTransactions(client, account?.addressString ?? '');
    const [spamMinAmount,] = useSpamMinAmount();
    const [dontShowComments,] = useDontShowComments();
    const [addressBook, updateAddressBook] = useAddressBook();
    const spamWallets = useServerConfig().data?.wallets?.spam ?? [];

    const addToDenyList = useCallback((address: string | Address, reason: string = 'spam') => {
        let addr = '';

        if (address instanceof Address) {
            addr = address.toString({ testOnly: isTestnet });
        } else {
            addr = address;
        }

        return updateAddressBook((doc) => doc.denyList[addr] = { reason });
    }, [isTestnet, updateAddressBook]);

    const [addingAddress, setAddingAddress] = useState(false);
    const [domain, setDomain] = useState<string>();
    const [target, setTarget] = useState('');
    const [addressDomainInput, setAddressDomainInput] = useState('');

    const inputRef: RefObject<ATextInputRef> = createRef();

    const validAddress = useMemo(() => {
        try {
            const valid = target.trim();
            Address.parse(valid);
            return valid;
        } catch (error) {
            return null;
        }
    }, [target]);

    const onAddContact = useCallback(() => {
        if (validAddress) {
            setAddingAddress(false);
            navigation.navigate('Contact', { address: validAddress });
        }
    }, [validAddress]);

    const contactsList = useMemo(() => {
        return Object.entries(contacts);
    }, [contacts]);

    const editContact = useMemo(() => {
        return !!contactsList.find(([key, value]) => {
            return key === target
        });
    }, [contactsList, target]);

    const transactionsComponents: any[] = useMemo(() => {
        if (!transactions || !account) {
            return [];
        }

        let transactionsSectioned: { title: string, items: TransactionDescription[] }[] = [];
        if (transactions.data.length > 0) {
            let lastTime: string = getDateKey(transactions.data[0].base.time);
            let lastSection: TransactionDescription[] = [];
            let title = formatDate(transactions.data[0].base.time);
            transactionsSectioned.push({ title, items: lastSection });
            for (let t of transactions.data.length >= 3 ? transactions.data.slice(0, 3) : transactions.data) {
                let time = getDateKey(t.base.time);
                if (lastTime !== time) {
                    lastSection = [];
                    lastTime = time;
                    title = formatDate(t.base.time);
                    transactionsSectioned.push({ title, items: lastSection });
                }
                lastSection.push(t);
            }
        }

        const views: any[] = [];
        for (let s of transactionsSectioned) {
            views.push(
                <View key={'t-' + s.title} style={{ marginTop: 8, backgroundColor: theme.background }} collapsable={false}>
                    <Text style={{ fontSize: 18, fontWeight: '700', marginHorizontal: 16, marginVertical: 8 }}>{s.title}</Text>
                </View>
            );
            views.push(
                <View
                    key={'s-' + s.title}
                    style={{ marginHorizontal: 16, borderRadius: 14, backgroundColor: theme.surfacePimary, overflow: 'hidden' }}
                    collapsable={false}
                >
                    {s.items.map((t, i) => (
                        <TransactionView
                            own={account.address}
                            tx={t}
                            separator={i < s.items.length - 1}
                            key={'tx-' + t.id}
                            onPress={() => { }}
                            theme={theme}
                            navigation={navigation}
                            addToDenyList={addToDenyList}
                            spamMinAmount={spamMinAmount}
                            dontShowComments={dontShowComments}
                            denyList={addressBook.denyList}
                            contacts={addressBook.contacts}
                            isTestnet={isTestnet}
                            spamWallets={spamWallets}
                        />
                    ))}
                </View >
            );
        }
        return views;
    }, [transactions]);

    useLayoutEffect(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }, [addingAddress]);

    // 
    // Lottie animation
    // 
    const anim = useRef<LottieView>(null);
    useLayoutEffect(() => {
        if (Platform.OS === 'ios') {
            setTimeout(() => {
                anim.current?.play()
            }, 300);
        }
    }, []);

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar pageTitle={t('contacts.title')} />
            {Platform.OS === 'ios' && (
                <View style={{
                    marginTop: 17,
                    height: 32
                }}>
                    <Text style={[{
                        fontWeight: '600',
                        fontSize: 17,
                        color: theme.textPrimary
                    }, { textAlign: 'center' }]}>
                        {t('contacts.title')}
                    </Text>
                </View>
            )}
            {(!contactsList || contactsList.length === 0) && (
                <View style={{
                    flex: 1,
                    justifyContent: 'center', alignItems: 'center'
                }}>
                    <View style={{ alignItems: 'center', paddingHorizontal: 16, }}>
                        <LottieView
                            ref={anim}
                            source={require('../../assets/animations/empty.json')}
                            autoPlay={true}
                            loop={true}
                            style={{ width: 128, height: 128, maxWidth: 140, maxHeight: 140 }}
                        />
                        <Text style={{
                            fontSize: 18,
                            fontWeight: '700',
                            marginHorizontal: 8,
                            marginBottom: 8,
                            textAlign: 'center',
                            color: theme.textPrimary,
                        }}
                        >
                            {t('contacts.empty')}
                        </Text>
                        <Text style={{
                            fontSize: 16,
                            color: theme.textSecondary
                        }}>
                            {t('contacts.description')}
                        </Text>
                    </View>
                    <View style={{ width: '100%' }}>
                        {transactionsComponents}
                    </View>
                </View>
            )}
            {(contactsList && contactsList.length > 0) && (
                <ScrollView style={{ flexGrow: 1 }}>
                    <View style={{
                        marginBottom: 16, marginTop: 17,
                        borderRadius: 14,
                        paddingHorizontal: 16,
                        flexShrink: 1,
                    }}>
                        {contactsList.map((d) => {
                            return (
                                <ContactItemView
                                    key={`contact-${d[0]}`}
                                    addr={d[0]}
                                />
                            );
                        })}
                    </View>
                </ScrollView>
            )}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'position' : undefined}
                style={{
                    marginTop: 16,
                    marginBottom: safeArea.bottom + 16,
                    position: 'absolute', bottom: 0, left: 16, right: 16,
                }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 16}
            >
                {addingAddress && (
                    <>
                        {Platform.OS === 'android' && (
                            <Animated.View entering={FadeInDown}>
                                <View style={{
                                    marginBottom: 16, marginTop: 17,
                                    backgroundColor: theme.surfacePimary,
                                    borderRadius: 14,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}>
                                    <AddressDomainInput
                                        input={addressDomainInput}
                                        onInputChange={setAddressDomainInput}
                                        target={target}
                                        index={1}
                                        ref={inputRef}
                                        onTargetChange={setTarget}
                                        onDomainChange={setDomain}
                                        style={{
                                            backgroundColor: theme.transparent,
                                            paddingHorizontal: 0,
                                            marginHorizontal: 16,
                                        }}
                                        onSubmit={onAddContact}
                                        labelText={t('contacts.contactAddress')}
                                    />
                                </View>
                            </Animated.View>
                        )}
                        {Platform.OS !== 'android' && (
                            <View style={{
                                marginBottom: 16, marginTop: 17,
                                backgroundColor: theme.surfacePimary,
                                borderRadius: 14,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}>
                                <AddressDomainInput
                                    input={addressDomainInput}
                                    onInputChange={setAddressDomainInput}
                                    target={target}
                                    index={1}
                                    ref={inputRef}
                                    onTargetChange={setTarget}
                                    onDomainChange={setDomain}
                                    style={{
                                        backgroundColor: theme.transparent,
                                        paddingHorizontal: 0,
                                        marginHorizontal: 16,
                                    }}
                                    onSubmit={onAddContact}
                                    labelText={t('contacts.contactAddress')}
                                />
                            </View>
                        )}
                    </>
                )}
                <View style={{ flexDirection: 'row', width: '100%' }}>
                    {addingAddress && (
                        <>
                            {Platform.OS === 'android' && (
                                <Animated.View entering={FadeInLeft} exiting={FadeOutRight}>
                                    <RoundButton
                                        title={t('common.cancel')}
                                        disabled={!addingAddress}
                                        onPress={() => setAddingAddress(false)}
                                        display={'secondary'}
                                        style={{ flexGrow: 1, marginRight: 8 }}
                                    />
                                </Animated.View>
                            )}
                            {Platform.OS !== 'android' && (
                                <RoundButton
                                    title={t('common.cancel')}
                                    disabled={!addingAddress}
                                    onPress={() => setAddingAddress(false)}
                                    display={'secondary'}
                                    style={{ flexGrow: 1, marginRight: 8 }}
                                />
                            )}
                        </>
                    )}
                    <RoundButton
                        title={addingAddress && editContact ? t('contacts.edit') : t('contacts.add')}
                        style={{ flexGrow: 1 }}
                        disabled={addingAddress && !validAddress}
                        onPress={() => {
                            if (addingAddress) {
                                onAddContact();
                                return;
                            }
                            setAddingAddress(true);
                        }}
                        display={'default'}
                    />
                </View>
            </KeyboardAvoidingView>
            {Platform.OS === 'ios' && (
                <CloseButton
                    style={{ position: 'absolute', top: 12, right: 10 }}
                    onPress={() => {
                        navigation.goBack();
                    }}
                />
            )}
        </View>
    )
});