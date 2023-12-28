import { Address, beginCell, Cell, comment } from "@ton/core";
import { OperationType } from "../../../engine/transactions/parseMessageBody";
import { TonPayloadFormat } from '@ton-community/ton-ledger';
/// mport { TonPayloadFormat } from "ton-ledger";

export type Order = {
    type: 'order';
    domain?: string;
    messages: {
        target: string;
        amount: bigint;
        amountAll: boolean;
        payload: Cell | null;
        stateInit: Cell | null;
    }[],
    app?: {
        domain: string,
        title: string,
        url: string
    }
};

export type LedgerOrder = {
    type: 'ledger';
    target: string;
    domain?: string;
    amount: bigint;
    amountAll: boolean;
    payload: TonPayloadFormat | null;
    stateInit: Cell | null;
    app?: {
        domain: string,
        title: string
    }
};


export function createLedgerJettonOrder(args: {
    wallet: Address,
    target: string,
    domain?: string,
    responseTarget: Address,
    text: string | null,
    amount: bigint,
    tonAmount: bigint,
    txAmount: bigint,
    payload: Cell | null
}, isTestnet: boolean): LedgerOrder {

    // Resolve payload
    let payload: Cell | null = null;
    if (args.payload) {
        payload = args.payload;
    } else if (args.text) {
        let c = comment(args.text);
        payload = c;
    }

    // Create body
    // transfer#f8a7ea5 query_id:uint64 amount:(VarUInteger 16) destination:MsgAddress
    //              response_destination:MsgAddress custom_payload:(Maybe ^Cell)
    //              forward_ton_amount:(VarUInteger 16) forward_payload:(Either Cell ^Cell)
    //              = InternalMsgBody;
    const msg = beginCell()
        .storeUint(OperationType.JettonTransfer, 32)
        .storeUint(0, 64)
        .storeCoins(args.amount)
        .storeAddress(Address.parse(args.target))
        .storeAddress(args.responseTarget)
        .storeMaybeRef(null)
        .storeCoins(args.tonAmount)
        .storeMaybeRef(payload)
        .endCell();

    return {
        type: 'ledger',
        target: args.wallet.toString({ testOnly: isTestnet }),
        domain: args.domain,
        amount: args.txAmount,
        payload: { type: 'comment', text: args.text || '' }, // TODO: upgrade to new ton-ledger
        amountAll: false,
        stateInit: null,
    }
}

export function createSimpleLedgerOrder(args: {
    target: string,
    domain?: string,
    text: string | null,
    amount: bigint,
    amountAll: boolean,
    payload: Cell | null,
    stateInit: Cell | null,
    app?: {
        domain: string,
        title: string
    }
}): LedgerOrder {

    // Resolve payload
    let payload: TonPayloadFormat | null = null;
    if (args.payload) {
        // payload = { type: 'unsafe', message: new CellMessage(args.payload) };
        // TODO
        throw new Error('Not implemented');
    } else if (args.text) {
        payload = { type: 'comment', text: args.text };
    }

    return {
        type: 'ledger',
        target: args.target,
        domain: args.domain,
        amount: args.amount,
        amountAll: args.amountAll,
        payload,
        stateInit: args.stateInit,
        app: args.app
    }
}

export function createOrder(args: {
    target: string,
    domain?: string,
    amount: bigint,
    amountAll: boolean,
    payload: Cell | null,
    stateInit: Cell | null,
    app?: {
        domain: string,
        title: string,
        url: string
    }
}) {
    return {
        messages: [{
            target: args.target,
            amount: args.amount,
            amountAll: args.amountAll,
            payload: args.payload,
            stateInit: args.stateInit,
        }],
        domain: args.domain,
        app: args.app
    };
}

export function createSimpleOrder(args: {
    target: string,
    domain?: string,
    text: string | null,
    amount: bigint,
    amountAll: boolean,
    payload: Cell | null,
    stateInit: Cell | null,
    app?: {
        domain: string,
        title: string,
        url: string
    }
}): Order {

    // Resolve payload
    let payload: Cell | null = null;
    if (args.payload) {
        payload = args.payload;
    } else if (args.text) {
        let c = comment(args.text);
        payload = c;
    }

    return {
        type: 'order',
        ...createOrder({
            target: args.target,
            domain: args.domain,
            payload,
            amount: args.amount,
            amountAll: args.amountAll,
            stateInit: args.stateInit,
            app: args.app
        })
    };
}

export function createJettonOrder(args: {
    wallet: Address,
    target: string,
    domain?: string,
    responseTarget: Address,
    text: string | null,
    amount: bigint,
    tonAmount: bigint,
    txAmount: bigint,
    payload: Cell | null
}, isTestnet: boolean): Order {

    // Resolve payload
    let payload: Cell | null = null;
    if (args.payload) {
        payload = args.payload;
    } else if (args.text) {
        let c = comment(args.text);
        payload = c;
    }

    // Create body
    // transfer#f8a7ea5 query_id:uint64 amount:(VarUInteger 16) destination:MsgAddress
    //              response_destination:MsgAddress custom_payload:(Maybe ^Cell)
    //              forward_ton_amount:(VarUInteger 16) forward_payload:(Either Cell ^Cell)
    //              = InternalMsgBody;
    const msg = beginCell()
        .storeUint(OperationType.JettonTransfer, 32)
        .storeUint(0, 64)
        .storeCoins(args.amount)
        .storeAddress(Address.parse(args.target))
        .storeAddress(args.responseTarget)
        .storeMaybeRef(null)
        .storeCoins(args.tonAmount)
        .storeMaybeRef(payload)
        .endCell();


    return {
        type: 'order',
        ...createOrder({
            target: args.wallet.toString({ testOnly: isTestnet }),
            domain: args.domain,
            payload: msg,
            amount: args.txAmount,
            amountAll: false,
            stateInit: null
        })
    };
}