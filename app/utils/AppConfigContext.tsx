import * as React from 'react';
import * as Application from 'expo-application';
import { storage, storagePersistence } from '../storage/storage';
import { DefaultTheme, Theme as NavigationThemeType } from "@react-navigation/native";
import { getCurrentAddress, markAddressSecured } from '../storage/appState';
import { useReboot } from './RebootContext';
import { createContext, memo, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { changeNavBarColor } from '../components/modules/NavBar';

export const isTestnetKey = 'isTestnet';

export type ThemeType = {
    style: 'light' | 'dark',
    background: string,
    backgroundUnchangeable: string,

    surfacePimary: string,
    surfaceSecondary: string,

    accent: string,
    accentPrimaryDisabledViolet: string,
    accentRed: string,
    accentGreen: string,
    accentBlue: string,

    textPrimary: string,
    textSecondary: string,
    textThird: string,

    iconPrimary: string,
    iconSecondary: string,

    divider: string,
    border: string,
    overlay: string,

    ton: string,
    telegram: string,

    transparent: string,
    white: string,
    black: string,

    cardBackground: string,
    warning: string,
};

const baseTheme: ThemeType = {
    style: 'light',
    background: '#FFFFFF',
    backgroundUnchangeable: '#000000',

    surfacePimary: 'white',
    surfaceSecondary: '#F7F8F9',

    accent: '#564CE2',
    accentPrimaryDisabledViolet: '#AAA5F0',
    accentRed: '#FF415C',
    accentGreen: '#00BE80',
    accentBlue: '#61BDFF',

    textPrimary: '#000',
    textSecondary: '#838D99',
    textThird: '#FFFFFF',

    iconPrimary: '#AAB4BF',
    iconSecondary: '#FFFFFF',

    divider: '#E4E6EA',
    border: '#F7F8F9',
    overlay: 'rgba(0, 0, 0, 0.6)',

    ton: '#0098EA',
    telegram: '#59ADE7',

    transparent: 'transparent',
    white: 'white',
    black: 'black',

    cardBackground: '#181524',
    warning: '#FF9A50'
}

const darkTheme: ThemeType = {
    ...baseTheme,

    style: 'dark',

    background: '#000000',

    surfacePimary: '#1C1C1E',
    surfaceSecondary: '#2C2C2D',

    accent: '#564CE2',
    accentPrimaryDisabledViolet: '#7F7BBB',

    textPrimary: '#FFFFFF',
    textSecondary: '#9398A1',

    iconPrimary: '#828B96',

    divider: '#444446',

    border: '#1C1C1E',
}

export const initialNavigationTheme: NavigationThemeType = {
    dark: false,
    colors: {
        ...DefaultTheme.colors,
        primary: baseTheme.accent,
        background: baseTheme.background,
        card: baseTheme.background
    }
};

export const initialAppConfig = {
    version: Application.nativeApplicationVersion,
    isTestnet: (storage.getBoolean(isTestnetKey) !== undefined)
        ? storage.getBoolean(isTestnetKey) === true
        : (
            Application.applicationId === 'com.tonhub.app.testnet' ||
            Application.applicationId === 'com.tonhub.app.debug.testnet' ||
            Application.applicationId === 'com.tonhub.wallet.testnet' ||
            Application.applicationId === 'com.tonhub.wallet.testnet.debug' ||
            Application.applicationId === 'com.sandbox.app.zenpay.demo' ||
            Application.applicationId === 'com.sandbox.app.zenpay.demo.debug'
        ),
};

export const AppConfigContext = createContext<{
    AppConfig: {
        version: string | null;
        isTestnet: boolean;
    },
    setNetwork: (isTestnet: boolean) => void;
    Theme: ThemeType;
    NavigationTheme: NavigationThemeType;
}>({
    AppConfig: initialAppConfig,
    setNetwork: () => { },
    Theme: baseTheme,
    NavigationTheme: initialNavigationTheme
});

export const AppConfigContextProvider = memo((props: { children: React.ReactNode }) => {
    const reboot = useReboot();
    const colorScheme = useColorScheme();
    const [AppConfig, setAppConfig] = useState(initialAppConfig);

    const Theme = useMemo(() => {
        return colorScheme === 'dark' ? darkTheme : baseTheme;
    }, [colorScheme]);

    const NavigationTheme = {
        dark: false,
        colors: {
            ...DefaultTheme.colors,
            primary: Theme.accent,
            background: Theme.background,
            card: Theme.background,
            text: Theme.textPrimary,
        }
    }

    const setNetwork = (isTestnet: boolean) => {
        const addr = getCurrentAddress();
        markAddressSecured(addr.address, isTestnet);
        storage.set(isTestnetKey, isTestnet);
        setAppConfig({
            ...AppConfig,
            isTestnet,
        });
    };

    useEffect(() => {
        changeNavBarColor(Theme.surfacePimary);
    }, [Theme]);

    return (
        <AppConfigContext.Provider value={{ AppConfig, setNetwork, Theme, NavigationTheme }}>
            {props.children}
        </AppConfigContext.Provider>
    );
});

export function useAppConfig() {
    return useContext(AppConfigContext);
}