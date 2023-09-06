import { formatDuration } from "date-fns";
import React, { useEffect, useState } from "react"
import { StyleProp, Text, TextStyle } from "react-native"
import { t } from "../i18n/t";
import { useAppConfig } from "../utils/AppConfigContext";

export function getDuration(seconds: number) {
    let left = seconds;
    const hours = Math.floor(left / (60 * 60));
    left = left - hours * 60 * 60
    const minutes = Math.floor(left / 60);
    left = left - minutes * 60;

    return {
        hours,
        minutes,
        seconds: left
    }
}

type DurationKey = 'xSeconds' | 'xMinutes' | 'xHours' | 'xDays';

const formatDurationLocales = {
    ru: {
        xSeconds: '{{count}}',
        xMinutes: '{{count}}',
        xHours: '{{count}}',
        xDays: '{{count}}'
    },
    en: {
        xSeconds: '{{count}}',
        xMinutes: '{{count}}',
        xHours: '{{count}}',
        xDays: '{{count}}'
    }
}

export function shortLocale(code: 'ru' | 'en') {
    const formatDistance = (key: DurationKey, count: number) => {
        return formatDurationLocales[code][key].replace('{{count}}', String(count || '').padStart(2, '0'))
    }
    return { formatDistance };
}

function format(duration: number, hidePrefix?: boolean) {
    if (duration <= 0) return t('common.soon');
    return (hidePrefix ? '' : t('common.in') + ' ')
        + formatDuration(
            getDuration(duration),
            { locale: shortLocale(t('lang') as 'ru' | 'en'), delimiter: ':', zero: true }
        );
}

export const Countdown = React.memo(({ left, textStyle, hidePrefix }: { left: number, textStyle?: StyleProp<TextStyle>, hidePrefix?: boolean }) => {
    const [text, setText] = useState(format(left));
    const { Theme } = useAppConfig();

    useEffect(() => {
        setText(format(left, hidePrefix));
    }, [left]);

    return (
        <Text style={[{
            color: Theme.textSecondary,
            fontSize: 13,
            fontVariant: ['tabular-nums']
        }, textStyle]}
            ellipsizeMode="tail"
            numberOfLines={1}
        >
            {text}
        </Text>
    )
})