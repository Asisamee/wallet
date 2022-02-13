import { AddSuffixes, ReplaceTypeRecurcive, FilterTypeRecursive, FilterNotTypeRecursive, FlattenForIntellisense } from './../utils/types';
import { Paths } from '../utils/types';
export type Plural = number;

export type LocalizationSchema = {
    lang: string,
    common: {
        and: string,
        accept: string,
        start: string,
        continue: string,
        continueAnyway: string,
        back: string,
        logout: string,
        cancel: string
    }
    home: {
        wallet: string,
        settings: string
    }
    settings: {
        title: string,
        backupKeys: string,
        migrateOldWallets: string,
        termsOfService: string,
        privacyPolicy: string,
        developerTools: string
    },
    wallet: {
        balanceTitle: string,
        actions: {
            receive: string,
            send: string
        },
        empty: {
            message: string,
            receive: string
        }
    },
    tx: {
        sending: string,
        sent: string,
        received: string
    }
    products: {
        oldWallets: {
            title: string,
            subtitle: string
        }
    }
    welcome: {
        title: string,
        titleDev: string,
        subtitle: string,
        subtitleDev: string,
        createWallet: string,
        importWallet: string
    },
    legal: {
        title: string,
        subtitle: string,
        privacyPolicy: string,
        termsOfService: string
    },
    create: {
        inProgress: string
    },
    import: {
        title: string,
        subtitle: string
    },
    secure: {
        title: string,
        titleUnprotected: string,
        subtitle: string,
        subtitleUnprotected: string,
        protectFaceID: string,
        protectTouchID: string,
        protectBiometrics: string,
        protectPasscode: string
    },
    backup: {
        title: string,
        subtitle: string
    },
    backupIntro: {
        title: string,
        subtitle: string,
        clause1: string,
        clause2: string,
        clause3: string
    }
    errors: {
        incorrectWords: {
            title: string,
            message: string
        },
        secureStorageError: {
            title: string,
            message: string
        }
    },
    confirm: {
        logout: {
            title: string,
            message: string
        }
    }
};

export type LocalizedResources = Paths<LocalizationSchema, string>;
export type LocalizedPluralsResources = Paths<LocalizationSchema, Plural>;

export type Pluralize<T, P extends string> = AddSuffixes<ReplaceTypeRecurcive<FilterTypeRecursive<T, Plural>, Plural, string>, P>;
export type PrepareSchema<T, P extends string> = FlattenForIntellisense<FilterNotTypeRecursive<T, Plural> & Pluralize<LocalizationSchema, P>>;