import { BN } from "bn.js";
import { Address } from "ton";
import { Engine } from "../Engine";
import { Transaction } from "../Transaction";

export class Transactions {
    readonly engine: Engine;
    #wallet = new Map<string, Transaction>();

    constructor(engine: Engine) {
        this.engine = engine;
    }

    get(address: Address, lt: string) {
        let key = address.toFriendly() + '::' + lt;
        let ex = this.#wallet.get(key);
        if (ex) {
            return ex;
        }

        // Basic parsing
        let tx = this.engine.persistence.parsedTransactions.getValue({ address, lt: new BN(lt, 10) })!;

        if (!tx) {
            return null;
        }

        this.#wallet.set(key, tx);
        return tx;
    }

    set(address: Address, lt: string, tx: Transaction) {
        this.engine.persistence.parsedTransactions.setValue({ address, lt: new BN(lt, 10) }, tx);
    }
}