import { Address } from "ton";
import { sharedStoragePersistence, storagePersistence } from "../storage/storage";
import { log } from "../utils/log";
import { Engine } from "./Engine";

export function createEngine(args: {
    address: Address,
    publicKey: Buffer,
    utilityKey: Buffer,
    recoilUpdater: (node: any, value: any) => void, isTestnet: boolean,
    sessionId: number
}) {
    let start = Date.now();
    log('Starting engine...');
    let res = new Engine(
        args.address,
        args.publicKey,
        args.utilityKey,
        storagePersistence,
        sharedStoragePersistence,
        args.isTestnet ? 'testnet-v4.tonhubapi.com' : 'mainnet-v4.tonhubapi.com',
        { updater: args.recoilUpdater },
        args.isTestnet,
        args.sessionId
    );
    log('Engine started in ' + (Date.now() - start) + ' ms');
    return res;
}