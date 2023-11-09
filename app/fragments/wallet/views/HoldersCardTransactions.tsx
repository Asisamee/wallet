import React, { memo, useMemo } from "react"
import { SectionList, View, Text } from "react-native"
import { HoldersCardNotification } from "./HoldersCardNotification";
import { formatDate } from "../../../utils/dates";
import { CardNotification } from "../../../engine/api/holders/fetchCardsTransactions";
import { useCardTransactions, useNetwork, useSelectedAccount, useTheme } from "../../../engine/hooks";

export const HoldersCardTransactions = memo(({ id }: { id: string }) => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const selected = useSelectedAccount();
    const notificationsState = useCardTransactions(selected!.address.toString({ testOnly: isTestnet }), id);
    const notifications = notificationsState?.data;
    const txs = notifications?.pages?.map((p) => p?.data).filter((d) => !!d).flat() as CardNotification[];

    const sections = useMemo(() => {
        const data: { title: string, data: CardNotification[] }[] = [];
        if (txs && txs.length > 0) {
            let lastDate: string | undefined;
            let lastDateIndex = 0;
            txs.forEach((tx, index) => {
                const dateKey = formatDate(tx.time / 1000);
                if (lastDate !== dateKey) {
                    lastDate = dateKey;
                    data.push({ title: dateKey, data: [] });
                    lastDateIndex = index;
                }
                data[data.length - 1].data.push(tx);
            });

        }
        return data;
    }, [txs]);

    return (
        <View style={{ flexGrow: 1 }}>
            <SectionList
                sections={sections}
                getItemCount={(data) => data.items.length}
                keyExtractor={(item, index) => item.id + index}
                onEndReached={() => notificationsState.fetchNextPage()}
                renderItem={({ item }) => (
                    <HoldersCardNotification
                        key={`card-tx-${id}-${item.id}`}
                        notification={item}
                    />
                )}
                stickySectionHeadersEnabled={false}
                onEndReachedThreshold={0.5}
                refreshing={notificationsState.isLoading}
                renderSectionHeader={({ section: { title } }) => (
                    <View style={{ width: '100%', paddingHorizontal: 16, paddingVertical: 8 }}>
                        <View style={{
                            position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
                            backgroundColor: theme.background,
                            opacity: 0.91,
                        }} />
                        <Text style={{
                            fontSize: 17,
                            fontWeight: '600',
                            lineHeight: 24, color: theme.textPrimary
                        }}>
                            {title}
                        </Text>
                    </View>
                )}
            />
        </View>
    );
});