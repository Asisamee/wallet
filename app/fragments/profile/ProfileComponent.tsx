import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Avatar } from '../../components/Avatar';
import { useAppConfig } from '../../utils/AppConfigContext';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { getAppState } from '../../storage/appState';
import { memo } from 'react';
import { WalletAddress } from '../../components/WalletAddress';
import { t } from '../../i18n/t';
import { useAnimatedPressedInOut } from '../../utils/useAnimatedPressedInOut';
import Animated from 'react-native-reanimated';

import Chevron from '../../../assets/ic-chevron-down.svg';

export const ProfileComponent = memo(() => {
    const { Theme, AppConfig } = useAppConfig();
    const navigation = useTypedNavigation();
    const appState = getAppState();
    const address = appState.addresses[appState.selected].address;
    const { onPressIn, onPressOut, animatedStyle } = useAnimatedPressedInOut();

    return (
        <Pressable
            onPressIn={onPressIn}
            onPressOut={onPressOut}
        >
            <Animated.View style={[
                {
                    marginTop: 16,
                    backgroundColor: Theme.lightGrey,
                    borderRadius: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                },
                animatedStyle
            ]}>
                <View style={{ padding: 20, width: '100%', flexDirection: 'row', flexShrink: 1 }}>
                    <Avatar
                        size={46}
                        id={address.toFriendly({ testOnly: AppConfig.isTestnet })}
                        backgroundColor={Theme.accent}
                    />
                    <View style={{ paddingLeft: 12, alignSelf: 'stretch', justifyContent: 'center' }}>
                        <Text
                            style={{
                                color: Theme.textColor,
                                fontSize: 17, lineHeight: 24,
                                fontWeight: '600',
                            }}
                        >
                            {`${t('common.wallet')} ${appState.selected + 1}`}
                        </Text>
                        <WalletAddress
                            value={address.toFriendly({ testOnly: AppConfig.isTestnet })}
                            address={address}
                            elipsise
                            style={{ alignSelf: 'flex-start', }}
                            textStyle={{
                                fontSize: 15, lineHeight: 20,
                                fontWeight: '400',
                                textAlign: 'left',
                                color: Theme.darkGrey,
                                fontFamily: undefined
                            }}
                            lockActions
                        />
                    </View>
                </View>
                <Chevron
                    height={16} width={16}
                    style={{
                        height: 16, width: 16,
                        marginRight: 20,
                        transform: [{ rotate: '-90deg' }]
                    }}
                />
            </Animated.View>
        </Pressable>
    );
});