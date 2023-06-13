import React, { useCallback, useEffect, useReducer } from "react";
import { Platform, View, Text, Pressable } from "react-native";
import Animated, { SlideInRight, SlideOutLeft } from "react-native-reanimated";
import { t } from "../../i18n/t";
import { warn } from "../../utils/log";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { PasscodeInput } from "./PasscodeInput";
import { PasscodeSuccess } from "./PasscodeSuccess";
import { LoadingIndicator } from "../LoadingIndicator";
import { CloseButton } from "../CloseButton";
import { ThemeType, useAppConfig } from "../../utils/AppConfigContext";

type Action = { type: 're-enter' | 'input', input: string, } | { type: 'success' } | { type: 'loading' };
type Step = 'input' | 're-enter' | 'success' | 'loading';
type ScreenState = {
    step: Step,
    input: string,
};

const SetupLoader = React.memo((props: {
    onLoadEnd: (action: Action) => void,
    load: (input: string) => Promise<void>,
    input: string,
    theme: ThemeType
}) => {

    useEffect(() => {
        (async () => {
            try {
                await props.load(props.input);
                props.onLoadEnd({ type: 'success' });
            } catch (e) {
                warn('Failed to encrypt and store with passcode');
                props.onLoadEnd({ type: 're-enter', input: props.input });
            }
        })();
    }, []);

    return (
        <>
            <LoadingIndicator
                simple
                style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
            />
            <Pressable
                style={({ pressed }) => {
                    return {
                        position: 'absolute', top: 24, right: 16,
                        opacity: pressed ? 0.5 : 1,
                    }
                }}
                onPress={() => {
                    props.onLoadEnd({ type: 'input', input: '' });
                }}
            >
                <Text style={{
                    color: props.theme.accent,
                    fontSize: 17,
                    fontWeight: '500',
                }}>
                    {t('common.back')}
                </Text>
            </Pressable>
        </>
    );
});

function reduceSteps() {
    return (state: ScreenState, action: Action): ScreenState => {
        switch (action.type) {
            case 're-enter':
                return {
                    step: 're-enter',
                    input: action.input
                };
            case 'input':
                return {
                    step: 'input',
                    input: ''
                };
            case 'loading':
                return {
                    step: 'loading',
                    input: state.input
                };
            case 'success':
                return {
                    step: 'success',
                    input: state.input
                };
            default:
                return state;
        }
    };
}

export const PasscodeSetup = React.memo((
    {
        description,
        onReady,
        initial,
        onLater,
        showSuccess
    }: {
        description?: string,
        onReady?: (pass: string) => Promise<void>,
        onLater?: () => void,
        initial?: boolean,
        showSuccess?: boolean,
    }) => {
    const navigation = useTypedNavigation();
    const { Theme } = useAppConfig();

    const [state, dispatch] = useReducer(reduceSteps(), { step: 'input', input: '' });

    return (
        <View style={{
            width: '100%', height: '100%',
        }}>
            {state.step === 'input' && (
                <Animated.View style={{ flexGrow: 1 }} exiting={SlideOutLeft}>
                    <PasscodeInput
                        title={t('security.passcodeSettings.enterNew')}
                        description={description}
                        onEntered={(pass) => {
                            if (!pass) {
                                throw new Error('Passcode is required');
                            }
                            dispatch({ type: 're-enter', input: pass });
                        }}
                    />
                    {!!onLater && (
                        <Pressable
                            style={({ pressed }) => {
                                return {
                                    position: 'absolute', top: 24, right: 16,
                                    opacity: pressed ? 0.5 : 1,
                                }
                            }}
                            onPress={onLater}
                        >
                            <Text style={{
                                color: Theme.accent,
                                fontSize: 17,
                                fontWeight: '500',
                            }}>
                                {t('common.later')}
                            </Text>
                        </Pressable>
                    )}
                </Animated.View>
            )}

            {state.step === 're-enter' && (
                <Animated.View style={{ flexGrow: 1 }} exiting={SlideOutLeft} entering={SlideInRight}>
                    <PasscodeInput
                        title={t('security.passcodeSettings.confirmNew')}
                        onEntered={(pass) => {
                            if (pass !== state.input) {
                                throw new Error('Passcode does not match');
                            }
                            dispatch({ type: 'loading' });
                        }}
                    />
                    {!!initial && (
                        <Pressable
                            style={({ pressed }) => {
                                return {
                                    position: 'absolute', top: 24, right: 16,
                                    opacity: pressed ? 0.5 : 1,
                                }
                            }}
                            onPress={() => {
                                dispatch({ type: 'input', input: '' });
                            }}
                        >
                            <Text style={{
                                color: Theme.accent,
                                fontSize: 17,
                                fontWeight: '500',
                            }}>
                                {t('common.back')}
                            </Text>
                        </Pressable>
                    )}
                </Animated.View>
            )}
            {state.step === 'success' && showSuccess && (
                <>
                    <PasscodeSuccess
                        onSuccess={navigation.goBack}
                        title={t('security.passcodeSettings.success')}
                    />
                    {Platform.OS === 'ios' && (
                        <CloseButton
                            style={{ position: 'absolute', top: 12, right: 10 }}
                            onPress={navigation.goBack}
                        />
                    )}
                </>
            )}
            {state.step === 'loading' && (
                <SetupLoader
                    onLoadEnd={dispatch}
                    load={async (pass) => { await onReady?.(pass) }}
                    input={state.input}
                    theme={Theme}
                />
            )}
        </View>
    );
});