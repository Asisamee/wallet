import * as React from 'react';
import { fragment } from '../../fragment';
import { Platform, View } from 'react-native';
import { StatusBar, setStatusBarStyle } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEngine } from '../../engine/Engine';
import { HoldersAppComponent } from './components/HoldersAppComponent';
import { useParams } from '../../utils/useParams';
import { t } from '../../i18n/t';
import { useEffect, useLayoutEffect, useMemo } from 'react';
import { extractDomain } from '../../engine/utils/extractDomain';
import { holdersUrl } from '../../engine/holders/HoldersProduct';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { useAppConfig } from '../../utils/AppConfigContext';
import { useFocusEffect } from '@react-navigation/native';

export type HoldersAppParams = { type: 'card'; id: string; } | { type: 'account' };

export const HoldersAppFragment = fragment(() => {
    const { Theme } = useAppConfig();
    const engine = useEngine();
    const params = useParams<HoldersAppParams>();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const status = engine.products.holders.useStatus();

    const needsEnrollment = useMemo(() => {
        try {
            let domain = extractDomain(holdersUrl);
            if (!domain) {
                return; // Shouldn't happen
            }
            let domainKey = engine.products.keys.getDomainKey(domain);
            if (!domainKey) {
                return true;
            }
            if (status.state === 'need-enrolment') {
                return true;
            }
        } catch (error) {
            return true;
        }
        return false;
    }, [status]);

    useEffect(() => {
        if (needsEnrollment) {
            navigation.goBack();
        }
        return () => {
            engine.products.holders.offlinePreFlight();
        }
    }, [needsEnrollment]);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false
        });
    }, [navigation]);

    useFocusEffect(() => {
        setTimeout(() => {
            setStatusBarStyle('dark');
        }, 100);
    });

    return (
        <View style={{
            flex: 1,
            paddingTop: safeArea.top,
            backgroundColor: Theme.surfacePimary
        }}>
            <StatusBar style={'dark'} />

            <HoldersAppComponent
                title={t('products.zenPay.title')}
                variant={params}
                token={(
                    status as { state: 'need-phone', token: string }
                    | { state: 'need-kyc', token: string }
                    | { state: 'ready', token: string }
                ).token}
                endpoint={holdersUrl}
            />
        </View>
    );
});