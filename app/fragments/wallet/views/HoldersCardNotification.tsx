import { Pressable, View, Text } from "react-native";
import { CardNotification } from "../../../engine/api/holders/fetchCardsTransactions";
import { memo } from "react";
import { useAppConfig } from "../../../utils/AppConfigContext";
import { formatDate, formatTime } from "../../../utils/dates";
import { notificationCategoryFormatter, notificationTypeFormatter } from "../../../utils/holders/notifications";
import { HoldersNotificationIcon } from "./HoldersNotificationIcon";
import { ValueComponent } from "../../../components/ValueComponent";
import { PriceComponent } from "../../../components/PriceComponent";
import BN from "bn.js";

export const HoldersCardNotification = memo(({ notification }: { notification: CardNotification }) => {
    const { Theme } = useAppConfig();

    return (
        <Pressable
            style={{
                paddingHorizontal: 16,
                paddingVertical: 20
            }}
        >
            <View style={{
                alignSelf: 'stretch',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
            }}>
                <HoldersNotificationIcon notification={notification} />
                <View style={{ flex: 1, marginRight: 4 }}>
                    <Text
                        style={{ color: Theme.textPrimary, fontSize: 17, fontWeight: '600', lineHeight: 24, flexShrink: 1 }}
                        ellipsizeMode={'tail'}
                        numberOfLines={1}
                    >
                        {notificationTypeFormatter(notification)}
                    </Text>
                    <Text
                        style={{ color: Theme.textSecondary, fontSize: 15, marginRight: 8, lineHeight: 20, fontWeight: '400', marginTop: 2 }}
                        ellipsizeMode="middle"
                        numberOfLines={1}
                    >
                        {notificationCategoryFormatter(notification) + ' • ' + formatDate(notification.time / 1000) + ' • ' + formatTime(notification.time / 1000)}
                    </Text>
                </View>
                <View>
                    {(notification.type === 'deposit' ||
                        notification.type === 'charge' ||
                        notification.type === 'charge_failed' ||
                        notification.type === 'card_paid' ||
                        notification.type === 'card_withdraw') ? (
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text
                                style={{
                                    color: notification.type === 'deposit'
                                        ? Theme.accentGreen
                                        : notification.type === 'charge_failed' ? Theme.accentRed : Theme.textPrimary,
                                    fontWeight: '600',
                                    lineHeight: 24,
                                    fontSize: 17,
                                    marginRight: 2,
                                }}
                                numberOfLines={1}
                            >
                                {notification.type === 'deposit' ? '+' : '-'}
                                <ValueComponent
                                    value={new BN(notification.data.amount)}
                                    precision={3}
                                />
                                {' TON'}
                            </Text>
                            <PriceComponent
                                amount={new BN(notification.data.amount)}
                                prefix={notification.type === 'deposit' ? '+' : '-'}
                                style={{
                                    height: undefined,
                                    backgroundColor: Theme.transparent,
                                    alignSelf: 'flex-end',
                                    paddingHorizontal: 0, paddingVertical: 0,
                                }}
                                textStyle={{ color: Theme.textSecondary, fontWeight: '400', fontSize: 15, lineHeight: 20 }}
                            />
                        </View>
                    ) : (
                        <View style={{ flexGrow: 1 }} />
                    )}
                </View>
            </View>
        </Pressable>
    )
});