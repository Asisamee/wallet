import { string } from "io-ts";
import { LocalizationSchema, PrepareSchema } from "./schema";

const schema: PrepareSchema<LocalizationSchema, '_0' | '_1' | '_2'> = {
    lang: 'ru',
    common: {
        and: 'и',
        accept: 'Принимаю',
        start: 'Начать',
        continue: 'Продолжить',
        continueAnyway: 'Продолжить все равно',
        back: 'Назад',
        logout: 'Выйти',
        cancel: 'Отменить',
        balance: 'Баланс',
        walletAddress: 'Адрес кошелька',
        recipientAddress: 'Адрес получателя',
        recipient: 'Получатель',
        copy: 'Скопировать',
        copiedAlert: 'Скопировано в буфер обмена',
        copied: 'Скопировано',
        share: 'Поделиться',
        send: 'Отправить',
        yes: 'Да',
        no: 'Нет',
        amount: 'Количество',
        today: 'Сегодня',
        yesterday: 'Вчера',
        comment: 'Комментарий',
        products: 'Продукты',
        confirm: 'Подтвердить',
        soon: 'скоро',
        in: 'через',
        max: 'Макс.',
        close: 'Закрыть',
        delete: 'Удалить',
        apply: 'Применить',
        domainOrAddress: 'Адрес кошелька или Домен',
        domain: 'Домен',
        search: 'Поиск',
        termsOfService: 'Terms\u00A0Of\u00A0Service',
        privacyPolicy: 'Privacy\u00A0Policy',
        apy: 'APY',
        tx: 'Транзакция',
        add: 'Добавить',
        connect: 'Подключить',
        gotIt: 'Понятно',
        error: 'Ошибка',
        wallet: 'Кошелек',
        wallets: 'Кошельки',
        later: 'Позже',
        select: 'Выбрать',
        showAll: 'Показать все',
        hideAll: 'Скрыть все',
        done: 'Готово',
        mainWallet: 'Основной',
        walletName: 'Имя кошелька',
        from: 'От',
        to: 'Кому',
        transaction: 'Транзакция',
        somethingWentWrong: 'Что-то пошло не так',
        checkInternetConnection: 'Проверьте подключение к интернету',
        reload: 'Перезагрузить',
        errorOccurred: 'Произошла ошибка: {{error}}',
        recent: 'Недавние',
    },
    syncStatus: {
        connecting: 'Идет подключение',
        updating: 'Обновление',
        online: 'Подключено'
    },
    home: {
        home: 'Главная',
        history: 'История',
        browser: 'Браузер',
        more: 'Еще',
    },
    settings: {
        title: 'Ещё',
        backupKeys: 'Сохранить секретные ключи',
        migrateOldWallets: 'Перенос старых кошельков',
        termsOfService: 'Условия использования',
        privacyPolicy: 'Политика конфиденциальности',
        developerTools: 'Инструменты разработчика',
        spamFilter: 'SPAM фильтр',
        primaryCurrency: 'Основная валюта',
        experimental: 'Экспериментальные',
        support: {
            title: 'Поддержка',
            telegram: 'Telegram',
            form: 'Форма обратной связи',
        },
        telegram: 'Telegram',
        rateApp: 'Оценить приложение',
        deleteAccount: 'Удалить аккаунт',
    },
    wallet: {
        sync: 'Синхронизация кошелька',
        balanceTitle: 'Баланс Ton',
        actions: {
            receive: 'Получить',
            send: 'Отправить',
            buy: 'Купить'
        },
        empty: {
            message: 'У вас нет транзакций',
            receive: 'Получить TON'
        },
        pendingTransactions: 'Ожидают подтверждения'
    },
    transactions: {
        title: 'Транзакции',
        history: 'История',
    },
    receive: {
        title: 'Получить',
        subtitle: 'Поделитесь данной ссылкой, чтобы получить Ton',
        share: {
            title: 'My Tonhub Address'
        }
    },
    transfer: {
        title: 'Отправить',
        titleAction: 'Действие',
        confirm: 'Вы уверены что хотите продолжить?',
        error: {
            invalidAddress: 'Неверный адрес',
            invalidDomain: 'Неверный домен',
            invalidDomainString: 'Минимум 4 символа, максимум 126 символов. Допустимы латинские буквы (a-z), цифры (0-9) и дефис (-). Дефис не может находиться в начале и конце.',
            invalidAmount: 'Неверное количество',
            sendingToYourself: 'Вы не можете отправлять монеты сами себе',
            zeroCoins: 'К сожалению, вы не можете отправить ноль монет',
            notEnoughCoins: 'К сожалению, на кошельке недостаточно монет для совершения транзакции',
            addressIsForTestnet: 'Этот адрес для тестовой сети',
            addressCantReceive: 'Этот адрес не может принимать монеты',
            addressIsNotActive: 'У этого кошелька нет истории',
            addressIsNotActiveDescription: 'Это означает, что с данного адреса кошелька не было совершено ни одной транзакции',
            invalidTransaction: 'Неверная транзакция',
        },
        sendAll: 'Отправить все',
        scanQR: 'считать QR код',
        sendTo: 'Получатель',
        fee: 'Комиссия сети: {{fee}}',
        feeEmpty: 'Комиссия будет рассчитана позже',
        feeTitle: 'Комиссия сети',
        feeTotalTitle: 'Полная комиссия сети',
        purpose: 'Цель транзакции',
        comment: 'Cообщение (необязательное)',
        commentDescription: 'Сообщение будет видно всем в блокчейне',
        commentRequired: 'Обязательный комментарий',
        commentLabel: 'Сообщение',
        checkComment: 'Проверьте перед отправкой',
        confirmTitle: 'Подтверждение транзакции',
        confirmManyTitle: 'Подтверждение {{count}} транзакций',
        unknown: 'Неизвестная операция',
        moreDetails: 'Подробнее',
        gasFee: 'Gas комиссия',
        contact: 'Ваш контакт',
        firstTime: 'Отправка первый раз',
        requestsToSign: '{{app}} запрашивает подпись транзакции',
        smartContract: 'Смарт-контракт транзакция',
        txsSummary: 'Итого',
        txsTotal: 'Общая сумма',
        gasDetails: 'Детали комиссий',
        jettonGas: 'Газ за отправку жетонов',
        unusualJettonsGas: '⛽️ Необычно высокий газ за отправку жетонов',
        unusualJettonsGasTitle: '⚠️ Газ за отправку жетонов {{amount}} TON',
        unusualJettonsGasMessage: 'Комиссия за отправку жетонов выше чем обычно',
        addressNotActive: 'Не активен',
        wrongJettonTitle: '⚠️ Неверный жетон',
        wrongJettonMessage: 'Вы пытаетесь отправить жетон, которого у вас нет',
        notEnoughJettonsTitle: '⚠️ Недостаточно жетонов',
        notEnoughJettonsMessage: 'У вас недостаточно жетонов для отправки',
    },
    auth: {
        phoneNumber: 'Номер телефона',
        phoneVerify: 'Верификация номера',
        phoneTitle: 'Ваш номер',
        phoneSubtitle: 'Мы отправим код для проверки\nвашего номера',
        codeTitle: 'Введите код',
        codeSubtitle: 'Мы отправили код верификации на ',
        codeHint: 'Код',
        title: 'Запрос на подключение',
        message: '<strong>{{name}}</strong> хочет подключиться к вашему аккаунту',
        hint: 'Никакие средства не будут переведены и приложение не сможет получить доступ к вашим монетам.',
        action: 'Разрешить',
        expired: 'Этот запрос на авторизацию уже истек',
        failed: 'Ошибка при авторизации',
        completed: 'Этот запрос на авторизацию уже подтвержден',
        authorizedDescription: 'Теперь вы можете вернуться в приложение.',
        authorized: 'Запрос на авторизацию подтвержден',
        noApps: 'У вас еще нет авторизованных приложений или установленых расширений',
        name: 'Приложения',
        yourWallet: 'Ваш кошелёк',
        revoke: {
            title: 'Вы уверены что хотите удалить это приложение?',
            message: 'Это удалит связь между кошельком и приложением, но вы всегда сможете восстановить эту связь обратно.',
            action: 'Удалить'
        },
        apps: {
            title: 'Доверенные приложения',
            delete: {
                title: 'Удалить это расширение?',
                message: 'Это удалит связь между вашим кошельком и расширением, но вы всегда можете попытаться подключиться снова.',
            },
            description: 'Здесь будут отображаться авторизованные вами приложения или установленные расширения. Вы можете в любой момент отозвать доступ у любого приложения или расширения.',
            installExtension: 'Установить и открыть расширение для данного приложения'
        },
        consent: 'Нажимая кнопку продолжить вы соглашаетесь с нашими'
    },
    install: {
        title: 'Установить дополнение',
        message: '<strong>{{name}}</strong> хочет подключиться к вашему аккаунту',
        action: 'Установить'
    },
    sign: {
        title: 'Запрос подписи',
        message: 'Запросили подписать сообщение',
        hint: 'Никакие средства не будут переведены и приложение не сможет получить доступ к вашим монетам.',
        action: 'Подписать',
    },
    migrate: {
        title: 'Перенос старых кошельков',
        subtitle: 'Если вы пользовались устаревшими кошельками вы можете автоматически перевести все ваши средства со старых адресов.',
        inProgress: 'Перенос старых кошельков...',
        transfer: 'Переводим монеты с адреса {{address}}',
        check: 'Проверяем адрес {{address}}'
    },
    tx: {
        sending: 'Отправка',
        sent: 'Отправлено',
        received: 'Получено',
        bounced: 'Возвращено',
        tokenTransfer: 'Трансфер токенов',
        airdrop: 'Airdrop',
        failed: 'Ошибка',
    },
    txPreview: {
        sendAgain: 'Повторить',
        blockchainFee: 'Комиссия сети'
    },
    qr: {
        title: 'Наведите камеру на QR-код',
        requestingPermission: 'Запрашиваем доступ к камере...',
        noPermission: 'Разрешите доступ к камере, чтобы сканировать QR-коды',
        requestPermission: 'Открыть настройки',
        failedToReadFromImage: 'Не удалось прочитать QR-код из изображения',
    },
    products: {
        addNew: 'Добавить новый продукт',
        tonConnect: {
            errors: {
                connection: 'Ошибка соединения',
            }
        },
        accounts: 'Счета',
        services: 'Расширения',
        oldWallets: {
            title: 'Старые кошельки',
            subtitle: 'Нажмите, чтобы перенести кошельки'
        },
        transactionRequest: {
            title: 'Запрос транзакции',
            subtitle: 'Нажмите что бы посмотреть запрос'
        },
        signatureRequest: {
            title: 'Запрос подписи',
            subtitle: 'Нажмите что бы посмотреть запрос'
        },
        staking: {
            title: 'Стейкинг',
            balance: 'Баланс стейкинга',
            subtitle: {
                join: 'Зарабатывайте на TON до {{apy}}%',
                joined: 'Зарабатывайте до {{apy}}%',
                rewards: 'Расчетная доходность',
                apy: '~13.3% годовых от вклада',
                devPromo: 'Приумножайте тестовые монеты'
            },
            pools: {
                active: 'Активные пулы',
                best: 'Наилучший пул',
                alternatives: 'Альтернативы',
                private: 'Приватные пулы',
                restrictedTitle: 'Стейкинг Пул ограничен',
                restrictedMessage: 'Этот Стейкинг Пул доступен только для членов Whales Club',
                viewClub: 'Больше о Whales Club',
                nominators: 'Номинаторы',
                nominatorsDescription: 'Открыто для всех',
                club: 'Клубные',
                clubDescription: 'Только для членов клуба the Whales Club',
                team: 'Командные',
                teamDescription: 'Только для членов команды Ton Whales и ТОП 15 членов клуба',
                joinClub: "Вступить в клуб",
                joinTeam: "Присоединиться к нашей команде",
                clubBanner: 'Станьте членом нашего клуба',
                clubBannerLearnMore: 'Узнайте о нашем клубе',
                clubBannerDescription: 'Если вы не являетесь членом нашего клуба, ваши средства, внесенные на счет, будут храниться на балансе стейкинг пула, но не будут участвовать в стейкинге',
                teamBanner: 'Станьте членом нашей команды',
                teamBannerLearnMore: 'Узнайте о нашей команде',
                teamBannerDescription: 'Если вы не являетесь членом нашей команды или одним из топ 15-ти членов нашего клуба, ваши средства внесенные на счет, будут храниться на балансе стейкинг пула, но не будут участвовать в стейкинге',
                epnPartners: 'ePN Partners',
                epnPartnersDescription: 'Присоединяйтесь к более чем 200 000 вебмастеров, работающих с ePN, и получайте оплату в TON',
                moreAboutEPN: 'Узнать больше о ePN',
                lockups: 'Локапы',
                lockupsDescription: 'Позволяет владельцам крупных локапов в TON получать дополнительный доход',
                tonkeeper: 'Tonkeeper',
                tonkeeperDescription: 'Дружественный мобильный кошелек на TON',
            },
            transfer: {
                stakingWarning: 'Вы всегда можете внести новую ставку или увеличить существующую на любую сумму. Обратите внимание, что минимальная сумма составляет: {{minAmount}}',
                depositStakeTitle: 'Стейкинг',
                depositStakeConfirmTitle: 'Подтвердить стекинг',
                withdrawStakeTitle: 'Запрос на вывод',
                withdrawStakeConfirmTitle: 'Подтверждение вывода',
                topUpTitle: 'Пополнить',
                topUpConfirmTitle: 'Подтвердить пополнение',
                notEnoughStaked: 'К сожалению, у вас недостаточно монет на стейке',
                confirmWithdraw: 'Запросить вывод',
                confirmWithdrawReady: 'Вывести сейчас',
                restrictedTitle: 'Этот Стейкинг Пул ограничен',
                restrictedMessage: 'Ваши средства не будут принимать участия в стейкинге, если адрес вашего кошелька не находится в вайтлисте, а будут находиться на балансе пула и ожидать обратного вывода',
                notEnoughCoinsFee: 'На балансе вашего кошелька недостаточно средств для оплаты комиссии. Обратите внимание, что сумма комиссии {{amount}} TON должна находиться на основном балансе, а не на балансе стейкинга',
                notEnoughCoins: 'На балансе вашего кошелька недостаточно средств для операции пополения баланса стейкинга',
                ledgerSignText: 'Стейкинг: {{action}}',
            },
            nextCycle: 'След. цикл',
            cycleNote: 'Все транзакции (вывод, пополнение стейкинга) исполняются только после завершения цикла',
            cycleNoteWithdraw: 'Ваш запрос выполнится после завершения цикла. Потребуется повторное подтверждение вывода',
            buttonTitle: 'cтейкинг',
            balanceTitle: 'Стейкинг Баланс',
            actions: {
                deposit: 'Внести',
                top_up: 'Пополнить',
                withdraw: 'Вывести'
            },
            join: {
                title: 'Стань валидатором TON',
                message: 'Стейкинг — это общественное благо для экосистемы TON. Вы можете помочь защитить сеть и получить вознаграждение в процессе',
                buttonTitle: 'Начать зарабатывать',
                moreAbout: 'Подробнее о Ton Whales Staking Pool',
                earn: 'Получайте до',
                onYourTons: 'дохода со стейкинга',
                apy: '13.3%',
                yearly: 'годовых',
                cycle: 'Вознаграждения за стейкинг приходят каждые 36ч',
                ownership: 'Застейканные монеты принадлежат только вам',
                withdraw: 'Выводите и пополняйте баланс стейкинга в любое время',
                successTitle: 'Отправлено {{amount}} TON',
                successEtimation: 'Ваш предполагаемый годовой доход составляет {{amount}}\u00A0TON\u00A0(${{price}}).',
                successNote: 'Ваш застейканый TON будет активен после начала следующего цикла.'
            },
            pool: {
                balance: 'Общая ставка',
                members: 'Номинаторы',
                profitability: 'Прибыльность'
            },
            empty: {
                message: 'У вас нет транзакций'
            },
            pending: {
                deposit: 'Выполняется внесение',
                withdraw: 'Ожидание вывода'
            },
            withdrawStatus: {
                pending: 'Вывод ожидает',
                ready: 'Готово к выводу',
                withdrawNow: 'Вывести сейчас'
            },
            depositStatus: {
                pending: 'Взнос ожидает'
            },
            withdraw: 'Вывод',
            sync: 'Синхронизация данных',
            unstake: {
                title: 'Вы уверены что хотите запросить вывод?',
                message: 'Обратите внимание, что при запросе на вывод все незавершенные депозиты также будут возвращены.'
            },
            learnMore: 'Инфо',
            moreInfo: 'Больше информации',
            calc: {
                yearly: 'Доходность в год',
                monthly: 'Доходность в месяц',
                daily: 'Доходность в день',
                note: 'Рассчитано с учетом всех комиссий',
                text: 'Калькулятор доходности',
                yearlyTopUp: 'После пополнения',
                yearlyTotal: 'Всего вознаграждений за год',
                yearlyCurrent: 'Текущая',
                topUpTitle: 'Ваша годовая доходность'
            },
            info: {
                rate: '~13.3%',
                rateTitle: 'Годовая доходность',
                frequency: 'Каждые 36ч',
                frequencyTitle: 'Частота выплат',
                minDeposit: 'Минимальный депозит',
                poolFee: '3.3%',
                poolFeeTitle: 'Комиссия пула',
                depositFee: 'Комиссия за отправку',
                withdrawFee: 'Комиссия за вывод',
                withdrawRequestFee: 'Комиссия за запрос на вывод',
                withdrawCompleteFee: 'Комиссия за запрос на завершение вывода',
                blockchainFee: 'Комиссия сети',
                cooldownTitle: 'Период ожидания',
                cooldownActive: 'Активен',
                cooldownInactive: 'Неактивный',
                cooldownDescription: 'Двухчасовой период, применяемый в начале каждого стейкинг цикла для улучшения процесса снятия и внесения средств между циклами',
            },
            minAmountWarning: 'Минимальное количество {{minAmount}} TON',
            tryAgainLater: 'Пожалуйста, повторите попытку позже',
            banner: {
                estimatedEarnings: "Ваш предполагаемый годовой доход уменьшится на {{amount}}\u00A0TON\u00A0(${{price}})",
                estimatedEarningsDev: "Ваш предполагаемый годовой доход уменьшится",
                message: "Уверены, что хотите вывести?"
            }
        },
        zenPay: {
            title: 'Tonhub Bank card',
            pageTitles: {
                general: 'Tonhub Cards',
                card: 'Tonhub Card',
                cardDetails: 'Детали карты',
                cardCredentials: 'Данные карты',
                cardLimits: '*{{cardNumber}} Лимиты карты',
                cardLimitsDefault: 'Лимиты карты',
                cardDeposit: 'Пополнить TON',
                transfer: 'Перевод',
                cardSmartContract: 'Смарт-контракт карты',
                setUpCard: 'Настройка карты',
                pin: 'Смена PIN-кода',
            },
            hiddenCards: 'Скрытые карты',
            card: {
                cards: 'Карты Holders',
                title: 'Card *{{cardNumber}}',
                defaultSubtitle: 'Платите в TON, конвертация в EUR с комиссией 0%',
                defaultTitle: 'Tonhub Bank Card',
                eurSubtitle: 'Tonhub EUR',
                type: {
                    physical: 'Физическая карта',
                    virtual: 'Виртуальная',
                },
                notifications: {
                    type: {
                        card_ready: 'Карта активирована',
                        deposit: 'Пополнение карты',
                        charge: 'Оплата',
                        charge_failed: 'Оплата',
                        limits_change: {
                            pending: 'Изменение лимитов',
                            completed: 'Лимиты изменены',
                        },
                        card_withdraw: 'Перевод на кошелек',
                        contract_closed: 'Контракт закрыт',
                        card_block: 'Карта заблокирована',
                        card_freeze: 'Карта заморожена',
                        card_unfreeze: 'Карта разморожена',
                        card_paid: 'Выпуск банковской карты',
                    },
                    category: {
                        deposit: 'Пополнение',
                        charge: 'Покупки',
                        charge_failed: 'Покупки',
                        card_withdraw: 'Перевод',
                        other: 'Другое',
                    },
                    status: {
                        charge_failed: {
                            limit: {
                                onetime: 'Неудачно (превышен лимит на одну транзакцию)',
                                daily: 'Неудачно (превышен дневной лимит)',
                                monthly: 'Неудачно (превышен месячный лимит)',
                            },
                            failed: 'Неудачно',
                        },
                        completed: 'Завершено',
                    }
                }
            },
            confirm: {
                title: 'Вы уверены, что хотите закрыть этот экран?',
                message: 'Это отменит все ваши изменения'
            },
            enroll: {
                poweredBy: 'Based on TON, powered by ZenPay',
                description_1: 'Только вы управляете смарт-контрактом',
                description_2: 'Никто, кроме вас, не имеет доступа к вашим средствам',
                description_3: 'Вы действительно владеете своими деньгами',
                moreInfo: 'Подробнее о ZenPay Card',
                buttonSub: 'KYC и выпуск карты занимает ~5 минут'
            }
        }
    },
    welcome: {
        title: 'Tonhub',
        titleDev: 'Ton Sandbox Wallet',
        subtitle: 'Простой и безопасный кошелек для TON',
        subtitleDev: 'Кошелек для разработчиков',
        createWallet: 'Создать кошелек',
        importWallet: 'У меня уже есть кошелек',
        slogan: 'Это новый Tonhub',
        sloganDev: 'Это Ton Sandbox',
        slide_1: {
            title: 'Безопасный',
            subtitle: 'Надежный смарт-контракт, Touch/Face ID с паролем и все транзакции на децентрализованной блокчейн сети',
        },
        slide_2: {
            title: 'С крутой криптокартой',
            subtitle: 'Закажите карту сейчас. Внутренние переводы и покупки за минуты. Все это уникальная карта Tonhub',
        },
        slide_3: {
            title: 'Быстрый',
            subtitle: 'Благодаря уникальной архитектуре TON транзакции происходят за секунды',
        }
    },
    legal: {
        title: 'Правовая информация',
        subtitle: 'Нажимая кнопку продолжить вы соглашаетесь с нашими',
        create: 'Создате резервную копию',
        createSubtitle: 'Храните свой секретный ключ в надежном месте и не передавайте его никому. Это единственный способ получить доступ к вашему кошельку, если устройство потеряно.',
        privacyPolicy: 'Политикой конфиденциальности',
        termsOfService: 'Условиями использования'
    },
    create: {
        addNew: 'Создать новый кошелек',
        inProgress: 'Создаем...',
        backupTitle: 'Ваш секретный ключ',
        backupSubtitle: 'Запишите эти слова в том же порядке и сохраните их в надежном месте',
        okSaved: 'Ок, всё записано',
        copy: 'Скопировать в буфер обмена',
    },
    import: {
        title: 'Введите ключ восстановления',
        subtitle: 'Пожалуйста, восстановите доступ к вашему кошельку, введя 24 секретных слова, которые вы записали при создании кошелька',
        fullSeedPlaceholder: 'Введите 24 секретных слова',
        fullSeedPaste: 'Или вы можете вставить всю сид фразу сразу в поле ниже, где каждое слово разделено пробелом'
    },
    secure: {
        title: 'Защитите свой кошелек',
        titleUnprotected: 'Ваше устройство не защищено',
        subtitle: 'Мы используем биометрию для подтверждения транзакций что бы быть уверенными что никто кроме вас не сможет перевести ваши монеты.',
        subtitleUnprotected: 'Настоятельно рекомендуется включить пароль на вашем устройстве для защиты ваших активов.',
        subtitleNoBiometrics: 'Настоятельно рекомендуется включить биометрию на вашем устройстве для защиты ваших активов. Мы используем биометрию для подтверждения транзакций что бы быть уверенными что никто кроме вас не сможет перевести ваши монеты.',
        messageNoBiometrics: 'Настоятельно рекомендуется включить биометрию на вашем устройстве для защиты ваших активов.',
        protectFaceID: 'Защитить с Face ID',
        protectTouchID: 'Защитить с Touch ID',
        protectBiometrics: 'Защитить биометрией',
        protectPasscode: 'Защитить паролем устройства',
        upgradeTitle: 'Требуется обновление',
        upgradeMessage: 'Пожалуйста, разрешите приложению доступ к ключам для обновления. Никакие средства не будут переведены во время обновления. Пожалуйста, убедитесь что ваши секретные слова надежно сохранены.',
        allowUpgrade: 'Разрешить обновление',
        backup: 'Сохранить секретные слова',
        onLaterTitle: 'Настроить позже',
        onLaterMessage: 'Вы можете настроить защиту позже в настройках приложения',
        onLaterButton: 'Настроить позже',
        onBiometricsError: 'Ошибка подтверждения биометрии',
        lockAppWithAuth: 'Блокировать приложение {{method}}',
        methodPasscode: 'паролем',
    },
    backup: {
        title: 'Фраза восстановления',
        subtitle: 'Запишите эти 24 слова в указанном ниже порядке и сохраните их в секретном, надежном месте.'
    },
    backupIntro: {
        title: 'Создайте резервную копию',
        subtitle: 'На следующем шаге вы увидите 24 секретных слова, позволяющих восстановить кошелек.',
        clause1: 'Если я потеряю фразу восстановления, мои средства будут потеряны навсегда.',
        clause2: 'Если я раскрою или передам кому-либо свою фразу восстановления, мои средства могут быть украдены.',
        clause3: 'Я несу полную ответственность за сохранность моей фразы восстановления.'
    },
    errors: {
        incorrectWords: {
            title: 'Неверная фраза',
            message: 'Вы ввели неправильные секретные слова. Пожалуйста, проверьте ввод и попробуйте еще раз.'
        },
        secureStorageError: {
            title: 'Ошибка безопасного хранилища',
            message: 'К сожалению, мы не можем сохранить данные. Пожалуйста, перезагрузите телефон.'
        },
        title: 'Уупс',
        invalidNumber: 'Неа, этот номер не настоящий. Проверь ввод и повтори попытку.',
        codeTooManyAttempts: 'Ты слишком сильно старался. Повтори попытку через 15 минут.',
        codeInvalid: 'Неа, этот код не подходит. Проверь код и повтори попытку.',
        unknown: 'Уффф, это неизвестная ошибка. Я буквально не понимаю что делать. Попробуй выключить и включить, вдруг поможет.'
    },
    confirm: {
        logout: {
            title: 'Вы уверены что хотите выйти и удалить все данные?',
            message: 'Это действие приведет к удалению всех учетных записей с этого устройства. Прежде чем продолжить, убедитесь, что вы создали резервную копию своих 24 секретных слов.'
        },
        changeCurrency: 'Сменить освновную валюту на {{currency}}'
    },
    neocrypto: {
        buttonTitle: 'купить',
        alert: {
            title: 'Как происходит покупка',
            message: 'Заполните обязательные поля -> Выберите криптовалюту, сумму для покупки и адрес кошелька -> Перейдите к оплате -> Укажите свой e-mail для связи и пройдите простую верификацию, которая займет не больше 10 минут -> Завершите покупку. Регистрация не требуется!'
        },
        title: 'Покупайте TON с помощью кредитной карты за доллары США, евро и рубли',
        description: 'Вы попадёте в Neocrypto. Услуги, связанные с платежами, предоставляются Neocrypto, отдельной платформой, принадлежащей третьей стороне.\n\nПожалуйста, прочитайте и согласитесь с Условиями обслуживания Neocrypto, прежде чем использовать их сервис.',
        doNotShow: 'Больше не показывать для Neocrypto',
        termsAndPrivacy: 'Я прочитал и согласен с ',
        confirm: {
            title: 'Вы уверены, что хотите закрыть эту форму?',
            message: 'Это отменит все ваши изменения'
        }
    },
    known: {
        deposit: 'Депозит',
        depositOk: 'Депозит принят',
        withdraw: 'Запрос вывода {{coins}} 💎',
        withdrawAll: 'Запрос вывода всех монет',
        withdrawCompleted: 'Вывод завершен',
        withdrawRequested: 'Запрос на вывод принят',
        upgrade: 'Обновление кода до {{hash}}',
        upgradeOk: 'Обновление завершено',
        cashback: 'Кэшбек',
        tokenSent: 'Токен отправлен',
        tokenReceived: 'Токен получен'
    },
    jetton: {
        token: 'токен',
        productButtonTitle: 'Токены',
        productButtonSubtitle: '{{jettonName}} и {{count}} других',
    },
    connections: {
        extensions: 'Расширения',
        connections: 'Внешние приложения'
    },
    accounts: {
        active: 'Активные',
        noActive: 'Нет активных счетов',
        disabled: 'Неактивные',
        alertActive: 'Активировать {{symbol}}',
        alertDisabled: 'Сделать {{symbol}} неактивным',
        description: 'Чтобы изменить видимость счета, зажмите соответствующую кнопку на главном экране или нажмите в этом меню. Счет будет добавлен на главный экран или скрыт.',
        noAccounts: 'У вас ещё нет счетов',
    },
    spamFilter: {
        minAmount: 'Минимальная сумма TON',
        dontShowComments: 'Не показывать комментарии на SPAM транзакциях',
        minAmountDescription: 'Транзакции с количеством TON меньшим чем {{amount}} будут автоматически помечаться как SPAM',
        applyConfig: 'Установить выбраные настройки SPAM фильтра',
        denyList: 'Ручной спам фильтр',
        denyListEmpty: 'Нет заблокированных адресов',
        unblockConfirm: 'Разблокировать адрес',
        blockConfirm: 'Пометить адрес как спам',
        description: 'Вы можете легко добавить адрес в список заблокированных вручную, если зажмете любую транзакцию или адрес и во всплывшем меню выберете опцию \"Пометить адрес как спам\"'
    },
    security: {
        title: 'Безопасность',
        passcodeSettings: {
            setupTitle: 'Установить код доступа',
            confirmTitle: 'Подтвердить код доступа',
            changeTitle: 'Изменить код доступа',
            resetTitle: 'Сбросить код доступа',
            resetDescription: 'Вы можете сбросить код доступа, введя 24 секретных слова, которые вы записали при создании кошелька.',
            resetAction: 'Сбросить',
            error: 'Неверный код доступа',
            tryAgain: 'Ещё раз',
            success: 'Код доступа установлен',
            enterNew: 'Введите новый код',
            confirmNew: 'Подтвердите новый код',
            enterCurrent: 'Введите текущий код',
            enterPrevious: 'Введите предыдущий код',
            enterNewDescription: 'Установка пароля обеспечивает дополнительную защиту при работе с приложением',
            changeLength: 'Использовать {{length}}-значный код доступа',
            forgotPasscode: 'Забыли код доступа?',
            logoutAndReset: 'Выйти и сбросить код доступа',
        }
    },
    report: {
        title: 'Сообщить о проблеме',
        scam: 'мошенничество',
        bug: 'ошибка',
        spam: 'спам',
        offense: 'оскорбительный контент',
        posted: 'Ваша жалоба отправлена',
        error: 'Ошибка при отправке жалобы',
        message: 'Сообщение (обязательно)',
        reason: 'Причина обращения'
    },
    review: {
        title: 'Отзыв на расширение',
        rating: 'рейтинг',
        review: 'Отзыв (по желанию)',
        heading: 'Заголовок',
        posted: 'Отзыв отправлен',
        error: 'Ошибка при отправке отзыва'
    },
    deleteAccount: {
        title: 'Удалить аккаунт',
        action: 'Удалить аккаунт и все данные',
        logOutAndDelete: 'Выйти и удалить все данные',
        description: 'Это действие удалит все данные и выбранный кошелек с этого устройства и вашу учетную запись в блокчейне\nВы должны перевести все свои монеты TON на другой кошелек. Прежде чем продолжить, убедитесь, что на вашем счету есть более {{amount}} TON для завершения транзакции',
        complete: 'Удаление учетной записи завершено',
        error: {
            hasNfts: 'У вас на кошельке имеются NFT, для того чтобы удалить аккаунт, пожалуйста, отправьте их на другой кошелёк.',
            fetchingNfts: 'Не удалось получить информацию о наличии на кошельке NFT. Для того чтобы удалить аккаунт, пожалуйста, убедитесь, что на нем нет NFT.'
        },
        confirm: {
            title: 'Вы уверены что хотите удалить аккаунт и все данные из этого приложения?',
            message: 'Это действие приведет к удалению вашего аккаунта и всех данных из этого приложения и переведет все TON на кошелек с адресом {{address}}.\nПожалуйста, проверьте адрес кошелька перед продолжением.'
        }
    },
    logout: {
        title: 'Вы уверены что хотите выйти из {{name}}?',
        logoutDescription: 'Доступ к кошельку будет отключен. Вы сохранили свой секретный ключ?',
    },
    contacts: {
        title: 'Контакты',
        contact: 'Контакт',
        unknown: 'Неизвестный контакт',
        contacts: 'Мои контакты',
        name: 'Имя',
        lastName: 'Фамилия',
        company: 'Компания',
        add: 'Добавить Контакт',
        edit: 'Редактировать',
        save: 'Сохранить',
        notes: 'Заметки',
        alert: {
            name: 'Неверное имя',
            nameDescription: 'Имя контакта не может быть пустым или длиннее 126 символов',
            notes: 'Неверное поле',
            notesDescription: 'Поля не могут быть длиннее 280 символов',
        },
        delete: 'Удалить контакт',
        empty: 'У вас ещё нет контактов',
        description: 'Вы можете легко добавить адрес в контакты, зажав любую транзакцию или адрес и во всплывшем меню выберете опцию \"Добавить адрес в контакты\"',
        contactAddress: 'Адрес контакта',
        search: 'Имя или адрес кошелька',
        new: 'Новый контакт',
    },
    currency: {
        USD: "Доллар США",
        EUR: "Евро",
        RUB: "Российский рубль",
        GBP: "Британский фунт стерлингов",
        CHF: "Цвейцарский франк",
        CNY: "Китайский юань",
        KRW: "Южнокорейская вона",
        IDR: "Индонезийская рупия",
        INR: "Индийская рупия",
        JPY: "Японская иена",
    },
    txActions: {
        addressShare: 'Поделиться адресом',
        addressContact: 'Добавить адрес в контакты',
        addressContactEdit: 'Редактировать контакт адреса',
        addressMarkSpam: 'Пометить адрес как спам',
        txShare: 'Поделиться транзакцией',
        txRepeat: 'Повторить транзакцию',
        share: {
            address: 'TON адрес',
            transaction: 'TON транзакция',
        }
    },
    hardwareWallet: {
        ledger: 'Ledger',
        title: 'Подключить Ledger',
        description: 'Ваш аппаратный Ledger кошелёк',
        installation: 'Если это ваш первый раз, то вы можете прочитать',
        installationGuide: 'Руководство по подключению TON Ledger',
        connectionDescriptionAndroid: 'Подключите ваш Ledger через USB или Bluetooth',
        connectionDescriptionIOS: 'Подключите ваш Ledger через Bluetooth',
        connectionHIDDescription_1: '1. Включите устройство и разблокируйте его',
        connectionHIDDescription_2: '2. Нажмите \"Продолжить\"',
        chooseAccountDescription: 'Откройте приложение на вашем Ledger и выберите аккаунт, который вы хотите использовать',
        bluetoothScanDescription_1: '1. Включите устройство и разблокируйте его',
        bluetoothScanDescription_2: '2. Убедитесь, что bluetooth включен',
        bluetoothScanDescription_3: '3. Нажмите \"Начать поиск\" для поиска доступных устройств и выберите подходящий Ledger Nano X',
        bluetoothScanDescription_3_and: '3. Нажмите \"Начать поиск\" для поиска доступных устройств (нам потребуется доступ к данным о местоположении устройства и разрешение на поиск устройств рядом)',
        bluetoothScanDescription_4_and: '4. Далее выберите подходящий Ledger Nano X',
        openAppVerifyAddress: 'Проверьте адрес счета, который вы выбрали, а затем подтвердите адрес с помощью приложения Ton App на Ledger, когда появится запрос',
        devices: 'Ваши устройства',
        connection: 'Подключение',
        actions: {
            connect: 'Подключить Ledger',
            selectAccount: 'Выбрать аккаунт',
            account: 'Аккаунт #{{account}}',
            loadAddress: 'Подтвердить адрес',
            connectHid: 'Подключить через USB',
            connectBluetooth: 'Подключить через Bluetooth',
            scanBluetooth: 'Начать поиск',
            confirmOnLedger: 'Подтвердите на Ledger',
            sending: 'Ожидание транзакции',
            sent: 'Транзакция отправлена',
            mainAddress: 'Основной адрес',
            givePermissions: 'Дать доступ',
        },
        confirm: {
            add: 'Вы уверены, что хотите добавить это приложение?',
            remove: 'Вы уверены что хотите удалить это приложение?'
        },
        errors: {
            noDevice: 'Устройство не найдено',
            appNotOpen: 'Приложение Ton App не открыто на вашем Ledger',
            turnOnBluetooth: 'Пожалуйста, включите Bluetooth и попробуйте снова',
            lostConnection: 'Потеряно соединение с устройством',
            transactionNotFound: 'Транзакция не найдена',
            transactionRejected: 'Транзакция отклонена',
            transferFailed: 'Ошибка отправки транзакции',
            permissions: 'Пожалуйста, предоставьте разрешение на доступ к данным о местоположении устройства и разрешение на поиск устройств рядом',
        },
        moreAbout: 'Подробнее о Ledger'
    },
    devTools: {
        switchNetwork: 'Сеть',
        switchNetworkAlertTitle: 'Переключить на {{network}} сеть',
        switchNetworkAlertMessage: 'Вы уверены что хотите переключить сеть?',
        switchNetworkAlertAction: 'Переключить',
        copySeed: 'Скопировать сид фразу из 24 слов',
        copySeedAlertTitle: 'Скопировать сид фразу из 24 слов',
        copySeedAlertMessage: 'Внимание ⚠️ Копировать сид фразу из 24 слов в буфер обмена не безопасно. Продолжайте на свой страх и риск.',
        copySeedAlertAction: 'Скопировать',
        holdersOfflineApp: 'Holders Offline App',
    },
    wallets: {
        switchToAlertTitle: 'Переключить на {{wallet}}',
        switchToAlertMessage: 'Вы уверены что хотите переключить кошелек?',
        switchToAlertAction: 'Переключить',
        addNewTitle: 'Добавить кошелек',
        addNewAlertTitle: 'Добавить новый кошелек',
        addNewAlertMessage: 'Вы уверены что хотите добавить новый кошелек?',
        addNewAlertAction: 'Добавить',
        alreadyExistsAlertTitle: 'Кошелек уже существует',
        alreadyExistsAlertMessage: 'Кошелек с таким адресом уже существует',
        settings: {
            changeAvatar: 'Изменить аватар',
        }
    },
    webView: {
        contactSupportOrTryToReload: 'Пожалуйста, свяжитесь с поддержкой или попробуйте перезагрузить страницу',
        contactSupport: 'Связаться с поддержкой',
    },
    appAuth: {
        description: 'Чтобы продолжить вход в приложение',
    }
};

export default schema;