import * as React from 'react';
import { ActivityIndicator, Pressable, StyleProp, Text, View, ViewStyle, Platform } from 'react-native';
import { iOSUIKit } from 'react-native-typography';
import * as t from "io-ts";

export type MainButtonAction = { type: 'showProgress' } | { type: 'hideProgress' } | { type: 'show' } | { type: 'hide' } | { type: 'enable' } | { type: 'disable' }
    | { type: 'setParams', args: Omit<MainButtonProps, 'isProgressVisible' | 'onPress'> }
    | { type: 'setText', ags: { text: string } }
    | { type: 'onClick', args: { callback?: () => void } }
    | { type: 'offClick' };

export function reduceMainButton() {
    return (mainButtonState: MainButtonProps, action: MainButtonAction) => {
        switch (action.type) {
            case 'showProgress':
                return { ...mainButtonState, isProgressVisible: true };
            case 'hideProgress':
                return { ...mainButtonState, isProgressVisible: false };
            case 'show':
                return { ...mainButtonState, isVisible: true };
            case 'hide':
                return { ...mainButtonState, isVisible: false };
            case 'enable':
                return { ...mainButtonState, isActive: true };
            case 'disable':
                return { ...mainButtonState, isActive: false };
            case 'setParams':
                return { ...mainButtonState, ...action.args };
            case 'setText':
                return { ...mainButtonState, text: action.ags.text };
            case 'onClick':
                return { ...mainButtonState, onPress: action.args.callback };
                case 'offClick':
                    return { ...mainButtonState, onPress: undefined };
            default:
                return mainButtonState;
        }
    }
}

export const setParamsCodec = t.type({
    text: t.string,
    textColor: t.string,
    color: t.string,
    isVisible: t.boolean,
    isActive: t.boolean,
});

export interface MainButton {
    setText: (text: string) => void,
    onClick: (callback: () => void) => void,
    showProgress: (leaveActive: boolean) => void,
    hideProgress: () => void,
    show: () => void,
    hide: () => void,
    enable: () => void,
    disable: () => void,
    setParams: (params: Omit<MainButtonProps, 'isProgressVisible' | 'onPress '>) => void,
}

export type MainButtonProps = {
    text: string,
    textColor: string,
    color: string,
    isVisible: boolean,
    isActive: boolean,
    isProgressVisible: boolean,
    onPress?: () => void,
}

export const DappMainButton = React.memo((
    props: { style?: StyleProp<ViewStyle> } & Omit<MainButtonProps, 'isVisible'>
) => {

    return (
        <Pressable
            disabled={!props.isActive}
            style={(p) => ([
                {
                    borderRadius: 14,
                    backgroundColor: props.color,
                },
                p.pressed && {
                    opacity: 0.55
                },
                props.style])}
            onPress={props.onPress}
        >
            {(p) => (
                <View style={{ height: 56 - 2, alignItems: 'center', justifyContent: 'center', minWidth: 64, paddingHorizontal: 16, }}>
                    {props.isProgressVisible && (
                        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 0, alignItems: 'center', justifyContent: 'center' }}>
                            <ActivityIndicator color={props.textColor} size='small' />
                        </View>
                    )}
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                            <Text
                                style={[iOSUIKit.title3, { marginTop: Platform.OS === 'ios' ? 0 : -1, opacity: (props.isProgressVisible ? 0 : 1) * (p.pressed ? 0.55 : 1), color: props.textColor, fontSize: 17, fontWeight: '600', includeFontPadding: false }]}
                                numberOfLines={1}
                                ellipsizeMode='tail'
                            >
                                {props.text}
                            </Text>
                        </View>
                    </View>
                </View>
            )}
        </Pressable>
    )
});