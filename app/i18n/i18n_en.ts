import { LocalizationSchema, PrepareSchema } from "./schema";

const schema: PrepareSchema<LocalizationSchema, '' | '_plural'> = {
    lang: 'en',
    common: {
        and: 'and',
        accept: 'Accept',
        start: 'Start',
        continue: 'Continue',
        continueAnyway: 'Continue anyway',
        back: 'Back',
        logout: 'Logout',
        cancel: 'Cancel'
    },
    home: {
        wallet: 'Wallet',
        settings: 'Settings'
    },
    settings: {
        title: 'Settings',
        backupKeys: 'Backup keys',
        migrateOldWallets: 'Migrate old wallets',
        termsOfService: 'Terms of Service',
        privacyPolicy: 'Privacy policy',
        developerTools: 'Developer Tools'
    },
    wallet: {
        balanceTitle: 'Ton balance',
        actions: {
            receive: 'receive',
            send: 'send'
        },
        empty: {
            message: 'You have no transactions',
            receive: 'Receive TON'
        }
    },
    tx: {
        sending: 'Sending #{{id}}',
        sent: 'Sent #{{id}}',
        received: 'Received'
    },
    products: {
        oldWallets: {
            title: 'Old wallets',
            subtitle: 'Press to migrate old wallets'
        }
    },
    welcome: {
        title: 'Tonhub',
        titleDev: 'Ton Development Wallet',
        subtitle: 'Simple and secure TON wallet',
        subtitleDev: 'Wallet for developers',
        createWallet: 'Create wallet',
        importWallet: 'Import existing wallet'
    },
    legal: {
        title: 'Legal',
        subtitle: 'Please review and accept our',
        privacyPolicy: 'Privacy Policy',
        termsOfService: 'Terms of Service'
    },
    create: {
        inProgress: 'Creating...'
    },
    import: {
        title: '24 Secret Words',
        subtitle: 'Please restore access to your wallet by entering the 24 secret words you wrote down when creating the wallet.'
    },
    secure: {
        title: 'Protect your wallet',
        titleUnprotected: 'Your device is not protected',
        subtitle: 'We use biometrics to authenticate transactions to make sure no one except you can transfer your coins.',
        subtitleUnprotected: 'It is highly recommend to enable passcode on your device to protect your assets.',
        protectFaceID: 'Protect with Face ID',
        protectTouchID: 'Protect with Touch ID',
        protectBiometrics: 'Protect with biometrics',
        protectPasscode: 'Protect with Passcode'
    },
    backup: {
        title: 'Your recovery phrase',
        subtitle: 'Write down these 24 words in the order given below and store them in a secret, safe place.'
    },
    backupIntro: {
        title: 'Back up your wallet',
        subtitle: 'In the next step you will see 24 secret words that allows you to recover a wallet',
        clause1: 'If I lose recovery phrase, my funds will be lost forever.',
        clause2: 'If I expose or share my recovery phrase to anybody, my funds can be stolen.',
        clause3: 'It is my full responsibility to keep my recovery phrase secure.'
    },
    errors: {
        incorrectWords: {
            title: 'Incorrect words',
            message: 'You have entered incorrect secret words. Please, double ckeck your input and try again.'
        },
        secureStorageError: {
            title: 'Ошибка безопасного хранилища',
            message: 'К сожалению, мы не можем сохранить данные. Пожалуйста, перезагрузите телефон.'
        }
    },
    confirm: {
        logout: {
            title: 'Are you sure want to log out?',
            message: 'This will disconnect the wallet from this app. You will be able to restore your wallet using 24 secret words - or import another wallet.'
        }
    }
};

export default schema;