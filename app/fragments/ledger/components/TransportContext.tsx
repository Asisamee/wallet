import Transport from "@ledgerhq/hw-transport";
import TransportHID from "@ledgerhq/react-native-hid";
import React, { useCallback, useEffect } from "react";
import { TonTransport } from "ton-ledger";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { Alert } from "react-native";
import { t } from "../../../i18n/t";
import { Observable, Subscription } from "rxjs";
import { startWalletV4Sync } from "../../../engine/sync/startWalletV4Sync";
import { Address } from "ton";
import { warn } from "../../../utils/log";
import { useEngine } from "../../../engine/Engine";

export type TypedTransport = { type: 'hid' | 'ble', transport: Transport }
export type LedgerAddress = { acc: number, address: string, publicKey: Buffer };

export const TransportContext = React.createContext<
    {
        ledgerConnection: TypedTransport | null,
        setLedgerConnection: (transport: TypedTransport | null) => void,
        tonTransport: TonTransport | null,
        addr: LedgerAddress | null,
        setAddr: (addr: LedgerAddress | null) => void
    }
    | null
>(null);

export const TransportProvider = ({ children }: { children: React.ReactNode }) => {
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const [ledgerConnection, setLedgerConnection] = React.useState<TypedTransport | null>(null);
    const [tonTransport, setTonTransport] = React.useState<TonTransport | null>(null);
    const [addr, setAddr] = React.useState<LedgerAddress | null>(null);

    const reset = useCallback(() => {
        setLedgerConnection(null);
        setTonTransport(null);
        setAddr(null);
    }, []);

    const onSetLedgerConnecton = useCallback((connection: TypedTransport | null) => {
        if (!connection) {
            ledgerConnection?.transport.off('disconnect', () => { });
            ledgerConnection?.transport.close();
        }
        setLedgerConnection(connection);
    }, []);

    const disconnectAlert = useCallback(() => {
        Alert.alert(t('hardwareWallet.errors.lostConnection'), undefined, [{
            text: t('common.back'),
            onPress: () => {
                navigation.popToTop();
            }
        }]);
    }, []);

    const onSetAddress = useCallback((address: LedgerAddress | null) => {
        setAddr(address);
        try {
            const parsed = Address.parse(addr!.address);
            startWalletV4Sync(parsed, engine);
        } catch (e) {
            warn('Failed to parse address');
        }
    }, [])

    useEffect(() => {
        let sub: Subscription | null = null;
        if (ledgerConnection?.type === 'ble') {
            ledgerConnection.transport.on('disconnect', disconnectAlert);

            setTonTransport(new TonTransport(ledgerConnection.transport));

        } else if (ledgerConnection?.type === 'hid') {
            ledgerConnection.transport.on('disconnect', disconnectAlert);
            ledgerConnection.transport.on('onDeviceDisconnect', disconnectAlert);

            sub = new Observable(TransportHID.listen).subscribe((e: any) => {
                if (e.type === "remove") {
                    disconnectAlert();
                }
            });

            setTonTransport(new TonTransport(ledgerConnection.transport));

            return () => {
                ledgerConnection.transport.off('disconnect', disconnectAlert);
                ledgerConnection.transport.off('onDeviceDisconnect', disconnectAlert);
                sub?.unsubscribe();
            }
        }
    }, [ledgerConnection]);

    useEffect(() => {
        return () => {
            if (ledgerConnection) {
                ledgerConnection.transport.off('disconnect', () => { });
                ledgerConnection.transport.off('onDeviceDisconnect', () => { });
                ledgerConnection.transport.close();
                reset();
            }
        }
    }, []);


    return (
        <TransportContext.Provider value={{ ledgerConnection, setLedgerConnection: onSetLedgerConnecton, tonTransport, addr, setAddr: onSetAddress }}>
            {children}
        </TransportContext.Provider>
    );
};

export function useTransport() {
    return React.useContext(TransportContext)!;
}