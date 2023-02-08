import { Address } from "ton"
import { AppConfig } from "../AppConfig";

export type StakingPool = { name: string, restricted?: boolean };

export const KnownPools: { [key: string]: StakingPool } = AppConfig.isTestnet
    ? {
        [Address.parse('kQDV1LTU0sWojmDUV4HulrlYPpxLWSUjM6F3lUurMbwhales').toFriendly({ testOnly: AppConfig.isTestnet })]: {
            name: 'Sandbox Nominators #1',
        },
        [Address.parse('kQCkXp5Z3tJ_eAjFG_0xbbfx2Oh_ESyY6Nk56zARZDwhales').toFriendly({ testOnly: AppConfig.isTestnet })]: {
            name: 'Sandbox Nominators #2'
        }
    } : {
        [Address.parse('EQCkR1cGmnsE45N4K0otPl5EnxnRakmGqeJUNua5fkWhales').toFriendly({ testOnly: AppConfig.isTestnet })]: {
            name: 'Whales Nominators #1',
        },
        [Address.parse('EQCY4M6TZYnOMnGBQlqi_nyeaIB1LeBFfGgP4uXQ1VWhales').toFriendly({ testOnly: AppConfig.isTestnet })]: {
            name: 'Whales Nominators #2',
        },
        [Address.parse('EQCOj4wEjXUR59Kq0KeXUJouY5iAcujkmwJGsYX7qPnITEAM').toFriendly({ testOnly: AppConfig.isTestnet })]: {
            name: 'Whales Team #1',
            restricted: true
        },
        [Address.parse('EQBI-wGVp_x0VFEjd7m9cEUD3tJ_bnxMSp0Tb9qz757ATEAM').toFriendly({ testOnly: AppConfig.isTestnet })]: {
            name: 'Whales Team #2',
            restricted: true
        },
        [Address.parse('EQDFvnxuyA2ogNPOoEj1lu968U4PP8_FzJfrOWUsi_o1CLUB').toFriendly({ testOnly: AppConfig.isTestnet })]: {
            name: 'Whales Club #1',
            restricted: true
        },
        [Address.parse('EQA_cc5tIQ4haNbMVFUD1d0bNRt17S7wgWEqfP_xEaTACLUB').toFriendly({ testOnly: AppConfig.isTestnet })]: {
            name: 'Whales Club #2',
            restricted: true
        },
        [Address.parse('EQBYtJtQzU3M-AI23gFM91tW6kYlblVtjej59gS8P3uJ_ePN').toFriendly({ testOnly: AppConfig.isTestnet })]: {
            name: 'ePN Partners #1'
        },
        [Address.parse('EQCpCjQigwF27KQ588VhQv9jm_DUuL_ZLY3HCf_9yZW5_ePN').toFriendly({ testOnly: AppConfig.isTestnet })]: {
            name: 'ePN Partners #2'
        },
    }