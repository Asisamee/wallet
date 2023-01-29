import BN from "bn.js"
import React, { useLayoutEffect } from "react"
import { Alert, LayoutAnimation, Text, View } from "react-native"
import { ProductButton } from "./ProductButton"
import { useEngine } from "../../../engine/Engine"
import OldWalletIcon from '../../../../assets/ic_old_wallet.svg';
import SignIcon from '../../../../assets/ic_sign.svg';
import TransactionIcon from '../../../../assets/ic_transaction.svg';
import { useTypedNavigation } from "../../../utils/useTypedNavigation"
import { AppConfig } from "../../../AppConfig"
import { StakingProductComponent } from "../../../components/Staking/StakingProductComponent"
import { t } from "../../../i18n/t"
import { JettonProduct } from "./JettonProduct"
import { Theme } from "../../../Theme"
import { getConnectionReferences } from "../../../storage/appState"
import { extractDomain } from "../../../engine/utils/extractDomain"
import { AnimatedProductButton } from "./AnimatedProductButton"
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated"
import { RpcMethod, SEND_TRANSACTION_ERROR_CODES, SessionCrypto, WalletResponse } from "@tonconnect/protocol"
import { SendTransactionRequest, SignRawParams } from "../../../engine/tonconnect/types"
import { Address, Cell, fromNano, toNano } from "ton"
import { SendTransactionError } from "../../../engine/tonconnect/TonConnect"
import { getTimeSec } from "../../../utils/getTimeSec"

export const ProductsComponent = React.memo(() => {
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const oldWalletsBalance = engine.products.legacy.useState();
    const currentJob = engine.products.apps.useState();
    const jettons = engine.products.main.useJettons().filter((j) => !j.disabled);
    const extensions = engine.products.extensions.useExtensions();
    const tonconnectRequests = engine.products.tonConnect.usePendingRequests();
    const openExtension = React.useCallback((url: string) => {
        let domain = extractDomain(url);
        if (!domain) {
            return; // Shouldn't happen
        }
        let k = engine.persistence.domainKeys.getValue(domain);
        if (!k) {
            navigation.navigate('Install', { url });
        } else {
            navigation.navigate('App', { url });
        }
    }, []);
    const corpStatus = engine.products.corp.use();

    // Resolve accounts
    let accounts: React.ReactElement[] = [];
    if (oldWalletsBalance.gt(new BN(0))) {
        accounts.push(
            <AnimatedProductButton
                entering={FadeInUp}
                exiting={FadeOutDown}
                key={'old-wallets'}
                name={t('products.oldWallets.title')}
                subtitle={t("products.oldWallets.subtitle")}
                icon={OldWalletIcon}
                value={oldWalletsBalance}
                onPress={() => navigation.navigate('Migration')}
                style={{ marginVertical: 4 }}
            />
        );
    }

    for (let j of jettons) {
        if (j.balance.gt(new BN(0))) {
            accounts.push(
                <JettonProduct
                    key={'jt' + j.wallet.toFriendly()}
                    jetton={j}
                    navigation={navigation}
                    engine={engine}
                />
            );
        }
    }

    let removeExtension = React.useCallback((key: string) => {
        Alert.alert(t('auth.apps.delete.title'), t('auth.apps.delete.message'), [{ text: t('common.cancel') }, {
            text: t('common.delete'),
            style: 'destructive',
            onPress: () => {
                engine.products.extensions.removeExtension(key);
            }
        }]);
    }, []);

    // Resolve apps
    let apps: React.ReactElement[] = [];
    for (let e of extensions) {
        apps.push(
            <AnimatedProductButton
                entering={FadeInUp}
                exiting={FadeOutDown}
                key={e.key}
                name={e.name}
                subtitle={e.description ? e.description : e.url}
                image={e.image?.url}
                blurhash={e.image?.blurhash}
                value={null}
                onLongPress={() => removeExtension(e.key)}
                onPress={() => openExtension(e.url)}
                extension={true}
                style={{ marginVertical: 4 }}
            />
        );
    }

    apps.push(<StakingProductComponent key={'pool'} />);

    if (__DEV__) {

        console.log('sss', corpStatus);

        let statusText = 'Begin enrollment';
        if (corpStatus.status === 'need-kyc' || corpStatus.status === 'need-phone') {
            statusText = 'Continue enrollment';
        } else if (corpStatus.status === 'ready') {
            statusText = 'Press to view your crypto card';
        }

        apps.push(
            <ProductButton
                key={"card"}
                name="Cryptocard"
                subtitle={statusText}
                value={null}
                onPress={() => navigation.navigate('Corp')}
            />
        );
    }

    // Resolve tonconnect requests
    let tonconnect: React.ReactElement[] = [];
    const callback = (
        ok: boolean,
        result: Cell | null,
        request: { from: string } & SendTransactionRequest,
        sessionCrypto: SessionCrypto
    ) => {
        if (!ok) {
            engine.products.tonConnect.send(
                new SendTransactionError(
                    request.id,
                    SEND_TRANSACTION_ERROR_CODES.USER_REJECTS_ERROR,
                    'Wallet declined the request',
                ),
                sessionCrypto,
                request.from
            );
        }

        engine.products.tonConnect.send(
            { result: result?.toBoc({ idx: false }).toString('base64') ?? '', id: request.id },
            sessionCrypto,
            request.from
        );
        engine.products.tonConnect.deleteActiveRequest(request.from);
    }

    const checkRequest = (request: { from: string } & SendTransactionRequest) => {
        const params = JSON.parse(request.params[0]) as SignRawParams;

        console.log('checkRequest', {request});

        const isValidRequest =
            params && typeof params.valid_until === 'number' &&
            Array.isArray(params.messages) &&
            params.messages.every((msg) => !!msg.address && !!msg.amount);

        const session = engine.products.tonConnect.getConnectionByClientSessionId(request.from);
        if (!session) {
            // TODO dont allow sending tx without session & delete request
            Alert.alert(t('common.error'), t('products.tonConnect.errors.connection'));
            return;
        }
        const sessionCrypto = new SessionCrypto(session.sessionKeyPair);

        if (!isValidRequest) {
            engine.products.tonConnect.deleteActiveRequest(request.from);
            engine.products.tonConnect.send(
                {
                    error: {
                        code: SEND_TRANSACTION_ERROR_CODES.UNKNOWN_ERROR,
                        message: `Bad request`,
                    },
                    id: request.id.toString(),
                },
                sessionCrypto,
                request.from
            )
            return;
        }

        let target: Address;
        try {
            target = Address.parse(params.messages[0].address);
        } catch (e) {
            engine.products.tonConnect.deleteActiveRequest(request.from);
            engine.products.tonConnect.send(
                {
                    error: {
                        code: SEND_TRANSACTION_ERROR_CODES.UNKNOWN_ERROR,
                        message: `Wrong address`,
                    },
                    id: request.id.toString(),
                },
                sessionCrypto,
                request.from
            );
            return;
        }

        const { valid_until } = params;
        if (valid_until < getTimeSec()) {
            engine.products.tonConnect.deleteActiveRequest(request.from);
            engine.products.tonConnect.send(
                {
                    error: {
                        code: SEND_TRANSACTION_ERROR_CODES.UNKNOWN_ERROR,
                        message: `Request timed out`,
                    },
                    id: request.id.toString(),
                },
                sessionCrypto,
                request.from
            )
            return;
        }

        // TODO check why do we use an array of messages
        const message = params.messages[0];

        return {
            request,
            sessionCrypto,
            message: { target, ...message }
        }
    }

    for (let r of tonconnectRequests) {
        tonconnect.push(
            <AnimatedProductButton
                entering={FadeInUp}
                exiting={FadeOutDown}
                name={t('products.transactionRequest.title')}
                subtitle={t('products.transactionRequest.subtitle')}
                icon={TransactionIcon}
                value={null}
                onPress={() => {
                    const prepared = checkRequest(r);
                    if (r.method === 'sendTransaction' && prepared) {
                        navigation.navigateTransfer({
                            order: {
                                target: prepared.message.target.toFriendly({ testOnly: AppConfig.isTestnet }),
                                amount: toNano(fromNano(prepared.message.amount)),
                                payload: prepared.message.payload ? Cell.fromBoc(Buffer.from(prepared.message.payload, 'base64'))[0] : null,
                                stateInit: prepared.message.stateInit ? Cell.fromBoc(Buffer.from(prepared.message.stateInit, 'base64'))[0] : null,
                                amountAll: false
                            },
                            // job: currentJob.jobRaw,
                            // text: currentJob.job.text,
                            job: null,
                            text: null,
                            callback: (ok, result) => callback(ok, result, prepared.request, prepared.sessionCrypto)
                        });
                    }
                }}
            />
        );
    }

    useLayoutEffect(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }, [extensions, jettons, oldWalletsBalance, currentJob, tonconnectRequests]);

    console.log('tonconnectRequests', tonconnectRequests);

    return (
        <View style={{ paddingTop: 8 }}>
            {tonconnect}
            {currentJob && currentJob.job.type === 'transaction' && (
                <AnimatedProductButton
                    entering={FadeInUp}
                    exiting={FadeOutDown}
                    name={t('products.transactionRequest.title')}
                    subtitle={t('products.transactionRequest.subtitle')}
                    icon={TransactionIcon}
                    value={null}
                    onPress={() => {
                        if (currentJob.job.type === 'transaction') {
                            navigation.navigateTransfer({
                                order: {
                                    target: currentJob.job.target.toFriendly({ testOnly: AppConfig.isTestnet }),
                                    amount: currentJob.job.amount,
                                    payload: currentJob.job.payload,
                                    stateInit: currentJob.job.stateInit,
                                    amountAll: false
                                },
                                job: currentJob.jobRaw,
                                text: currentJob.job.text,
                                callback: null
                            });
                        }
                    }}
                />
            )}
            {currentJob && currentJob.job.type === 'sign' && (
                <AnimatedProductButton
                    entering={FadeInUp}
                    exiting={FadeOutDown}
                    name={t('products.signatureRequest.title')}
                    subtitle={t('products.signatureRequest.subtitle')}
                    icon={SignIcon}
                    value={null}
                    onPress={() => {
                        if (currentJob.job.type === 'sign') {
                            const connection = getConnectionReferences().find((v) => Buffer.from(v.key, 'base64').equals(currentJob.key));
                            if (!connection) {
                                return; // Just in case
                            }
                            navigation.navigateSign({
                                text: currentJob.job.text,
                                textCell: currentJob.job.textCell,
                                payloadCell: currentJob.job.payloadCell,
                                job: currentJob.jobRaw,
                                callback: null,
                                name: connection.name
                            });
                        }
                    }}
                />
            )}

            {apps.length > 0 && (
                <>
                    <View style={{ marginTop: 8, backgroundColor: Theme.background }} collapsable={false}>
                        <Text style={{ fontSize: 18, fontWeight: '700', marginHorizontal: 16, marginVertical: 8 }}>{t('products.services')}</Text>
                    </View>
                    {apps}
                </>
            )}

            {accounts.length > 0 && (
                <>
                    <View style={{ marginTop: 8, backgroundColor: Theme.background }} collapsable={false}>
                        <Text style={{ fontSize: 18, fontWeight: '700', marginHorizontal: 16, marginVertical: 8 }}>{t('products.accounts')}</Text>
                    </View>
                    {accounts}
                </>
            )}
        </View>
    )
})