import { t } from './i18n/t';
import { useTypedNavigation } from './utils/useTypedNavigation';
import { ResolvedUrl } from './utils/resolveUrl';
import { Queries } from './engine/queries';
import { useAccountTransactions, useClient4, useSetAppState } from './engine/hooks';
import { useSelectedAccount } from './engine/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { Address } from '@ton/core';
import { fetchAccountTransactions } from './engine/api/fetchAccountTransactions';
import { contractMetadataQueryFn, jettonMasterContentQueryFn } from './engine/hooks/jettons/usePrefetchHints';
import { getJettonMasterAddressFromMetadata, parseStoredMetadata } from './engine/hooks/transactions/useAccountTransactions';
import { getAppState } from './storage/appState';
import { useCallback } from 'react';
import { ToastDuration, useToaster } from './components/toast/ToastProvider';
import { jettonWalletAddressQueryFn, jettonWalletQueryFn } from './engine/hooks/jettons/usePrefetchHints';
import { useGlobalLoader } from './components/useGlobalLoader';
import { StoredJettonWallet } from './engine/metadata/StoredMetadata';

export function useLinkNavigator(
    isTestnet: boolean,
    toastProps?: { duration?: ToastDuration, marginBottom?: number }
) {
    const navigation = useTypedNavigation();
    const selected = useSelectedAccount();
    const updateAppState = useSetAppState();
    const queryClient = useQueryClient();
    const txs = useAccountTransactions(selected?.addressString ?? '', { refetchOnMount: true });
    const toaster = useToaster();
    const loader = useGlobalLoader();

    const handler = useCallback(async (resolved: ResolvedUrl) => {
        if (resolved.type === 'transaction') {
            if (resolved.payload) {
                navigation.navigateTransfer({
                    order: {
                        type: 'order',
                        messages: [{
                            target: resolved.address.toString({ testOnly: isTestnet }),
                            amount: resolved.amount || BigInt(0),
                            amountAll: false,
                            stateInit: resolved.stateInit,
                            payload: resolved.payload,
                        }]
                    },
                    text: resolved.comment,
                    job: null,
                    callback: null
                });
            } else {
                navigation.navigateSimpleTransfer({
                    target: resolved.address.toString({ testOnly: isTestnet }),
                    comment: resolved.comment,
                    amount: resolved.amount,
                    stateInit: resolved.stateInit,
                    job: null,
                    jetton: null,
                    callback: null
                });
            }
        }
        if (resolved.type === 'jetton-transaction') {
            if (!selected) {
                return;
            }

            const hideloader = loader.show();

            let jettonWalletAddress = queryClient.getQueryData<string | null>(Queries.Account(selected.addressString).JettonWallet());

            if (!jettonWalletAddress) {
                try {
                    jettonWalletAddress = await queryClient.fetchQuery({
                        queryKey: Queries.Jettons().Address(selected!.addressString).Wallet(resolved.jettonMaster.toString({ testOnly: isTestnet })),
                        queryFn: jettonWalletAddressQueryFn(resolved.jettonMaster.toString({ testOnly: isTestnet }), selected!.addressString, isTestnet)
                    });
                } catch {
                    console.warn('Failed to fetch jetton wallet address', selected!.addressString, resolved.jettonMaster.toString({ testOnly: isTestnet }));
                }
            }

            if (!jettonWalletAddress) {
                toaster.show({
                    message: t('transfer.wrongJettonTitle'),
                    ...toastProps, type: 'error'
                });
                hideloader();
                return;
            }

            let jettonWallet = queryClient.getQueryData<StoredJettonWallet | null>(Queries.Account(jettonWalletAddress!).JettonWallet());

            if (!jettonWallet) {
                try {
                    jettonWallet = await queryClient.fetchQuery({
                        queryKey: Queries.Account(jettonWalletAddress!).JettonWallet(),
                        queryFn: jettonWalletQueryFn(jettonWalletAddress!, isTestnet),
                    });
                } catch {                    
                    console.warn('Failed to fetch jetton wallet', jettonWalletAddress);
                }
            }

            if (!jettonWallet) {
                toaster.show({
                    message: t('transfer.wrongJettonMessage'),
                    ...toastProps, type: 'error'
                });
                hideloader();
                return;
            }

            hideloader();

            navigation.navigateSimpleTransfer({
                target: resolved.address.toString({ testOnly: isTestnet }),
                comment: resolved.comment,
                amount: resolved.amount,
                stateInit: null,
                job: null,
                jetton: Address.parse(jettonWalletAddress),
                callback: null,
                payload: resolved.payload,
                feeAmount: resolved.feeAmount,
                forwardAmount: resolved.forwardAmount,
            });
        }

        if (resolved.type === 'connect') {
            navigation.navigate('Authenticate', {
                session: resolved.session,
                endpoint: resolved.endpoint
            });
        }
        if (resolved.type === 'tonconnect') {
            navigation.navigate('TonConnectAuthenticate', { query: resolved.query, type: 'qr' });
        }
        if (resolved.type === 'install') {
            navigation.navigate('Install', {
                url: resolved.url,
                title: resolved.customTitle,
                image: resolved.customImage
            });
        }

        if (resolved.type === 'tx') {
            const hideloader = loader.show();

            let lt = resolved.lt;
            let hash = resolved.hash;

            try {
                if (!!selected?.addressString) {
                    const isSelectedAddress = selected?.address.equals(Address.parse(resolved.address));
                    let transaction = isSelectedAddress ? txs.data?.find(tx => tx.id === `${lt}_${hash}`) : undefined;

                    // If transaction is not found in the list, fetch it from the server
                    if (!transaction) {
                        const rawTxs = await fetchAccountTransactions(resolved.address, isTestnet, { lt, hash });
                        if (rawTxs.length > 0) {
                            const base = rawTxs[0];

                            // Fetch metadata for all mentioned addresses
                            const metadatas = (await Promise.all(base.parsed.mentioned.map(async (address) => {
                                return await (contractMetadataQueryFn(isTestnet, address)());
                            })));

                            // Find metadata for the base address
                            const metadata = metadatas.find(m => m?.address === base.parsed.resolvedAddress) ?? null;
                            const parsedMetadata = metadata ? parseStoredMetadata(metadata) : null;
                            const jettonMaster = getJettonMasterAddressFromMetadata(metadata);
                            // Fetch jetton master content
                            const masterContent = jettonMaster ? await jettonMasterContentQueryFn(jettonMaster, isTestnet)() : null;

                            transaction = {
                                id: `${base.lt}_${base.hash}`,
                                base: base,
                                icon: masterContent?.image?.preview256 ?? null,
                                masterMetadata: masterContent,
                                masterAddressStr: jettonMaster,
                                metadata: parsedMetadata,
                                verified: null,
                                op: null,
                                title: null
                            };
                        }
                    }

                    // If transaction is found, navigate to it
                    if (transaction) {

                        // If transaction is for the selected address, navigate to it
                        if (isSelectedAddress) {
                            navigation.navigate('Transaction', { transaction });
                        } else { // If transaction is for another address, navigate to the address first
                            const appState = getAppState();
                            const address = Address.parse(resolved.address);
                            const index = appState.addresses.findIndex((a) => a.address.equals(address));

                            updateAppState({ ...appState, selected: index }, isTestnet);

                            navigation.navigateAndReplaceHome({ navigateTo: { type: 'tx', transaction } });
                        }
                    }
                }
            } catch {
                throw Error('Failed to resolve transaction link');
            } finally {
                hideloader();
            }

        }
    }, [selected, txs, updateAppState]);

    return handler;
}
