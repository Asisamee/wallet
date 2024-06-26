import { memo, useMemo } from "react";
import { BrowserListingsWithCategory } from "../../engine/hooks/banners/useBrowserListings";
import { t } from "../../i18n/t";
import { BrowserBanners } from "./BrowserBanners";
import { BrowserCategories } from "./BrowserCategories";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { NativeScrollEvent, NativeSyntheticEvent, Platform } from "react-native";
import Animated from "react-native-reanimated";

export type BrowserBannerItem = BrowserListingsWithCategory & { banner_type: 'bannerItem' };
export type BrowserListingItem = BrowserListingsWithCategory & { banner_type: 'listItem' };
export type ListingsCategory = {
    id: string;
    title: string;
    description?: string;
    weight: number;
    listings: BrowserListingItem[];
};

const initOthersCategory = {
    id: 'others',
    title: t('browser.listings.categories.other'),
    description: '',
    weight: -1,
    listings: []
};

const supportedCategories = ['other', 'exchange', 'defi', 'nft', 'games', 'social', 'utils', 'services'];
type SupportedCategory = 'other' | 'exchange' | 'defi' | 'nft' | 'games' | 'social' | 'utils' | 'services';

export const BrowserListings = memo(({
    listings,
    onScroll
}: {
    listings: BrowserListingsWithCategory[],
    onScroll?: ((event: NativeSyntheticEvent<NativeScrollEvent>) => void)
}) => {
    const bottomBarHeight = useBottomTabBarHeight();
    const { banners, list } = useMemo(() => {
        let banners: BrowserBannerItem[] = [];
        const list = new Map<string, ListingsCategory>();

        for (const l of listings) {
            if (l.banner_type === 'bannerItem') {
                banners.push(l as BrowserBannerItem);
            } else if (l.banner_type === 'listItem') {
                const category = l.category;

                if (!category) {
                    let others = list.get('others');

                    if (others) {
                        others.listings.push(l as BrowserListingItem);
                    } else {
                        others = { ...initOthersCategory };
                        others.listings.push(l as BrowserListingItem);
                        list.set('others', others);
                    }
                    continue;
                }

                const existing = list.get(category?.id ?? '');
                if (existing) {
                    existing.listings.push(l as BrowserListingItem);
                } else {
                    const title = supportedCategories.includes(category.id)
                        ? t(`browser.listings.categories.${category.id as SupportedCategory}`)
                        : category.title;

                    if (!title) {
                        continue;
                    }

                    list.set(
                        category.id,
                        {
                            id: category.id,
                            title: title,
                            description: category.description,
                            weight: category.weight || 0,
                            listings: [l as BrowserListingItem]
                        }
                    );
                }
            }
        }

        banners = banners.sort((a, b) => {
            if (a.weight === b.weight) {
                return 0;
            }
            return (a.weight ?? 0) > (b.weight ?? 0) ? -1 : 1;
        });

        return { banners, list };

    }, [listings]);

    return (
        <Animated.ScrollView
            style={{ flexGrow: 1, flexShrink: 1 }}
            showsVerticalScrollIndicator={false}
            contentInset={{ top: 0.1, left: 0, bottom: 156, right: 0 }}
            contentOffset={{ y: -56, x: 0 }}
            onScroll={onScroll}
            scrollEventThrottle={16}
            contentContainerStyle={Platform.select({
                android: { paddingBottom: 56 + 52 + 32 + bottomBarHeight },
                ios: { paddingBottom: 156 }
            })}
        >
            <BrowserBanners banners={banners} />
            <BrowserCategories list={list} />
        </Animated.ScrollView>
    );
});