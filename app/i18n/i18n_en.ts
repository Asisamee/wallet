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
        logout: 'Log Out',
        cancel: 'Cancel',
        balance: 'Balance',
        walletAddress: 'Wallet address',
        recipientAddress: 'Recipient address',
        recipient: 'Recipient',
        copy: 'Copy',
        copiedAlert: 'Copied to clipboard',
        copied: 'Copied',
        share: 'Share',
        send: 'Send',
        yes: 'Yes',
        no: 'No',
        amount: 'Amount',
        today: 'Today',
        yesterday: 'Yesterday',
        comment: 'Comment',
        products: 'Products',
        confirm: 'Confirm',
        soon: 'soon',
        in: 'in',
        max: 'Max',
        close: 'Close',
        delete: 'Delete',
        apply: 'Apply',
        domainOrAddress: 'Wallet address or domain',
        domainOrAddressOrContact: 'Wallet address, domain or contact',
        domain: 'Domain',
        search: 'Search',
        termsOfService: 'Terms\u00A0Of\u00A0Service',
        privacyPolicy: 'Privacy\u00A0Policy',
        apy: 'APY',
        tx: 'Transaction',
        add: 'Add',
        connect: 'Connect',
        gotIt: 'Got it',
        error: 'Error',
        wallet: 'Wallet',
        wallets: 'Wallets',
        later: 'Later',
        select: 'Select',
        showAll: 'Show all',
        hideAll: 'Hide all',
        done: 'Done',
        mainWallet: 'Main wallet',
        walletName: 'Wallet name',
        from: 'From',
        to: 'To',
        transaction: 'Transaction',
        somethingWentWrong: 'Something went wrong',
        checkInternetConnection: 'Check your internet connection',
        reload: 'Reload',
        errorOccurred: 'Error occurred: {{error}}', 
        recent: 'Recent',
    },
    syncStatus: {
        connecting: 'Connecting',
        updating: 'Updating',
        online: 'Connected'
    },
    home: {
        home: 'Home',
        history: 'History',
        browser: 'Browser',
        more: 'More',
    },
    settings: {
        title: 'More',
        backupKeys: 'Backup keys',
        migrateOldWallets: 'Migrate old wallets',
        termsOfService: 'Terms of Service',
        privacyPolicy: 'Privacy policy',
        developerTools: 'Developer Tools',
        spamFilter: 'SPAM filter',
        primaryCurrency: 'Primary currency',
        experimental: 'Experimental',
        support: {
            title: 'Support',
            telegram: 'Telegram',
            form: 'Support form',
        },
        telegram: 'Telegram',
        rateApp: 'Rate app',
        deleteAccount: 'Delete account',
    },
    wallet: {
        sync: 'Downloading wallet data',
        balanceTitle: 'Ton balance',
        actions: {
            receive: 'Receive',
            send: 'Send',
            buy: 'Buy'
        },
        empty: {
            message: 'You have no transactions',
            receive: 'Receive TON'
        },
        pendingTransactions: 'Pending transactions'
    },
    transactions: {
        title: 'Transactions',
        history: 'History',
    },
    tx: {
        sending: 'Sending',
        sent: 'Sent',
        received: 'Received',
        bounced: 'Bounced',
        tokenTransfer: 'Token transfer',
        airdrop: 'Airdrop',
        failed: 'Failed',
    },
    txPreview: {
        sendAgain: 'Send again',
        blockchainFee: 'Blockchain fee'
    },
    receive: {
        title: 'Receive',
        subtitle: 'Share this link to receive Ton',
        share: {
            title: 'My Tonhub Address'
        }
    },
    transfer: {
        title: 'Send',
        titleAction: 'Action',
        confirm: 'Are you sure want to proceed?',
        error: {
            invalidAddress: 'Invalid address',
            invalidAmount: 'Invalid amount',
            invalidDomain: 'Invalid domain',
            invalidDomainString: 'Minimum 4 characters, maximum 126 characters. Latin letters (a-z), numbers (0-9) and a hyphen (-) are allowed. A hyphen cannot be at the beginning or end.',
            sendingToYourself: 'You can\'t send coins to yourself',
            zeroCoins: 'Unfortunately you can\'t send zero coins',
            notEnoughCoins: 'Unfortunately you don\'t have enough coins for this transaction',
            addressIsForTestnet: 'This address is for testnet',
            addressCantReceive: 'This address can\'t receive coins',
            addressIsNotActive: 'This wallet has no history',
            addressIsNotActiveDescription: 'This means that no transactions have been made from this wallet address',
            invalidTransaction: 'Invalid transaction',
        },
        sendAll: 'Submit All',
        scanQR: 'scan qr code',
        sendTo: 'Send to',
        fee: 'Blockchain fee: {{fee}}',
        feeEmpty: 'Fees will be calculated later',
        feeTitle: 'Blockchain fees',
        feeTotalTitle: 'Total blockchain fees',
        purpose: 'Purpose of transaction',
        comment: 'Message',
        commentDescription: 'Message will be visible to everyone on the blockchain',
        commentRequired: 'Сomment required',
        commentLabel: 'Message',
        checkComment: 'Check before sending',
        confirmTitle: 'Confirm transaction',
        confirmManyTitle: 'Confirm {{count}} transactions',
        unknown: 'Unknown operation',
        moreDetails: 'More details',
        gasFee: 'Gas fee',
        contact: 'Your contact',
        firstTime: 'Sending first time',
        requestsToSign: '{{app}} requests to sign',
        smartContract: 'Smart contract transaction',
        txsSummary: 'Total',
        txsTotal: 'Total amount',
        gasDetails: 'Gas details',
        jettonGas: 'Gas for sending jettons',
        unusualJettonsGas: '⛽️ Gas is higher than usual',
        unusualJettonsGasTitle: '⚠️ The fee for sending jettons is {{amount}} TON',
        unusualJettonsGasMessage: 'Jetton transaction fee (Gas) is higher than usual',
        addressNotActive: 'Not active',
        wrongJettonTitle: '⚠️ Wrong jetton',
        wrongJettonMessage: 'You are trying to send a jetton that that you don\'t have',
        notEnoughJettonsTitle: '⚠️ Not enough jettons',
        notEnoughJettonsMessage: 'You are trying to send more jettons than you have',
        aboutFees: 'About fees',
        aboutFeesDescription: 'The fees for transactions on the blockchain depend on several factors, such as network congestion, transaction size, gas price, and blockchain configuration parameters. The higher the demand for transaction processing on the blockchain or the larger the transaction size (message/comment), the higher the fees will be.'
    },
    auth: {
        phoneVerify: 'Verify phone',
        phoneNumber: 'Phone number',
        phoneTitle: 'Your number',
        phoneSubtitle: 'We will send verification code to verify\nyour number.',
        codeTitle: 'Enter code',
        codeSubtitle: 'We sent verification code to ',
        codeHint: 'Code',
        title: 'Connection Request',
        message: '<strong>{{name}}</strong> wants to connect to your account',
        hint: 'No funds would be transfered to the app and no access to your coins would be granted.',
        action: 'Allow',
        expired: 'This authentication request already expired',
        failed: 'Authentication failed',
        completed: 'This authentication request already completed',
        authorized: 'Authorization request approved',
        authorizedDescription: 'Now you can get back the app.',
        noApps: 'No connected apps',
        name: 'Connected apps',
        yourWallet: 'Your wallet',
        revoke: {
            title: 'Are you sure want to revoke this app?',
            message: 'This will destroy link between your wallet and app, but you can always try to connect again.',
            action: 'Revoke'
        },
        apps: {
            title: 'Trusted Apps',
            delete: {
                title: 'Delete this extension?',
                message: 'This will destroy link between your wallet and the extension, but you can always try to connect again.',
            },
            description: 'Applications or extensions you have authorized will be displayed here. You can revoke access from any app or extension at any time.',
            installExtension: 'Install and open extension for this application'
        },
        consent: 'By clicking continue you accepting our',
    },
    install: {
        title: 'Install Extension',
        message: '<strong>{{name}}</strong> wants to connect to your account',
        action: 'Install'
    },
    sign: {
        title: 'Signature request',
        message: 'Requested to sign a message',
        hint: 'No funds would be transfered to the app and no access to your coins would be granted.',
        action: 'Sign',
    },
    migrate: {
        title: 'Migrate old wallets',
        subtitle: 'If you have been using obsolete wallets, you can automatically move all funds from your old addresses.',
        inProgress: 'Migrating old wallets...',
        transfer: 'Transfering coins from {{address}}',
        check: 'Checking address {{address}}'
    },
    qr: {
        title: 'Point camera at QR code',
        requestingPermission: 'Requesting camera permissions...',
        noPermission: 'Allow camera access to scan QR codes',
        requestPermission: 'Open settings',
        failedToReadFromImage: 'Failed to read QR code from image',
    },
    products: {
        addNew: 'Add new product',
        tonConnect: {
            errors: {
                connection: 'Connection error',
            }
        },
        accounts: 'Accounts',
        services: 'Extensions',
        oldWallets: {
            title: 'Old wallets',
            subtitle: 'Press to migrate old wallets'
        },
        transactionRequest: {
            title: 'Transaction requested',
            subtitle: 'Press to view request'
        },
        signatureRequest: {
            title: 'Signature requested',
            subtitle: 'Press to view request'
        },
        staking: {
            title: 'Staking',
            balance: 'Staking balance',
            subtitle: {
                join: 'Earn up to {{apy}}% on your TONs',
                joined: 'Earn up to {{apy}}%',
                rewards: 'Estimated Interest',
                apy: '~13.3 APY of the contribution',
                devPromo: 'Multiply your test coins'
            },
            pools: {
                active: 'Active',
                best: 'Best pool',
                alternatives: 'Alternative',
                private: 'Private pools',
                restrictedTitle: 'Pool is restricted',
                restrictedMessage: 'This staking pool is available only for the Whales Club members',
                viewClub: 'View Whales Club',
                nominators: 'Nominators',
                nominatorsDescription: 'Open for everyone',
                club: 'Club',
                clubDescription: 'Only for the Whales Club members',
                team: 'Team',
                teamDescription: 'Only for Ton Whales teammates and TOP 15 the Whales Club members',
                joinClub: 'Join the Club',
                joinTeam: 'Join our team',
                clubBanner: 'Become our Club Member',
                clubBannerLearnMore: 'Learn about our club',
                clubBannerDescription: 'If you are not participating in our Club membership your deposited funds will be held on the Staking Balance but will not be staked on this pool.',
                teamBanner: 'Become our Team Member',
                teamBannerLearnMore: 'Learn about our team',
                teamBannerDescription: 'If you are not a part of our team or one of top 15 Club members your deposited funds will be held on the Staking Balance but will not be staked on this pool.',
                epnPartners: 'ePN Partners',
                epnPartnersDescription: 'Join over 200,000 webmasters working with ePN and get paid in TON',
                moreAboutEPN: 'More about ePN',
                lockups: 'Lockups Pool',
                lockupsDescription: 'Allows holders of big lockups in TON to earn additional income',
                tonkeeper: 'Tonkeeper',
                tonkeeperDescription: 'Friendly mobile wallet on TON',
            },
            transfer: {
                stakingWarning: 'You can always deposit new stake or increase existing one with any amount. Please note that minimum amount is: {{minAmount}}',
                depositStakeTitle: 'Staking',
                depositStakeConfirmTitle: 'Confirm Staking',
                withdrawStakeTitle: 'Withdrawal Request',
                withdrawStakeConfirmTitle: 'Confirm Withdrawal',
                topUpTitle: 'Top Up',
                topUpConfirmTitle: 'Confirm Top Up',
                notEnoughStaked: 'unfortunately you don\'t have enougth coins staked',
                confirmWithdraw: 'Request Withdrawal',
                confirmWithdrawReady: 'Withdraw now',
                restrictedTitle: 'This Staking Pool is restricted',
                restrictedMessage: 'Your funds will not participate in staking if your wallet address is not on the permit list, but will be on the pool balance and awaiting a withdrawal',
                notEnoughCoinsFee: 'There are not enough TON on your wallet balance to pay the fee. Please note that the {{amount}} TON fee must be on the main balance, not on the staking balance',
                notEnoughCoins: 'There are not enough funds on your wallet balance to top up the staking balance',
                ledgerSignText: 'Staking: {{action}}',
            },
            nextCycle: 'Next cycle',
            cycleNote: 'All transactions take effect once the cycle ends',
            cycleNoteWithdraw: 'Your request will be executed after the cycle ends. The withdrawal will need to be confirmed again.',
            buttonTitle: 'stake',
            balanceTitle: 'Staking Balance',
            actions: {
                deposit: 'Deposit',
                top_up: 'Top Up',
                withdraw: 'Withdraw',
            },
            join: {
                title: 'Become a TON validator',
                message: 'Staking is a public good for the TON ecosystem. You can help secure the network and earn rewards in the process',
                buttonTitle: 'Start Earning',
                moreAbout: 'More about Ton Whales Staking Pool',
                earn: 'Earn up to',
                onYourTons: 'on your TONs',
                apy: '13.3%',
                yearly: 'APY',
                cycle: 'Get rewards for staking every 36h',
                ownership: 'Staked TONs remain yours',
                withdraw: 'Withdraw and Top Up at any time',
                successTitle: '{{amount}} TON staked',
                successEtimation: 'Your estimated yearly earnings are {{amount}}\u00A0TON\u00A0(${{price}}).',
                successNote: 'Your staked TON will be activated once the next cycle starts.'
            },
            pool: {
                balance: 'Total Stake',
                members: 'Nominators',
                profitability: 'Profitability'
            },
            empty: {
                message: 'You have no transactions'
            },
            pending: {
                deposit: 'Pending Deposit',
                withdraw: 'Pending Withdraw'
            },
            withdrawStatus: {
                pending: 'Withdraw pending',
                ready: 'Withdraw ready',
                withdrawNow: 'Withdraw now'
            },
            depositStatus: {
                pending: 'Deposit pending'
            },
            withdraw: 'Withdraw',
            sync: 'Downloading staking data',
            unstake: {
                title: 'Are you sure want to request withdrawal?',
                message: 'Please, note that by requesting withdrawal all pending deposits will be returned too.'
            },
            learnMore: 'Info',
            moreInfo: 'More info',
            calc: {
                yearly: 'Yearly rewards',
                monthly: 'Monthly rewards',
                daily: 'Daily rewards',
                note: 'Calculated including all fees',
                text: 'Earnings calculator',
                yearlyTopUp: 'After Top Up',
                yearlyTotal: 'Total rewards in a year',
                yearlyCurrent: 'Current',
                topUpTitle: 'Your yearly rewards'
            },
            info: {
                rate: 'up to 13.3%',
                rateTitle: 'Est. APY rate',
                frequency: 'Every 36 hours',
                frequencyTitle: 'Reward Frequency',
                minDeposit: 'Minimal deposit',
                poolFee: '3.3%',
                poolFeeTitle: 'Pool Fee',
                depositFee: 'Deposit Fee',
                withdrawFee: 'Withdraw Fee',
                withdrawRequestFee: 'Withdraw request Fee',
                withdrawCompleteFee: 'Withdrawal completion request Fee',
                blockchainFee: 'Blockhain fee',
                cooldownTitle: 'Cooldown period',
                cooldownActive: 'Active',
                cooldownInactive: 'Inactive',
                cooldownDescription: 'Two-hour period applied at the start of each staking cycle to improve the process of withdrawals and deposits between cycles',
            },
            minAmountWarning: 'Minimum amount is {{minAmount}} TON',
            tryAgainLater: 'Please, try again later',
            banner: {
                estimatedEarnings: 'Your estimated yearly earnings will decrease by {{amount}}\u00A0TON\u00A0({{price}})',
                estimatedEarningsDev: 'Your estimated yearly earnings will decrease',
                message: 'Are you sure about the unstaking?'
            }
        },
        zenPay: {
            title: 'Tonhub Bank card',
            pageTitles: {
                general: 'Tonhub Cards',
                card: 'Tonhub Card',
                cardDetails: 'Card Details',
                cardCredentials: 'Card Details',
                cardLimits: '*{{cardNumber}} Card Limits',
                cardLimitsDefault: 'Card Limits',
                cardDeposit: 'Top Up TON',
                transfer: 'Transfer',
                cardSmartContract: 'Card Smart Contract',
                setUpCard: 'Set up the card',
                pin: 'Change PIN',
            },
            hiddenCards: 'Hidden cards',
            card: {
                cards: 'Holders cards',
                title: 'Card *{{cardNumber}}',
                defaultSubtitle: 'Pay in TON, convert to EUR with 0% commission',
                defaultTitle: 'Tonhub Bank Card',
                eurSubtitle: 'Tonhub EUR',
                type: {
                    physical: 'Physical Card',
                    virtual: 'Virtual',
                },
                notifications: {
                    type: {
                        card_ready: 'Card activated',
                        deposit: 'Card Top Up',
                        charge: 'Payment',
                        charge_failed: 'Payment',
                        limits_change: {
                            pending: 'Limits changing',
                            completed: 'Limits changed',
                        },
                        card_withdraw: 'Transfer to wallet',
                        contract_closed: 'Contract closed',
                        card_block: 'Card blocked',
                        card_freeze: 'Card frozen',
                        card_unfreeze: 'Card unfrozen',
                        card_paid: 'Bank card issue',
                    },
                    category: {
                        deposit: 'Top Up',
                        card_withdraw: 'Transfer',
                        charge: 'Purchases',
                        charge_failed: 'Purchases',
                        other: 'Other',
                    },
                    status: {
                        charge_failed: {
                            limit: {
                                onetime: 'Failed (over onetime limit)',
                                daily: 'Failed (over daily limit)',
                                monthly: 'Failed (over monthly limit)',
                            },
                            failed: 'Failed',
                        },
                        completed: 'Completed',
                    }
                }
            },
            confirm: {
                title: 'Are you sure you want to close this screen?',
                message: 'This action will discard all of your changes'
            },
            enroll: {
                poweredBy: 'Based on TON, powered by ZenPay',
                description_1: 'Only you manage the smart-contract',
                description_2: 'No one except you has access to your funds',
                description_3: 'You truly own your money',
                moreInfo: 'More about ZenPay Card',
                buttonSub: 'KYC and card issue takes ~5 min'
            }
        }
    },
    welcome: {
        title: 'Tonhub',
        titleDev: 'Ton Sandbox Wallet',
        subtitle: 'Simple and secure TON wallet',
        subtitleDev: 'Wallet for developers',
        createWallet: 'Get a new wallet',
        importWallet: 'I already have one',
        slogan: 'This is new Tonhub',
        sloganDev: 'This is Ton Sandbox',
        slide_1: {
            title: 'Protected',
            subtitle: 'Reliable smart contract, Touch/Face ID with Passcode and all transactions on a decentralized blockchain',
        },
        slide_2: {
            title: 'With a cool cryptocard',
            subtitle: 'Order a card now. Internal transfers and purchases in minutes.\nAll this is a unique Tonhub card',
        },
        slide_3: {
            title: 'Fast',
            subtitle: 'Thanks to the unique TON architecture, transactions take place in seconds',
        },
    },
    legal: {
        title: 'Legal',
        subtitle: 'I have read and accept ',
        create: 'Create a backup',
        createSubtitle: 'Keep your private key safe and don\'t share it with anyone. It\'s the only way to access your wallet if the device is lost.',
        privacyPolicy: 'Privacy Policy',
        termsOfService: 'Terms of Service'
    },
    create: {
        addNew: 'Add new wallet',
        inProgress: 'Creating...',
        backupTitle: 'Your Backup Key',
        backupSubtitle: 'Write down this words in exactly the same order and save them in a secret place',
        okSaved: 'OK, I saved it',
        copy: 'Copy to clipboard',
    },
    import: {
        title: 'Enter backup key',
        subtitle: 'Please restore access to your wallet by entering the 24 secret words you wrote down when creating the wallet',
        fullSeedPlaceholder: 'Enter 24 secret words',
        fullSeedPaste: 'Or you can paste full seed phrase where each word is separated by a space',
    },
    secure: {
        title: 'Protect your wallet',
        titleUnprotected: 'Your device is not protected',
        subtitle: 'We use biometrics to authenticate transactions to make sure no one except you can transfer your coins.',
        subtitleUnprotected: 'It is highly recommend to enable passcode on your device to protect your assets.',
        subtitleNoBiometrics: 'It is highly recommend to enable biometrics on your device to protect your assets. We use biometrics to authenticate transactions to make sure no one except you can transfer your coins.',
        messageNoBiometrics: 'It is highly recommend to enable biometrics on your device to protect your assets.',
        protectFaceID: 'Enable Face ID',
        protectTouchID: 'Enable Touch ID',
        protectBiometrics: 'Enable biometrics',
        protectPasscode: 'Enable device passcode',
        upgradeTitle: 'Upgrade needed',
        upgradeMessage: 'Please, allow the app access to wallet keys for an upgrade. No funds would be transferred during this upgrade. Please, make sure that you backed up your keys.',
        allowUpgrade: 'Allow upgrade',
        backup: 'Backup secret words',
        onLaterTitle: 'Setup later',
        onLaterMessage: 'You can setup protection later in settings',
        onLaterButton: 'Setup later',
        onBiometricsError: 'Error authenticating with biometrics',
        lockAppWithAuth: 'Lock app with {{method}}',
        methodPasscode: 'passcode',
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
            message: 'You have entered incorrect secret words. Please, double check your input and try again.'
        },
        secureStorageError: {
            title: 'Secure storage error',
            message: 'unfortunately we are unable to save data. Please, restart your phone.'
        },
        title: 'Ooops',
        invalidNumber: 'Nope, this is not a real number. Please, check your input and try again.',
        codeTooManyAttempts: 'You tried too much, please try again in 15 minutes.',
        codeInvalid: 'Nope, entered code is invalid. Check code and try again.',
        unknown: 'Woof, it is an unknown error. I literally have no idea what\'s going on. Can you try to turn it on and off?',
    },
    confirm: {
        logout: {
            title: 'Are you sure you want to disconnect your wallet from this app and delete all your data from the app?',
            message: 'This action will result in deleting all accounts from this device. Make sure you have backed up your 24 secret words before proceeding.'
        },
        changeCurrency: 'Change primary currency to {{currency}}'
    },
    neocrypto: {
        buttonTitle: 'buy',
        alert: {
            title: 'How the checkout works',
            message: 'Fill in the required fields -> Select cryptocurrency and specify wallet address and the amount to buy -> Proceed to checkout -> Enter your billing details correctly. Your credit card payment is securely processed by our Partners -> Complete purchase. No account needed!'
        },
        title: 'Buy TON with credit card for USD, EUR and RUB',
        description: 'You will be taken to Neocrypto. Services relating to payments are provided by Neocrypto, which is a separate platform owned by a third party.\n\nPlease read and agree to Neocrypto\'s Terms of Service before using their service. ',
        doNotShow: 'Do not show it again for Neocrypto',
        termsAndPrivacy: 'I have read and agree to the ',
        confirm: {
            title: 'Are you sure you want to close this form?',
            message: 'This action will discard all of your changes'
        },
    },
    known: {
        deposit: 'Deposit',
        depositOk: 'Deposit accepted',
        withdraw: 'Request withdraw of {{coins}} 💎',
        withdrawAll: 'Request withdraw of all coins',
        withdrawCompleted: 'Withdraw completed',
        withdrawRequested: 'Withdraw requested',
        upgrade: 'Upgrade code to {{hash}}',
        upgradeOk: 'Upgrade completed',
        cashback: 'Cashback',
        tokenSent: 'Token sent',
        tokenReceived: 'Token received'
    },
    jetton: {
        token: 'token',
        productButtonTitle: 'Jettons',
        productButtonSubtitle: '{{jettonName}} and {{count}} others',
    },
    connections: {
        extensions: 'Extensions',
        connections: 'External apps'
    },
    accounts: {
        active: 'Active',
        noActive: 'No active accounts',
        disabled: 'Hidden',
        alertActive: 'Mark {{symbol}} active',
        alertDisabled: 'Mark {{symbol}} hidden',
        description: 'To change the status of an account, long press the account button on the home screen or press in this menu. The account will be added to the home screen or hidden.',
        noAccounts: 'You have no accounts yet',
    },
    spamFilter: {
        minAmount: 'Min TON amount',
        dontShowComments: 'Don\'t show comments on SPAM transactions',
        minAmountDescription: 'Transactions with TON amount less than {{amount}} will be automatically marked as SPAM',
        applyConfig: 'Apply selected SPAM filter settings',
        denyList: 'Manual spam filter',
        denyListEmpty: 'No blocked addresses yet',
        unblockConfirm: 'Unblock address',
        blockConfirm: 'Mark address as spam',
        description: 'You can easily add the address to the list of manually blocked addresses  if you click on any transaction or address and select the option \"Mark address as spam\" in the pop-up menu.'
    },
    security: {
        title: 'Security',
        passcodeSettings: {
            setupTitle: 'Setup PIN code',
            confirmTitle: 'Confirm PIN code',
            changeTitle: 'Change PIN code',
            resetTitle: 'Reset PIN code',
            resetDescription: 'If you forgot your PIN code, you can reset it by entering the 24 secret words you wrote down when creating the wallet.',
            resetAction: 'Reset',
            error: 'Incorrect PIN code',
            tryAgain: 'Try again',
            success: 'PIN code successfully set',
            enterNew: 'Create PIN code',
            confirmNew: 'Confirm new PIN code',
            enterCurrent: 'Enter your PIN code',
            enterPrevious: 'Enter your previous PIN code',
            enterNewDescription: 'Setting a password provides an additional layer of security when using the application',
            changeLength: 'Use {{length}}-digit PIN code',
            forgotPasscode: 'Forgot PIN code?',
            logoutAndReset: 'Log out and reset PIN code',
        }
    },
    report: {
        title: 'Report',
        scam: 'scam',
        bug: 'bug',
        spam: 'spam',
        offense: 'offensive content',
        posted: 'Your report is sent',
        error: 'Error sending report',
        message: 'Message (required)',
        reason: 'Report reason'
    },
    review: {
        title: 'Review extension',
        rating: 'rating',
        review: 'Review (optional)',
        heading: 'Title',
        error: 'Error posing review',
        posted: 'Your review is sent'
    },
    deleteAccount: {
        title: 'Are you sure you want to Delete Account?',
        action: 'Delete account and all data',
        logOutAndDelete: 'Log Out and Delete all data',
        description: 'This action will delete all data and currenly selected wallet from this device and your blockchain account\nYou need to transfer all your TON coins to another wallet. Before proceeding, make sure that you have more than {{amount}} TON on your account to complete the transaction',
        complete: 'Account deletion completed',
        error: {
            hasNfts: 'You have NFTs in your wallet, in order to delete the account, please send them to another wallet.',
            fetchingNfts: 'Could not find out if there are NFTs on the wallet. In order to delete the account, please make sure there are no NFTs on it.'
        },
        confirm: {
            title: 'Are you sure you want to delete your account and all data from this application?',
            message: 'This action will delete your account and all data from this application and transfer all your TON coins to wallet address you specified: {{address}}.\nPlease, check the recipient address carefully before proceeding.',
        }
    },
    logout: {
        title: 'Are you sure you want to Log Out of {{name}}?',
        logoutDescription: 'Access to the wallet will be disabled. Have you saved your private key?',
    },
    contacts: {
        title: 'Contacts',
        contact: 'Contact',
        unknown: 'Unknown contact',
        contacts: 'My contacts',
        name: 'Name',
        lastName: 'Last name',
        company: 'Company',
        add: 'Add Contact',
        edit: 'Edit',
        save: 'Save',
        notes: 'Notes',
        alert: {
            name: 'Incorrect name',
            nameDescription: 'Contact name can\'t be empty or longer than 126 characters',
            notes: 'Incorrect field',
            notesDescription: 'Contact fields can\'t be longer than 280 characters',
        },
        delete: 'Delete contact',
        empty: 'No contacts yet',
        description: 'You can add an address to your contacts long pressing on any transaction or address or using the \"Add\" button or from the list of recent contacts below',
        contactAddress: 'Contacts address',
        search: 'Name or wallet address',
        new: 'New contact',
    },
    currency: {
        USD: "United States dollar",
        EUR: "Euro",
        RUB: "Russian ruble",
        GBP: "British Pounds",
        CHF: "Swiss franc",
        CNY: "Chinese yuan",
        KRW: "South Korean won",
        IDR: "Indonesian rupiah",
        INR: "Indian rupee",
        JPY: "Japanese yen",
    },
    txActions: {
        addressShare: 'Share address',
        addressContact: 'Add address to contacts',
        addressContactEdit: 'Edit address contact',
        addressMarkSpam: 'Mark address as spam',
        txShare: 'Share transaction',
        txRepeat: 'Repeat transaction',
        share: {
            address: 'TON address',
            transaction: 'TON transaction',
        }
    },
    hardwareWallet: {
        ledger: 'Ledger',
        title: 'Connect Ledger',
        description: 'Your hardware Ledger wallet',
        installation: 'If this is your first time, then you can read',
        installationGuide: 'TON ledger connection guide',
        connectionDescriptionAndroid: 'Connect your Ledger via USB or Bluetooth',
        connectionDescriptionIOS: 'Connect your Ledger via Bluetooth',
        connectionHIDDescription_1: '1. Turn your ledger on and unlock it',
        connectionHIDDescription_2: '2. Press \"Continue\"',
        chooseAccountDescription: 'Open the app on your Ledger and select the account you want to use',
        bluetoothScanDescription_1: '1. Turn your ledger on and unlock it',
        bluetoothScanDescription_2: '2. Make sure that you have bluetooth enabled',
        bluetoothScanDescription_3: '3. Press \"Scan\" to search for available devices and select suitable Ledger Nano X',
        bluetoothScanDescription_3_and: '3. Press \"Scan\" to search for available devices (we will need access to device location data and permission to search for nearby devices)',
        bluetoothScanDescription_4_and: '4. Then select suitable Ledger Nano X',
        openAppVerifyAddress: 'Check the account address that you have selected and then verify the address with the Ledger Ton App when prompted',
        devices: 'Your devices',
        connection: 'Connection',
        actions: {
            connect: 'Connect Ledger',
            selectAccount: 'Select account',
            account: 'Account #{{account}}',
            loadAddress: 'Verify address',
            connectHid: 'Connect Ledger via USB',
            connectBluetooth: 'Connect Ledger via Bluetooth',
            scanBluetooth: 'Scan again',
            confirmOnLedger: 'Verify on Ledger',
            sending: 'Awaiting transaction',
            sent: 'Transaction sent',
            mainAddress: 'Main address',
            givePermissions: 'Give permissions',
        },
        confirm: {
            add: 'Are you sure want to add this app?',
            remove: 'Are you sure want to remove this app?'
        },
        errors: {
            noDevice: 'No device found',
            appNotOpen: 'Ton app is not open on Ledger',
            turnOnBluetooth: 'Please, turn Bluetooth on and try again',
            lostConnection: 'Lost connection with Ledger',
            transactionNotFound: 'Transaction not found',
            transactionRejected: 'Transaction rejected',
            transferFailed: 'Transfer failed',
            permissions: 'Please, allow access to bluetooth and location',
        },
        moreAbout: 'More about Ledger'
    },
    devTools: {
        switchNetwork: 'Network',
        switchNetworkAlertTitle: 'Switching to {{network}} network',
        switchNetworkAlertMessage: 'Are you sure you want to switch networks?',
        switchNetworkAlertAction: 'Switch',
        copySeed: 'Copy 24 words seed phrase',
        copySeedAlertTitle: 'Coping 24 words seed phrase to clipboard',
        copySeedAlertMessage: 'WARNING ⚠️ Coping 24 words seed phrase to clipboard is not secure. Proceed at your own risk.',
        copySeedAlertAction: 'Copy',
        holdersOfflineApp: 'Holders Offline App',
    },
    wallets: {
        switchToAlertTitle: 'Switching to {{wallet}}',
        switchToAlertMessage: 'Are you sure you want to switch wallets?',
        switchToAlertAction: 'Switch',
        addNewTitle: 'Add wallet',
        addNewAlertTitle: 'Adding new wallet',
        addNewAlertMessage: 'Are you sure you want to add new wallet?',
        addNewAlertAction: 'Add',
        alreadyExistsAlertTitle: 'Wallet already exists',
        alreadyExistsAlertMessage: 'Wallet with this address already exists',
        settings: {
            changeAvatar: 'Change avatar',
        }
    },
    webView: {
        contactSupportOrTryToReload: 'Contact support or try to reload the page',
        contactSupport: 'Contact support',
    },
    appAuth: {
        description: 'To continue logging in to the app',
    },
    screenCapture: {
        title: 'Wow, cool screenshot, but it\'s not safe',
        description: 'Unencrypted digital copies of your secret phrase are NOT recommended. Examples include saving copies on computer, on online accounts or by taking screenshots',
        action: 'OK, I\'m taking the risk',
    }
};

export default schema;
