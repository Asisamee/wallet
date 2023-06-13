import BN from "bn.js";
import { RecoilValueReadOnly, atom, selector, selectorFamily, useRecoilValue } from "recoil";
import { Address, toNano } from "ton";
import { SpamFilterConfig } from "../../fragments/SpamFilterFragment";
import { CloudValue } from "../cloud/CloudValue";
import { Engine } from "../Engine";
import { BiometricsState, PasscodeState, biometricsStateKey, getBiometricsState, passcodeStateKey } from "../../storage/secureStorage";
import { storage } from "../../storage/storage";
import { getAppState } from "../../storage/appState";
import { getPasscodeState } from "../../components/secure/AuthWalletKeys";

const version = 1;

export type AddressContact = { name: string, fields?: { key: string, value: string | null | undefined }[] | null };
export class SettingsProduct {
    readonly engine: Engine;
    readonly #minAmountSelector: RecoilValueReadOnly<BN>;
    readonly #dontShowCommentsSelector: RecoilValueReadOnly<boolean>;
    readonly addressBook: CloudValue<{ denyList: { [key: string]: { reason: string | null } }, contacts: { [key: string]: AddressContact }, fields: { [key: string]: string } }>
    readonly ledger: CloudValue<{ on: boolean }>
    readonly #denyAddressSelector;
    readonly #contactSelector;
    readonly #passcodeStateAtom;
    readonly #biometricsStateAtom;

    constructor(engine: Engine) {
        this.engine = engine;
        this.addressBook = engine.cloud.get(`addressbook-v${version}`, (src) => { src.denyList = {}; src.contacts = {}; src.fields = {} });
        this.ledger = engine.cloud.get(`ledger-v${version}`, (src) => { src.on = false });

        const appState = getAppState();
        const defaultPasscodeState: { [key: string]: PasscodeState | null } = {};
        appState.addresses.forEach((v) => {
            const stored = getPasscodeState(v.address, this.engine.isTestnet);
            defaultPasscodeState[v.address.toFriendly({ testOnly: this.engine.isTestnet })] = stored;
        });

        this.#passcodeStateAtom = atom<{ [key: string]: PasscodeState | null }>({
            key: 'settings/passcode-state',
            default: defaultPasscodeState,
            dangerouslyAllowMutability: true
        });

        const defaultBiometricsState: { [key: string]: BiometricsState | null } = {};
        appState.addresses.forEach((v) => {
            const stored = getBiometricsState(v.address.toFriendly({ testOnly: this.engine.isTestnet }));
            defaultBiometricsState[v.address.toFriendly({ testOnly: this.engine.isTestnet })] = stored;
        });

        this.#biometricsStateAtom = atom<{ [key: string]: BiometricsState | null }>({
            key: 'settings/biometrics-state',
            default: defaultBiometricsState,
            dangerouslyAllowMutability: true
        });

        this.#minAmountSelector = selector({
            key: 'settings/spam/min-amount',
            get: ({ get }) => {
                let config = get(this.engine.persistence.spamFilterConfig.item().atom);
                if (!config) {
                    return toNano('0.05');
                }
                return config.minAmount ? config.minAmount : toNano('0.05')
            },
            dangerouslyAllowMutability: true
        });

        this.#dontShowCommentsSelector = selector({
            key: 'settings/spam/comments',
            get: ({ get }) => {
                let config = get(this.engine.persistence.spamFilterConfig.item().atom);
                if (!config) {
                    return true;
                }
                return config.dontShowComments !== null ? config.dontShowComments : true;
            },
            dangerouslyAllowMutability: true
        });

        this.#denyAddressSelector = selectorFamily<boolean, string>({
            key: 'settings/spam/deny-list',
            get: (address) => ({ get }) => {
                const list = get(this.addressBook.atom).denyList || [];
                const res = !!list[address];
                return res;
            }
        });

        this.#contactSelector = selectorFamily<AddressContact | undefined, string>({
            key: 'settings/contacts',
            get: (address) => ({ get }) => {
                const list = get(this.addressBook.atom).contacts || {};
                return list[address];
            }
        });
    }

    useLedger(): boolean {
        return useRecoilValue(this.ledger.atom).on;
    }

    setLedger(on: boolean) {
        this.ledger.update((doc) => {
            doc.on = on;
        });
    }

    usePasscodeState(address?: Address): PasscodeState | null {
        if (!address) {
            return null;
        }
        return useRecoilValue(this.#passcodeStateAtom)[address.toFriendly({ testOnly: this.engine.isTestnet })];
    }

    useBiometricsState(address?: Address): BiometricsState | null {
        if (!address) {
            return null;
        }
        return useRecoilValue(this.#biometricsStateAtom)[address.toFriendly({ testOnly: this.engine.isTestnet })];
    }

    setBiometricsState(address: Address, newState: BiometricsState | null) {
        if (!newState) {
            storage.delete(`${address.toFriendly({ testOnly: this.engine.isTestnet })}/${biometricsStateKey}`);
        } else {
            storage.set(`${address.toFriendly({ testOnly: this.engine.isTestnet })}/${biometricsStateKey}`, newState);
        }
        const appState = getAppState();
        const newBiometricsState: { [key: string]: BiometricsState | null } = {};
        appState.addresses.forEach((v) => {
            newBiometricsState[v.address.toFriendly({ testOnly: this.engine.isTestnet })] = (getBiometricsState(v.address.toFriendly({ testOnly: this.engine.isTestnet })) ?? null) as BiometricsState | null;
        });
        this.engine.recoil.updater(this.#biometricsStateAtom, newBiometricsState);
    }

    setPasscodeState(address: Address, newState: PasscodeState | null) {
        if (!newState) {
            storage.delete(`${address.toFriendly({ testOnly: this.engine.isTestnet })}/${passcodeStateKey}`);
        } else {
            storage.set(`${address.toFriendly({ testOnly: this.engine.isTestnet })}/${passcodeStateKey}`, newState);
        }
        const appState = getAppState();
        const newPasscodesState: { [key: string]: PasscodeState | null } = {};
        appState.addresses.forEach((v) => {
            newPasscodesState[v.address.toFriendly({ testOnly: this.engine.isTestnet })] = (getPasscodeState(v.address, this.engine.isTestnet) ?? null) as PasscodeState | null;
        });
        this.engine.recoil.updater(this.#passcodeStateAtom, newPasscodesState);
    }

    useSpamMinAmount(): BN {
        return useRecoilValue(this.#minAmountSelector);
    }

    useDontShowComments(): boolean {
        return useRecoilValue(this.#dontShowCommentsSelector);
    }

    useDenyList(): { [key: string]: { reason: string | null } } {
        return useRecoilValue(this.addressBook.atom).denyList;
    }

    useDenyAddress(address: Address) {
        return useRecoilValue(this.#denyAddressSelector(address.toFriendly({ testOnly: this.engine.isTestnet })));
    }

    useSpamfilter(): { minAmount: BN, dontShowComments: boolean } {
        const config = useRecoilValue(this.engine.persistence.spamFilterConfig.item().atom);
        if (!config) {
            return {
                minAmount: toNano('0.05'),
                dontShowComments: true
            }
        }
        return {
            minAmount: config.minAmount ? config.minAmount : toNano('0.05'),
            dontShowComments: config.dontShowComments !== null ? config.dontShowComments : true
        };
    }

    useContacts() {
        return useRecoilValue(this.addressBook.atom).contacts;
    }

    useContactFields() {
        return useRecoilValue(this.addressBook.atom).fields;
    }

    useContactField(key: string) {
        return useRecoilValue(this.addressBook.atom).fields[key];
    }

    setContactField(key: string, label: string) {
        this.addressBook.update((doc) => {
            doc.fields[key] = label;
        });
    }

    removeContactField(key: string) {
        this.addressBook.update((doc) => {
            delete doc.fields[key];
        });
    }

    useContactAddress(address: Address) {
        return useRecoilValue(this.#contactSelector(address.toFriendly({ testOnly: this.engine.isTestnet })));
    }

    useContact(address: string) {
        return useRecoilValue(this.#contactSelector(address));
    }

    setContact(address: Address, contact: AddressContact) {
        this.addressBook.update((doc) => {
            if (!doc.contacts[address.toFriendly({ testOnly: this.engine.isTestnet })]) {
                doc.contacts[address.toFriendly({ testOnly: this.engine.isTestnet })] = {
                    name: contact.name,
                    fields: contact.fields
                }
                return;
            }

            doc.contacts[address.toFriendly({ testOnly: this.engine.isTestnet })].name = contact.name;

            if (!doc.contacts[address.toFriendly({ testOnly: this.engine.isTestnet })].fields) {
                doc.contacts[address.toFriendly({ testOnly: this.engine.isTestnet })].fields = [];
            }

            if (!!contact.fields) {
                for (let i = 0; i < contact.fields.length; i++) {
                    doc.contacts[address.toFriendly({ testOnly: this.engine.isTestnet })].fields![i] = contact.fields![i];
                }
            } else {
                doc.contacts[address.toFriendly({ testOnly: this.engine.isTestnet })].fields = [];
            }
        });
    }

    removeContact(address: Address) {
        this.addressBook.update((doc) => {
            delete doc.contacts[address.toFriendly({ testOnly: this.engine.isTestnet })];
        });
    }

    addToDenyList(address: Address) {
        this.addressBook.update((doc) => {
            doc.denyList[address.toFriendly({ testOnly: this.engine.isTestnet })] = { reason: 'spam' };
        });
    }

    removeFromDenyList(address: Address) {
        this.addressBook.update((doc) => {
            delete doc.denyList[address.toFriendly({ testOnly: this.engine.isTestnet })]
        });
    }

    setSpamFilter(value: SpamFilterConfig) {
        this.engine.persistence.spamFilterConfig.item().update(() => value);
    }
}