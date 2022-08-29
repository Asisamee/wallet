import BN from "bn.js";
import { Address, fromNano } from "ton";
import { AppConfig } from "../../AppConfig";
import { Engine } from "../Engine";
import { Transaction } from "../Transaction";
import { atom, atomFamily, RecoilState, RecoilValueReadOnly, selector, useRecoilValue, selectorFamily } from "recoil";
import * as FileSystem from 'expo-file-system';
import { ContractMetadata } from "../metadata/Metadata";
import { JettonMasterState } from "../sync/startJettonMasterSync";
import { createHistorySync } from "../sync/createHistorySync";
import { Operation } from "../transactions/types";
import { resolveOperation } from "../transactions/resolveOperation";
import { PluginState } from "../sync/startPluginSync";
import { t } from "../../i18n/t";

export type WalletState = {
    balance: BN;
    seqno: number;
    transactions: { id: string, time: number }[];
    next: { lt: string, hash: string } | null;
}

export type JettonsState = {
    jettons: {
        wallet: Address,
        master: Address,
        balance: BN,
        name: string,
        symbol: string,
        description: string,
        icon: string | null,
        decimals: number | null,
        disabled?: boolean
    }[]
}

export type PluginsState = {
    plugins: PluginState[]
};

export type TransactionDescription = {
    base: Transaction;
    metadata: ContractMetadata | null;
    masterMetadata: JettonMasterState | null;
    operation: Operation;
    icon: string | null;
};

export class WalletProduct {

    readonly engine: Engine;
    readonly address: Address;

    // State
    #state: WalletState | null = null;
    #atom: RecoilState<WalletState | null>;
    #jettons: RecoilValueReadOnly<JettonsState>;
    #txs = new Map<string, Transaction>();
    #pending: Transaction[] = [];
    #txsAtom: (lt: string) => RecoilState<TransactionDescription>;
    #history: { loadMore(lt: string, hash: string): void };
    #plugins: RecoilValueReadOnly<PluginsState>;
    #initialLoad: boolean = true;

    constructor(engine: Engine) {
        this.engine = engine;
        this.address = engine.address;
        this.#atom = atom<WalletState | null>({
            key: 'wallet/' + engine.address.toFriendly({ testOnly: AppConfig.isTestnet }),
            default: null,
            dangerouslyAllowMutability: true
        });
        this.#jettons = selector({
            key: 'wallet/' + engine.address.toFriendly({ testOnly: AppConfig.isTestnet }) + '/jettons',
            get: ({ get }) => {

                // Load known jettons
                let knownJettons = get(engine.persistence.knownAccountJettons.item(engine.address).atom) || [];

                // Load disabled jeetons
                let disabledJettons = get(engine.persistence.disabledJettons.item(engine.address).atom) || [];

                // Load wallets
                let jettonWallets: { wallet: Address, master: Address, balance: BN }[] = [];
                for (let w of knownJettons) {
                    let jw = get(engine.persistence.jettonWallets.item(w).atom);
                    if (jw && jw.master) {
                        jettonWallets.push({ wallet: w, balance: jw.balance, master: jw.master });
                    }
                }

                // Load masters
                let jettonWalletsWithMasters: {
                    wallet: Address,
                    master: Address,
                    balance: BN,
                    name: string,
                    symbol: string,
                    description: string,
                    icon: string | null,
                    decimals: number | null,
                    disabled?: boolean
                }[] = [];
                for (let w of jettonWallets) {
                    let jm = get(engine.persistence.jettonMasters.item(w.master).atom);

                    if (jm && !jm.description) {
                        jm.description = `$${jm.symbol} ${t('jetton.token')}`;
                    }

                    if (jm && jm.name && jm.symbol && jm.description) {

                        // Image path
                        let icon: string | null = null;
                        if (jm.image) {
                            let downloaded;
                            if (typeof jm.image === 'string') {
                                downloaded = get(engine.persistence.downloads.item(jm.image).atom);
                            } else {
                                downloaded = get(engine.persistence.downloads.item(jm.image.preview256).atom);
                            }
                            if (downloaded) {
                                icon = FileSystem.cacheDirectory + downloaded;
                            }
                        }

                        const disabled = !!disabledJettons.find((m) => m.equals(w.master));

                        jettonWalletsWithMasters.push({
                            ...w,
                            name: jm.name,
                            symbol: jm.symbol,
                            description: jm.description,
                            icon,
                            decimals: jm.decimals,
                            disabled
                        });
                    }
                }

                return { jettons: jettonWalletsWithMasters }
            },
            dangerouslyAllowMutability: true
        });
        this.#txsAtom = atomFamily<TransactionDescription, string>({
            key: 'wallet/' + engine.address.toFriendly({ testOnly: AppConfig.isTestnet }) + '/txs',
            default: selectorFamily({
                key: 'wallet/' + engine.address.toFriendly({ testOnly: AppConfig.isTestnet }) + '/txs/default',
                get: (id) => ({ get }) => {
                    let base = this.#txs.get(id);
                    if (!base) {
                        throw Error('Invalid transaction #' + id);
                    }

                    // Metadata
                    let metadata: ContractMetadata | null = null;
                    if (base.address) {
                        metadata = get(engine.persistence.metadata.item(base.address).atom);
                    }

                    // Jetton master
                    let masterMetadata: JettonMasterState | null = null;
                    if (metadata && metadata.jettonWallet) {
                        masterMetadata = get(engine.persistence.jettonMasters.item(metadata.jettonWallet.master).atom);
                    } else if (metadata && metadata.jettonMaster && base.address) {
                        masterMetadata = get(engine.persistence.jettonMasters.item(base.address).atom);
                    }

                    // Operation
                    let operation = resolveOperation({ body: base.body, amount: base.amount, account: base.address || engine.address, metadata, jettonMaster: masterMetadata });

                    // Icon
                    let icon: string | null = null;
                    if (operation.image) {
                        let downloaded = get(engine.persistence.downloads.item(operation.image).atom);
                        if (downloaded) {
                            icon = FileSystem.cacheDirectory + downloaded;
                        }
                    }

                    return {
                        base,
                        metadata,
                        masterMetadata,
                        operation,
                        icon
                    };
                },
                dangerouslyAllowMutability: true
            }),
            dangerouslyAllowMutability: true
        })


        // Initial load
        engine.persistence.wallets.item(engine.address).for((state) => {
            console.log('initial ' + this.#initialLoad);
            // Update pending
            this.#pending = this.#pending.filter((v) => v.seqno && v.seqno > state.seqno);

            // Resolve hasMore flag
            let next: { lt: string, hash: string } | null = null;

            const transactions: Transaction[] = [];
            // Latest transaction
            const last = engine.persistence.fullAccounts.item(engine.address).value?.last;
            if (last) {
                let lastTx = this.engine.transactions.getWalletTransaction(engine.address, last.lt.toString(10));
                if (!!lastTx && lastTx.prev) {
                    next = { lt: lastTx.prev.lt, hash: lastTx.prev.hash };
                }
                while ((this.#initialLoad ? transactions.length < 10 : true) && next) {
                    let tx = this.engine.transactions.getWalletTransaction(engine.address, next.lt);
                    // Stop tx not found
                    if (!tx) {
                        break;
                    } else {
                        transactions.push(tx);

                        // Update
                        if (!this.#txs.has(next.lt)) {
                            this.#txs.set(tx.id, tx);
                        }

                        if (tx.prev) {
                            next = { lt: tx.prev.lt, hash: tx.prev.hash };
                        }
                    }
                }
            }

            console.log('loaded new state ' + transactions.length);

            if (this.#initialLoad) {
                this.#initialLoad = false;
            }

            // Resolve updated state
            this.#state = {
                balance: state.balance,
                seqno: state.seqno,
                transactions: [
                    ...this.#pending.map((v) => ({ id: v.id, time: v.time })),
                    ...transactions
                ],
                next
            };

            // Notify
            engine.recoil.updater(this.#atom, this.#state);
        });

        // History
        this.#history = createHistorySync(engine.address, engine);

        // Plugins
        this.#plugins = selector({
            key: 'wallet/' + engine.address.toFriendly({ testOnly: AppConfig.isTestnet }) + '/plugins',
            get: ({ get }) => {
                // Load wallet
                let wallet = get(engine.persistence.wallets.item(engine.address).atom);
                if (!wallet) {
                    return { plugins: [] }
                }

                // Load plugins
                let plugins: PluginState[] = [];
                for (let p of wallet.plugins) {
                    let pstate = get(engine.persistence.plugins.item(p).atom);
                    if (pstate) {
                        plugins.push(pstate);
                    }
                }

                return { plugins };
            },
            dangerouslyAllowMutability: true
        })
    }

    loadMore = (lt: string, hash: string) => {
        console.log('load more' + JSON.stringify({ lt, hash }));
        let tx = this.engine.transactions.getWalletTransaction(this.engine.address, lt);
        if (tx) {
            console.log('is stored');
            let next: { lt: string, hash: string } | null = null;
            const transactions = this.#state?.transactions || [];
            transactions.push(tx);

            if (!this.#txs.has(lt)) {
                this.#txs.set(tx.id, tx);
            }

            if (tx.prev) {
                next = { lt: tx.prev.lt, hash: tx.prev.hash };
            }

            console.log('is stored ' + transactions.length);

            // Resolve updated state
            if (this.#state) {

                this.#state = {
                    balance: this.#state.balance,
                    seqno: this.#state.seqno,
                    transactions: [
                        ...this.#pending.map((v) => ({ id: v.id, time: v.time })),
                        ...transactions
                    ],
                    next
                };

                // Notify
                this.engine.recoil.updater(this.#atom, this.#state);
            }
        } else {
            console.log('not stored, loadin more');
            this.#history.loadMore(lt, hash);
        }
    }

    registerPending(src: Transaction) {
        if (!this.#state) {
            return;
        }
        if (src.seqno === null) {
            return;
        }
        if (src.seqno < this.#state.seqno) {
            return;
        }
        if (src.status !== 'pending') {
            return;
        }

        // Update
        this.#state = { ...this.#state, transactions: [{ id: src.id, time: src.time }, ...this.#state.transactions] };
        this.#pending.push(src);
        this.#txs.set(src.id, src);

        // Notify
        this.engine.recoil.updater(this.#atom, this.#state);
    }

    useAccount() {
        return useRecoilValue(this.#atom);
    }

    useJettons() {
        return useRecoilValue(this.#jettons).jettons;
    }

    useTransaction(id: string) {
        return useRecoilValue(this.#txsAtom(id));
    }

    usePlugins() {
        return useRecoilValue(this.#plugins);
    }
}