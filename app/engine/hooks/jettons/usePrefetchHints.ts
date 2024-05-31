import { useEffect } from 'react';
import { useHints } from './useHints';
import { useNetwork } from '../network/useNetwork';
import { Queries } from '../../queries';
import { fetchMetadata } from '../../metadata/fetchMetadata';
import { getLastBlock } from '../../accountWatcher';
import { useClient4 } from '../network/useClient4';
import { JettonMasterState, fetchJettonMasterContent } from '../../metadata/fetchJettonMasterContent';
import { Address } from '@ton/core';
import { StoredContractMetadata, StoredJettonWallet } from '../../metadata/StoredMetadata';
import { log } from '../../../utils/log';
import { tryFetchJettonWallet } from '../../metadata/introspections/tryFetchJettonWallet';
import { TonClient4 } from '@ton/ton';
import { QueryClient } from '@tanstack/react-query';
import { storage } from '../../../storage/storage';
import { create, keyResolver, windowedFiniteBatchScheduler } from "@yornaath/batshit";
import { clients } from '../../clients';
import { AsyncLock } from 'teslabot';
import memoize from '../../../utils/memoize';

let jettonFetchersLock = new AsyncLock();

const metadataBatcher = memoize((client: TonClient4, isTestnet: boolean) => {
    return create({
        fetcher: async (addressesString: string[]) => {
            return await jettonFetchersLock.inLock(async () => {
                log(`[contract-metadata] 🟡 batch: ${addressesString.length}`);
                let measurement = performance.now();

                let result = await Promise.all(addressesString.map(async (addressString) => {

                    let address = Address.parse(addressString);
                    let metadata = await fetchMetadata(client, await getLastBlock(), address, isTestnet);

                    return {
                        jettonMaster: metadata.jettonMaster ? {
                            content: metadata.jettonMaster.content,
                            mintable: metadata.jettonMaster.mintalbe,
                            owner: metadata.jettonMaster.owner?.toString({ testOnly: isTestnet }) ?? null,
                            totalSupply: metadata.jettonMaster.totalSupply.toString(10),
                        } : null,
                        jettonWallet: metadata.jettonWallet ? {
                            balance: metadata.jettonWallet.balance.toString(10),
                            master: metadata.jettonWallet.master.toString({ testOnly: isTestnet }),
                            owner: metadata.jettonWallet.owner.toString({ testOnly: isTestnet }),
                            address: addressString,
                        } : null,
                        seqno: metadata.seqno,
                        address: address.toString({ testOnly: isTestnet }),
                    }
                }));

                log('[contract-metadata] 🟢 in ' + (performance.now() - measurement).toFixed(1));
                return result;
            })
        },
        resolver: keyResolver('address'),
        scheduler: windowedFiniteBatchScheduler({ windowMs: 1000, maxBatchSize: 40 }),
    });
});

const masterBatcher = memoize((isTestnet: boolean) => {
    return create({
        fetcher: async (masters: string[]) => {
            return await jettonFetchersLock.inLock(async () => {
                let result: (JettonMasterState & { address: string })[] = [];
                log(`[jetton-master] 🟡 batch: ${masters.length}`);
                let measurement = performance.now();

                await Promise.all(masters.map(async (master) => {
                    let address = Address.parse(master);
                    let masterContent = await fetchJettonMasterContent(address, isTestnet);
                    if (!masterContent) {
                        return null;
                    }

                    result.push({
                        ...masterContent,
                        address: address.toString({ testOnly: isTestnet }),
                    });
                }));

                log(`[jetton-master] 🟢 in ${(performance.now() - measurement).toFixed(1)}`);

                return result;
            });
        },
        resolver: keyResolver('address'),
        scheduler: windowedFiniteBatchScheduler({ windowMs: 1000, maxBatchSize: 10 })
    })
});

const walletBatcher = memoize((client: TonClient4, isTestnet: boolean) => {
    return create({
        fetcher: async (wallets: string[]) => {
            return await jettonFetchersLock.inLock(async () => {
                let result: StoredJettonWallet[] = [];
                log(`[jetton-wallet] 🟡 batch ${wallets.length}`);
                let measurement = performance.now();
                await Promise.all(wallets.map(async (wallet) => {

                    let address = Address.parse(wallet);

                    let data = await tryFetchJettonWallet(client, await getLastBlock(), address);
                    if (!data) {
                        return;
                    }

                    result.push({
                        balance: data.balance.toString(10),
                        master: data.master.toString({ testOnly: isTestnet }),
                        owner: data.owner.toString({ testOnly: isTestnet }),
                        address: wallet
                    });
                }));
                log(`[jetton-wallet] 🟢 in ${(performance.now() - measurement).toFixed(1)}`);
                return result;
            });
        },
        resolver: keyResolver('address'),
        scheduler: windowedFiniteBatchScheduler({ windowMs: 1000, maxBatchSize: 10 })
    })
});

export function contractMetadataQueryFn(isTestnet: boolean, addressString: string) {
    return async (): Promise<StoredContractMetadata> => {
        return metadataBatcher(clients.ton[isTestnet ? 'testnet' : 'mainnet'], isTestnet).fetch(addressString);
    }
}

export function jettonMasterContentQueryFn(master: string, isTestnet: boolean) {
    return async (): Promise<(JettonMasterState & { address: string }) | null> => {
        return masterBatcher(isTestnet).fetch(master);
    }
}


export function jettonWalletQueryFn(wallet: string, isTestnet: boolean) {
    return async (): Promise<StoredJettonWallet | null> => {
        return walletBatcher(clients.ton[isTestnet ? 'testnet' : 'mainnet'], isTestnet).fetch(wallet);
    }
}

const currentJettonsVersion = 3;
const jettonsVersionKey = 'jettons-version';

function invalidateJettonsDataIfVersionChanged(queryClient: QueryClient) {
    try {
        const lastVersion = storage.getNumber(jettonsVersionKey);

        if (!lastVersion || lastVersion < currentJettonsVersion) {
            storage.set(jettonsVersionKey, currentJettonsVersion);
            queryClient.invalidateQueries(['jettons', 'master']);
            queryClient.invalidateQueries(['contractMetadata']);
        }
    } catch {
        // ignore
    }
}

export function usePrefetchHints(queryClient: QueryClient, address?: string) {
    const hints = useHints(address);
    const { isTestnet } = useNetwork();
    const client = useClient4(isTestnet);

    useEffect(() => {
        if (!address) {
            return;
        }

        (async () => {
            // Invalidate jettons data if version is changed
            invalidateJettonsDataIfVersionChanged(queryClient);

            // Prefetch contract metadata and jetton master content
            await Promise.all(hints.map(async hint => {
                let result = queryClient.getQueryData<StoredContractMetadata>(Queries.ContractMetadata(hint));
                if (!result) {
                    result = await queryClient.fetchQuery({
                        queryKey: Queries.ContractMetadata(hint),
                        queryFn: contractMetadataQueryFn(isTestnet, hint),
                    });

                    if (result?.jettonWallet) {
                        queryClient.setQueryData(Queries.Account(hint).JettonWallet(), () => {
                            return {
                                balance: result!.jettonWallet!.balance,
                                master: result!.jettonWallet!.master,
                                owner: result!.jettonWallet!.owner,
                                address: hint
                            } as StoredJettonWallet
                        });
                    }
                }

                const masterAddress = result?.jettonWallet?.master;
                let masterContent = masterAddress
                    ? queryClient.getQueryData<JettonMasterState>(Queries.Jettons().MasterContent(masterAddress))
                    : undefined;

                if (masterAddress && !masterContent) {
                    let masterAddress = result!.jettonWallet!.master;
                    await queryClient.prefetchQuery({
                        queryKey: Queries.Jettons().MasterContent(masterAddress),
                        queryFn: jettonMasterContentQueryFn(masterAddress, isTestnet),
                    });
                }

                masterContent = queryClient.getQueryData<JettonMasterState>(Queries.Jettons().MasterContent(hint));

                if (result?.jettonMaster && !masterContent) {
                    await queryClient.prefetchQuery({
                        queryKey: Queries.Jettons().MasterContent(hint),
                        queryFn: jettonMasterContentQueryFn(hint, isTestnet),
                    });
                }
            }));
        })().catch((e) => {
            console.warn(e);
        });
    }, [address, hints]);
}