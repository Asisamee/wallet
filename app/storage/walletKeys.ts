import { KeyPair, mnemonicToWalletKey } from "ton-crypto";
import { decryptData, doDecryptWithPasscode, passcodeEncKey, passcodeSaltKey } from "./secureStorage";
import { storage } from "./storage";

export type WalletKeys = {
    keyPair: KeyPair,
    mnemonics: string[]
}

export async function loadWalletKeys(secretKeyEnc: Buffer): Promise<WalletKeys> {
    try {
        let plainText = await decryptData(secretKeyEnc);
        let mnemonics = plainText.toString().split(' ');
        let walletKey = await mnemonicToWalletKey(mnemonics);
        return { keyPair: walletKey, mnemonics };
    } catch {
        throw new Error('Unable to load wallet keys');
    }
}

export async function loadWalletKeysWithPassword(address: string, password: string): Promise<WalletKeys> {
    try {
        let secretKeyEnc = Buffer.from(storage.getString(`${address}/${passcodeEncKey}`)!, 'base64');
        let salt = storage.getString(`${address}/${passcodeSaltKey}`);
        if (!salt) {
            throw new Error('Unable to load wallet keys');
        }
        let plainText = await doDecryptWithPasscode(password, salt, secretKeyEnc);
        let mnemonics = plainText.toString().split(' ');
        let walletKey = await mnemonicToWalletKey(mnemonics);
        return { keyPair: walletKey, mnemonics };
    } catch (e) {
        throw new Error('Unable to load wallet keys');
    }
}