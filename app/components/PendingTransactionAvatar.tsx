import React, { memo, useEffect, useRef, useState } from "react"
import { StyleProp, View, ViewStyle, Image } from "react-native"
import { avatarHash } from "../utils/avatarHash";
import { Avatar, avatarColors } from "./Avatar";
import { KnownWallets } from "../secure/KnownWallets";
import CircularProgress, { defaultDuration, easeOutQuart } from "./CircularProgress/CircularProgress";
import { useNetwork, useTheme } from "../engine/hooks";

import IcPending from '@assets/ic-tx-pending.svg';

const Color = require('color');

export const PendingTransactionAvatar = memo(({
    style,
    avatarId,
    address,
    kind
}: {
    style?: StyleProp<ViewStyle>,
    avatarId: string,
    address?: string,
    kind: 'in' | 'out'
}) => {
    const theme = useTheme();
    const network = useNetwork();
    const ref = useRef<CircularProgress>(null);
    let color = avatarColors[avatarHash(avatarId, avatarColors.length)];

    let known = address ? KnownWallets(network.isTestnet)[address] : undefined;
    let lighter = Color(color).lighten(0.4).hex();
    let darker = Color(color).lighten(0.2).hex();

    if (known && known.colors) {
        lighter = known.colors.primary;
        darker = known.colors.secondary;
    }

    const [progressParams, setProgressParams] = useState({
        tintColor: darker,
        backgroundColor: lighter,
    });

    useEffect(() => {
        const timerId = setInterval(() => {
            if (progressParams.tintColor === darker) {
                setProgressParams({
                    tintColor: lighter,
                    backgroundColor: darker,
                });
            } else {
                setProgressParams({
                    tintColor: darker,
                    backgroundColor: lighter,
                });
            }
            ref.current?.animateTo(100, defaultDuration, easeOutQuart);
        }, defaultDuration, defaultDuration);

        return () => {
            clearInterval(timerId);
        }
    }, [progressParams]);

    return (
        <View style={[{ flex: 1, height: 46, width: 46, justifyContent: 'center', alignItems: 'center' }, style]}>
            <View style={{ width: 43, height: 43, borderRadius: 43, backgroundColor: theme.border }} />
            <View style={{
                position: 'absolute',
                top: 0, left: 0,
                right: 0, bottom: 0,
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Avatar size={42} id={avatarId} />
            </View>
            <CircularProgress
                ref={ref}
                style={{
                    position: 'absolute',
                    top: 0, left: 0,
                    right: 0, bottom: 0,
                    transform: [{ rotate: '-90deg' }]
                }}
                progress={100}
                animateFromValue={0}
                duration={defaultDuration}
                size={46}
                width={3}
                color={progressParams.tintColor}
                backgroundColor={theme.border}
                fullColor={null}
                loop={true}
                containerColor={theme.transparent}
            />
            <Image
                source={require('@assets/ic-tx-pending.png')}
                style={{ position: 'absolute', bottom: -2, right: -2, height: 16, width: 16 }}
            />
        </View>
    )
})