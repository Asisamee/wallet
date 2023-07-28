import { StatusBar } from "expo-status-bar";
import React, { useEffect, useLayoutEffect } from "react"
import { Platform, View, Text, StyleProp, ViewStyle } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AndroidToolbar } from "./topbar/AndroidToolbar";
import { ThemeType, useAppConfig } from "../utils/AppConfigContext";
import { HeaderBackButton } from "@react-navigation/elements";
import { t } from "../i18n/t";
import { CloseButton } from "./CloseButton";
import { TypedNavigation, useTypedNavigation } from "../utils/useTypedNavigation";
import { SearchBarProps } from "react-native-screens";
import { NativeStackNavigationOptions } from "@react-navigation/native-stack";

export function useScreenHeader(
    navigation: TypedNavigation,
    Theme: ThemeType,
    options: {
        title?: string,
        textColor?: string,
        tintColor?: string,
        onBackPressed?: () => void,
        onClosePressed?: () => void,
        rightButton?: React.ReactNode,
        leftButton?: React.ReactNode,
    } & NativeStackNavigationOptions
) {
    useEffect(() => {
        navigation.setOptions({
            headerShown: options.headerShown,
            // headerLargeTitle: options.headerLargeTitle,
            headerSearchBarOptions: options.headerSearchBarOptions,
            headerLeft: () => {
                return (
                    options.leftButton ? options.leftButton : !!options.onBackPressed
                        ? <HeaderBackButton
                            label={t('common.back')}
                            labelVisible
                            onPress={options.onBackPressed}
                            tintColor={options.tintColor ?? Theme.accent}
                            style={{ marginLeft: -16 }}
                        />
                        : null
                );
            },
            title: options.title,
            headerBackVisible: true,
            headerRight: () => {
                return (
                    options.rightButton ? options.rightButton : !!options.onClosePressed
                        ? <CloseButton
                            onPress={options.onClosePressed}
                            tintColor={options.tintColor}
                            style={{ marginRight: -16, backgroundColor: 'red' }}
                        />
                        : null
                );
            }
        });
    }, [navigation, options, Theme]);
}

export const ScreenHeader = React.memo((
    {
        style,
        title,
        textColor,
        tintColor,
        onBackPressed,
        onClosePressed,
        leftButton,
        rightButton
    }: {
        style?: StyleProp<ViewStyle>,
        title?: string,
        textColor?: string,
        tintColor?: string,
        onBackPressed?: () => void,
        onClosePressed?: () => void,
        rightButton?: React.ReactNode,
        leftButton?: React.ReactNode,
    }
) => {
    const safeArea = useSafeAreaInsets();
    const { Theme } = useAppConfig();

    return (
        <View style={[{ width: '100%' }, style]}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar
                onBack={onBackPressed}
                style={{ position: 'absolute', top: safeArea.top }}
                pageTitle={title}
                tintColor={tintColor}
                textColor={textColor}
            />
            {Platform.OS === 'ios' && (
                <View style={{
                    flexDirection: 'row', alignItems: 'center',
                    height: 44,
                    marginTop: 14,
                }}>
                    <View style={{
                        position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
                        justifyContent: 'center', alignItems: 'center'
                    }}>
                        <Text style={{
                            color: textColor ?? Theme.textColor,
                            fontWeight: '600',
                            fontSize: 17,
                            lineHeight: 24,
                            maxWidth: '70%'
                        }}
                            ellipsizeMode={'tail'}
                        >
                            {title}
                        </Text>
                    </View>
                    {!!onBackPressed && !leftButton && (
                        <HeaderBackButton
                            label={t('common.back')}
                            labelVisible
                            onPress={onBackPressed}
                            tintColor={tintColor ?? Theme.accent}
                        />
                    )}
                    {!!onClosePressed && !rightButton && (
                        <>
                            <View style={{ flexGrow: 1 }} />
                            <CloseButton
                                onPress={onClosePressed}
                                tintColor={tintColor}
                                style={{ marginRight: 16 }}
                            />
                        </>
                    )}
                    {!onBackPressed && !!leftButton && (leftButton)}
                    {!onClosePressed && !!rightButton && (
                        <>
                            <View style={{ flexGrow: 1 }} />
                            {rightButton}
                        </>
                    )}
                </View>
            )}
        </View>
    );
});