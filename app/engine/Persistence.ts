import { MMKV } from "react-native-mmkv";
import { Address } from "ton";
import { PersistedCollection } from "./persistence/PersistedCollection";
import * as t from 'io-ts';
import * as c from './utils/codecs';
import BN from "bn.js";
import { ContractMetadata } from "./metadata/Metadata";
import { PluginState } from "./sync/startPluginSync";
import { LiteAccount } from "./sync/startAccountLiteSync";
import { FullAccount } from "./sync/startAccountFullSync";
import { WalletV4State } from "./sync/startWalletV4Sync";
import { JettonWalletState } from "./sync/startJettonWalletSync";
import { JettonMasterState } from "./sync/startJettonMasterSync";
import { StakingPoolState, StakingChart } from "./sync/startStakingPoolSync";
import { Engine } from "./Engine";
import { HintProcessingState } from "./sync/startHintSync";
import { TxHints } from "./sync/startHintsTxSync";
import { ConfigState } from "./sync/startConfigSync";
import { ServerConfig, serverConfigCodec } from "./api/fetchConfig";
import { AppData, appDataCodec, imagePreview } from "./api/fetchAppData";
import { DomainSubkey } from "./products/ExtensionsProduct";
import { SpamFilterConfig } from "../fragments/SpamFilterFragment";
import { WalletConfig, walletConfigCodec } from "./api/fetchWalletConfig";
import { HoldersAccountStatus, HoldersState } from "./holders/HoldersProduct";
import { StakingAPY } from "./api/fetchApy";
import { PriceState } from "./products/PriceProduct";
import { AccountBalanceChart } from "./sync/startAccountBalanceChartSync";
import { AppManifest, appManifestCodec } from "./api/fetchManifest";
import { ConnectedAppConnection, SendTransactionRequest } from "./tonconnect/types";
import { walletTransactionCodec } from "./transactions/codecs";
import { Transaction } from "./Transaction";
import { appConnectionCodec, pendingSendTransactionRpcRequestCodec } from "./tonconnect/codecs";
import { accountStateCodec } from "./api/holders/fetchAccountState";
import { CardsList as HoldersCardsList, cardsListCodec } from "./api/holders/fetchCards";
import { HoldersOfflineResMap, holdersOfflineAppCodec } from "./api/holders/fetchAppFile";
import { CardNotification } from "./api/holders/fetchCardsTransactions";
import { ExtensionStats, extensionStatsCodec } from "./api/reviews";

export class Persistence {

    readonly version: number = 20;
    readonly liteAccounts: PersistedCollection<Address, LiteAccount>;
    readonly fullAccounts: PersistedCollection<Address, FullAccount>;
    readonly accountBalanceChart: PersistedCollection<Address, AccountBalanceChart>;
    readonly parsedTransactions: PersistedCollection<{ address: Address, lt: BN }, Transaction>;
    readonly wallets: PersistedCollection<Address, WalletV4State>;
    readonly smartCursors: PersistedCollection<{ key: string, address: Address }, number>;
    readonly prices: PersistedCollection<void, PriceState>;
    readonly apps: PersistedCollection<Address, string>;
    readonly staking: PersistedCollection<{ address: Address, target: Address }, StakingPoolState>;
    readonly stakingChart: PersistedCollection<{ address: Address, target: Address }, StakingChart>;
    readonly stakingApy: PersistedCollection<void, StakingAPY>;
    readonly metadata: PersistedCollection<Address, ContractMetadata>;
    readonly metadataPending: PersistedCollection<void, { [key: string]: number }>;
    readonly plugins: PersistedCollection<Address, PluginState>;

    readonly jettonWallets: PersistedCollection<Address, JettonWalletState>;
    readonly jettonMasters: PersistedCollection<Address, JettonMasterState>;
    readonly knownJettons: PersistedCollection<void, Address[]>;
    readonly knownAccountJettons: PersistedCollection<Address, Address[]>;
    readonly disabledJettons: PersistedCollection<Address, Address[]>;

    readonly downloads: PersistedCollection<string, string>;
    readonly hintState: PersistedCollection<Address, HintProcessingState>;
    readonly hintRequest: PersistedCollection<Address, number>;
    readonly accountHints: PersistedCollection<Address, Address[]>;
    readonly scannerState: PersistedCollection<Address, TxHints>;

    readonly walletConfig: PersistedCollection<Address, WalletConfig>
    readonly serverConfig: PersistedCollection<void, ServerConfig>
    readonly config: PersistedCollection<void, ConfigState>;

    readonly dApps: PersistedCollection<string, AppData>;
    readonly dAppsStats: PersistedCollection<string, ExtensionStats>;
    readonly domainKeys: PersistedCollection<string, DomainSubkey>;

    // tonconnect
    readonly connectManifests: PersistedCollection<string, string>;
    readonly connectDApps: PersistedCollection<string, AppManifest>;
    readonly connectDAppRequests: PersistedCollection<void, SendTransactionRequest[]>;
    readonly connectAppConnections: PersistedCollection<string, ConnectedAppConnection[]>;

    readonly cloud: PersistedCollection<{ key: string, address: Address }, string>;

    readonly spamFilterConfig: PersistedCollection<void, SpamFilterConfig>

    readonly holdersStatus: PersistedCollection<Address, HoldersAccountStatus>;
    readonly holdersState: PersistedCollection<Address, HoldersState>;
    readonly holdersCards: PersistedCollection<Address, HoldersCardsList>;
    readonly holdersOfflineApp: PersistedCollection<void, HoldersOfflineResMap>;
    readonly holdersCardTransactions: PersistedCollection<string, CardNotification[]>;
    readonly holdersHiddenCards: PersistedCollection<Address, string[]>;

    constructor(storage: MMKV, engine: Engine) {
        if (storage.getNumber('storage-version') !== this.version) {
            storage.clearAll();
            storage.set('storage-version', this.version);
        }

        // Key formats
        const addressKey = (src: Address) => src.toFriendly({ testOnly: engine.isTestnet });
        const addressWithTargetKey = (src: { address: Address, target: Address }) => src.address.toFriendly({ testOnly: engine.isTestnet }) + '::' + src.target.toFriendly({ testOnly: engine.isTestnet });
        const transactionKey = (src: { address: Address, lt: BN }) => src.address.toFriendly({ testOnly: engine.isTestnet }) + '::' + src.lt.toString(10);
        const keyedAddressKey = (src: { address: Address, key: string }) => src.address.toFriendly({ testOnly: engine.isTestnet }) + '::' + src.key;
        const voidKey = (src: void) => 'void';
        const stringKey = (src: string) => Buffer.from(src).toString('base64');


        this.liteAccounts = new PersistedCollection({ storage, namespace: 'liteAccounts', key: addressKey, codec: liteAccountCodec, engine });
        this.fullAccounts = new PersistedCollection({ storage, namespace: 'fullAccounts', key: addressKey, codec: fullAccountCodec, engine });
        this.wallets = new PersistedCollection({ storage, namespace: 'wallets', key: addressKey, codec: walletCodec(engine.isTestnet), engine });
        this.parsedTransactions = new PersistedCollection({ storage, namespace: 'parsedTransactions', key: transactionKey, codec: walletTransactionCodec(engine.isTestnet), engine });
        this.smartCursors = new PersistedCollection({ storage, namespace: 'cursors', key: keyedAddressKey, codec: t.number, engine });
        this.prices = new PersistedCollection({ storage, namespace: 'prices', key: voidKey, codec: priceCodec, engine });
        this.apps = new PersistedCollection({ storage, namespace: 'apps', key: addressKey, codec: t.string, engine });
        this.staking = new PersistedCollection({ storage, namespace: 'staking', key: addressWithTargetKey, codec: stakingPoolStateCodec, engine });
        this.stakingApy = new PersistedCollection({ storage, namespace: 'stakingApy', key: voidKey, codec: apyCodec, engine });
        this.metadata = new PersistedCollection({ storage, namespace: 'metadata', key: addressKey, codec: metadataCodec(engine.isTestnet), engine });
        this.metadataPending = new PersistedCollection({ storage, namespace: 'metadataPending', key: voidKey, codec: codecPendingMetadata, engine });
        this.plugins = new PersistedCollection({ storage, namespace: 'plugins', key: addressKey, codec: pluginStateCodec(engine.isTestnet), engine });
        this.downloads = new PersistedCollection({ storage, namespace: 'downloads', key: stringKey, codec: t.string, engine });

        // Hints
        this.hintState = new PersistedCollection({ storage, namespace: 'hintState', key: addressKey, codec: hintProcessingState, engine });
        this.hintRequest = new PersistedCollection({ storage, namespace: 'hintRequest', key: addressKey, codec: t.number, engine });
        this.accountHints = new PersistedCollection({ storage, namespace: 'hintsAccount', key: addressKey, codec: t.array(c.address(engine.isTestnet)), engine });
        this.scannerState = new PersistedCollection({ storage, namespace: 'hintsScanner', key: addressKey, codec: hintScannerCodec, engine });

        // Jettons
        this.jettonWallets = new PersistedCollection({ storage, namespace: 'jettonWallets', key: addressKey, codec: jettonWalletCodec(engine.isTestnet), engine });
        this.jettonMasters = new PersistedCollection({ storage, namespace: 'jettonMasters', key: addressKey, codec: jettonMasterCodec, engine });
        this.knownJettons = new PersistedCollection({ storage, namespace: 'knownJettons', key: voidKey, codec: t.array(c.address(engine.isTestnet)), engine });
        this.disabledJettons = new PersistedCollection({ storage, namespace: 'disabledJettons', key: addressKey, codec: t.array(c.address(engine.isTestnet)), engine });
        this.knownAccountJettons = new PersistedCollection({ storage, namespace: 'knownAccountJettons', key: addressKey, codec: t.array(c.address(engine.isTestnet)), engine });

        // Configs
        this.config = new PersistedCollection({ storage, namespace: 'config', key: voidKey, codec: configCodec(engine.isTestnet), engine });
        this.serverConfig = new PersistedCollection({ storage, namespace: 'serverConfig', key: voidKey, codec: serverConfigCodec, engine });
        this.walletConfig = new PersistedCollection({ storage, namespace: 'walletConfig', key: addressKey, codec: walletConfigCodec, engine });

        // dApps
        this.dApps = new PersistedCollection({ storage, namespace: 'dApps', key: stringKey, codec: appDataCodec, engine });
        this.dAppsStats = new PersistedCollection({ storage, namespace: 'dAppsStats', key: stringKey, codec: extensionStatsCodec, engine });
        this.domainKeys = new PersistedCollection({ storage, namespace: 'domainKeys', key: stringKey, codec: domainKeyCodec, engine });

        // tonconnect
        this.connectDApps = new PersistedCollection({ storage, namespace: 'connectDApps', key: stringKey, codec: appManifestCodec, engine });
        this.connectManifests = new PersistedCollection({ storage, namespace: 'connectManifests', key: stringKey, codec: t.string, engine });
        this.connectDAppRequests = new PersistedCollection({ storage, namespace: 'connectDAppRequests', key: voidKey, codec: t.array(pendingSendTransactionRpcRequestCodec), engine });
        this.connectAppConnections = new PersistedCollection({ storage, namespace: 'connectConnectedApps', key: stringKey, codec: t.array(appConnectionCodec), engine });

        // Cloud
        this.cloud = new PersistedCollection({ storage, namespace: 'cloud', key: keyedAddressKey, codec: t.string, engine });

        // SpamFilter
        this.spamFilterConfig = new PersistedCollection({ storage, namespace: 'spamFilter', key: voidKey, codec: spamFilterCodec, engine });

        // Holders
        this.holdersStatus = new PersistedCollection({ storage, namespace: 'holdersStatus', key: addressKey, codec: holdersStatusCodec, engine });
        this.holdersState = new PersistedCollection({ storage, namespace: 'holdersState', key: addressKey, codec: holdersStateCodec, engine });
        this.holdersCards = new PersistedCollection({ storage, namespace: 'holdersAccount', key: addressKey, codec: cardsListCodec, engine });
        this.holdersOfflineApp = new PersistedCollection({ storage, namespace: 'holdersOfflineApp', key: voidKey, codec: holdersOfflineAppCodec, engine });
        this.holdersCardTransactions = new PersistedCollection({ storage, namespace: 'holdersCardTransactions', key: stringKey, codec: holdersCardTransactionsCodec, engine });
        this.holdersHiddenCards = new PersistedCollection({ storage, namespace: 'holdersHiddenCards', key: addressKey, codec: t.array(t.string), engine });

        // Charts
        this.stakingChart = new PersistedCollection({ storage, namespace: 'stakingChart', key: addressWithTargetKey, codec: stakingWeeklyChartCodec, engine });
        this.accountBalanceChart = new PersistedCollection({ storage, namespace: 'accountBalanceChart', key: addressKey, codec: accountBalanceChartCodec, engine });
    }
}

// Codecs
const liteAccountCodec = t.type({
    balance: c.bignum,
    block: t.number,
    last: t.union([t.null, t.type({ lt: c.bignum, hash: t.string })]),
    storageStats: t.union([t.null, t.type({
        lastPaid: t.number,
        duePayment: t.union([t.null, t.string]),
        used: t.type({
            bits: t.number,
            cells: t.number,
            publicCells: t.number
        })
    })])
});
const fullAccountCodec = t.type({
    balance: c.bignum,
    block: t.number,
    last: t.union([t.null, t.type({ lt: c.bignum, hash: t.string })]),

    transactionsCursor: t.union([t.null, t.type({ lt: c.bignum, hash: t.string })]),
    transactions: t.array(t.string)
});
const walletCodec = (isTestnet: boolean) => t.type({
    seqno: t.number,
    block: t.number,
    balance: c.bignum,
    plugins: t.array(c.address(isTestnet)),
    transactions: t.array(t.string)
});
const priceCodec = t.type({
    price: t.type({
        usd: t.number,
        rates: t.record(t.string, t.number)
    })
});
const stakingPoolStateCodec = t.type({
    lt: c.bignum,
    params: t.type({
        minStake: c.bignum,
        depositFee: c.bignum,
        withdrawFee: c.bignum,
        stakeUntil: t.number,
        receiptPrice: c.bignum,
        poolFee: c.bignum,
        locked: t.boolean
    }),
    member: t.type({
        balance: c.bignum,
        pendingDeposit: c.bignum,
        pendingWithdraw: c.bignum,
        withdraw: c.bignum
    })
});

const contentSourceCodec = t.union([
    t.type({
        type: t.literal('offchain'),
        link: t.string
    }),
    t.type({
        type: t.literal('onchain'),
    })
]);
const metadataCodec = (isTestnet: boolean) => t.type({
    seqno: t.number,
    interfaces: t.array(t.string),
    jettonWallet: t.union([t.undefined, t.type({
        balance: c.bignum,
        owner: c.address(isTestnet),
        master: c.address(isTestnet),
    })]),
    jettonMaster: t.union([t.undefined, t.type({
        totalSupply: c.bignum,
        mintalbe: t.boolean,
        owner: t.union([c.address(isTestnet), t.null]),
        content: t.union([t.undefined, contentSourceCodec])
    })])
});

const codecPendingMetadata = t.record(t.string, t.number);

const pluginStateCodec = (isTestnet: boolean) => t.union([t.type({
    type: t.literal('unknown'),
}), t.type({
    type: t.literal('legacy-subscription'),
    state: t.type({
        wallet: c.address(isTestnet),
        beneficiary: c.address(isTestnet),
        amount: c.bignum,
        period: t.number,
        startAt: t.number,
        timeout: t.number,
        lastPayment: t.number,
        lastRequest: t.number,
        failedAttempts: t.number,
        subscriptionId: t.string
    })
})]);

const jettonWalletCodec = (isTestnet: boolean) => t.type({
    block: t.number,
    master: t.union([t.null, c.address(isTestnet)]),
    balance: c.bignum
});

const jettonMasterCodec = t.type({
    version: t.number,
    name: t.union([t.null, t.string]),
    description: t.union([t.null, t.string]),
    symbol: t.union([t.null, t.string]),
    decimals: t.union([t.number, t.null]),
    originalImage: t.union([t.string, t.null, t.undefined]),
    image: t.union([imagePreview, t.null])
});

const hintProcessingState = t.type({
    version: t.number,
    seqno: t.number
});
const hintScannerCodec = t.type({
    min: c.bignum,
    max: c.bignum
});

const chainConfigCodec = t.type({
    gas: t.type({
        flatLimit: c.bignum,
        flatGasPrice: c.bignum,
        price: c.bignum,
    }),
    message: t.type({
        lumpPrice: c.bignum,
        bitPrice: c.bignum,
        cellPrice: c.bignum,
        firstFrac: c.bignum
    })
})

const configCodec = (isTestnet: boolean) => t.type({
    storage: t.array(t.type({
        utime_since: c.bignum,
        bit_price_ps: c.bignum,
        cell_price_ps: c.bignum,
        mc_bit_price_ps: c.bignum,
        mc_cell_price_ps: c.bignum
    })),
    rootDnsAddress: c.address(isTestnet),
    workchain: chainConfigCodec,
    masterchain: chainConfigCodec
});

const domainKeyCodec = t.type({
    time: t.number,
    signature: c.buffer,
    secret: c.buffer
});

const spamFilterCodec = t.type({
    minAmount: t.union([c.bignum, t.null]),
    dontShowComments: t.union([t.boolean, t.null])
});

const holdersStatusCodec = t.union([
    t.type({ state: t.literal('need-enrolment') }),
    t.intersection([
        t.type({ token: t.string }),
        accountStateCodec
    ])
]);

const holdersStateCodec = t.type({
    accounts: t.array(t.type({
        id: t.string,
        address: t.string,
        state: t.string,
        balance: c.bignum,
        type: t.union([t.literal('virtual'), t.literal('physical')]),
        card: t.type({
            lastFourDigits: t.union([t.string, t.undefined, t.null]),
            productId: t.string,
            personalizationCode: t.string,
            provider: t.string,
            kind: t.string,
            tzOffset: t.number
        }),
    })),
});

const holdersCardTransactionsCodec = t.array(t.any);

const apyCodec = t.type({
    apy: t.number
});

const stakingWeeklyChartCodec = t.type({
    chart: t.array(t.type({
        balance: t.string,
        ts: t.number,
        diff: t.string,
    })),
    lastUpdate: t.number
});

const accountBalanceChartCodec = t.type({
    chart: t.array(t.type({
        balance: t.string,
        ts: t.number,
        diff: t.string,
    }))
});
