import { Extrapolate, SharedValue, interpolate, useAnimatedStyle } from "react-native-reanimated";

export function usePulsatingStyle(progress: SharedValue<number>) {
    return useAnimatedStyle(() => {
        const opacity = interpolate(
            progress.value,
            [0, 1],
            [1, 0.75],
            Extrapolate.CLAMP
        );
        const scale = interpolate(
            progress.value,
            [0, 1],
            [1, 1.03],
            Extrapolate.CLAMP,
        )
        return {
            opacity: opacity,
            transform: [{ scale: scale }],
        };
    }, []);
}