import React, { useMemo } from "react";
import { Text, View } from "react-native";
import Animated, { BounceIn, BounceOut } from "react-native-reanimated";
import { emojis } from "../../utils/emojis";
import { useAppConfig } from "../../utils/AppConfigContext";

const getRandomEmoji = () => {
    const randomIndex = Math.floor(Math.random() * emojis.length);
    return emojis[randomIndex];
}

export const PasscodeStep = React.memo((
    {
        dotSize,
        error,
        emoji,
        index,
        passLen,
        fontSize,
    }: {
        dotSize: number,
        error?: boolean,
        emoji?: boolean,
        index: number,
        passLen: number,
        fontSize?: number,
    }
) => {
    const { Theme } = useAppConfig();
    const size = emoji ? 32 : dotSize;
    const rndmEmoji = useMemo(() => {
        if (!emoji) return '';
        return getRandomEmoji();
    }, [emoji]);

    const color = useMemo(() => {
        if (emoji) {
            return 'transparent';
        }
        if (!error) {
            return Theme.accent;
        }

        return Theme.dangerZone;
    }, [error, emoji]);

    return (
        <View style={{
            justifyContent: 'center', alignItems: 'center',
            width: size, height: size,
            marginHorizontal: 11,
        }}>
            {index >= passLen && (
                <View
                    style={{
                        width: size,
                        height: size,
                        borderRadius: emoji ? 0 : size / 2,
                        backgroundColor: emoji ? Theme.background : '#666',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    {!!emoji && (
                        <Text style={{ fontSize }}>
                            {'⚫'}
                        </Text>
                    )}
                </View>
            )}
            {index < passLen && (
                <Animated.View
                    entering={BounceIn}
                    exiting={BounceOut}
                    style={{
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        backgroundColor: color,
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}
                >
                    {!!emoji && (
                        <Text style={{ fontSize }}>
                            {rndmEmoji}
                        </Text>
                    )}
                </Animated.View>
            )}
        </View>
    );
});