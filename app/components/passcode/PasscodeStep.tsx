import React, { useEffect, useMemo } from "react";
import { Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
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

    const scale = useSharedValue(1);
    const animColor = useSharedValue(Theme.darkGrey);
    const scaleStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
            backgroundColor: animColor.value
        };
    });

    useEffect(() => {
        if (error) {
            animColor.value = withTiming(Theme.red);
        }
    }, [error]);

    useEffect(() => {
        if (index === passLen - 1) {
            scale.value = withSpring(1.4, { damping: 10, stiffness: 100 }, () => { scale.value = 1 });
            animColor.value = withTiming(Theme.accent);
        } else if (index > passLen - 1) {
            animColor.value = withTiming(Theme.darkGrey);
        }
    }, [passLen]);

    return (
        <View style={{
            justifyContent: 'center', alignItems: 'center',
            width: size, height: size,
            marginHorizontal: 11,
        }}>
            <Animated.View
                style={[{
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    justifyContent: 'center',
                    alignItems: 'center'
                }, scaleStyle]}
            >
                {!!emoji && (
                    <Text style={{ fontSize }}>
                        {rndmEmoji}
                    </Text>
                )}
            </Animated.View>
        </View>
    );
});