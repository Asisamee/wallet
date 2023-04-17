export enum ZenPayQueryParams {
    LockScroll = 'lockScroll',
    CloseApp = 'closeApp',
    OpenEnrollment = 'openEnrollment',
    BackPolicy = 'backPolicy',
    OpenUrl = 'openUrl',
    ShowKeyboardAccessoryView = 'showKAV',
}

export type BackPolicy = 'back' | 'close' | 'lock';