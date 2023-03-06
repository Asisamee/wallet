import { Engine } from "../Engine";
import { createLogger, warn } from '../../utils/log';
import EventSource, { MessageEvent } from 'react-native-sse';
import { ConnectedApp, ConnectedAppConnection, ConnectedAppConnectionRemote, ConnectEventError, ConnectQrQuery, SignRawParams, TonConnectBridgeType } from '../tonconnect/types';
import { AppRequest, Base64, ConnectEvent, ConnectRequest, CONNECT_EVENT_ERROR_CODES, DisconnectEvent, hexToByteArray, RpcMethod, SEND_TRANSACTION_ERROR_CODES, SessionCrypto, WalletResponse } from '@tonconnect/protocol';
import { selector, useRecoilValue } from 'recoil';
import { AppConfig } from '../../AppConfig';
import { AppState } from 'react-native';
import { AppManifest, fetchManifest } from '../tonconnect/fetchManifest';
import { storage } from '../../storage/storage';
import { extensionKey } from './ExtensionsProduct';
import { getTimeSec } from '../../utils/getTimeSec';
import { tonConnectDeviceInfo } from "../tonconnect/config";
import { ConnectReplyBuilder } from "../tonconnect/ConnectReplyBuilder";
import { getCurrentAddress } from "../../storage/appState";
import { contractFromPublicKey } from "../contractFromPublicKey";
import { Cell, StateInit } from "ton";
import { CloudValue } from "../cloud/CloudValue";
import { sendTonConnectResponse } from "../api/sendTonConnectResponse";

let logger = createLogger('tonconnect');

export const bridgeUrl = 'https://connect.tonhubapi.com/tonconnect';

export class ConnectProduct {
    readonly engine: Engine;
    private _destroyed: boolean;

    readonly #pendingRequestsSelector;
    readonly extensions: CloudValue<{ installed: { [key: string]: ConnectedApp } }>;
    readonly pendingRequestsItem;
    readonly #extensionsSelector;
    private eventSource: EventSource | null = null;
    private connections: ConnectedAppConnectionRemote[] = [];
    private activeRequests: { [from: string]: AppRequest<RpcMethod> } = {};

    constructor(engine: Engine) {
        this.engine = engine;
        this._destroyed = false;
        this.extensions = this.engine.cloud.get('wallet.tonconnect.extensions.v1', (src) => { src.installed = {} });
        this.pendingRequestsItem = this.engine.persistence.connectDAppRequests.item();
        this.#pendingRequestsSelector = selector({
            key: 'tonconnect/requests',
            get: ({ get }) => {
                let reqests = get(this.pendingRequestsItem.atom);
                return reqests ?? [];
            },
            dangerouslyAllowMutability: true
        });
        this.#extensionsSelector = selector({
            key: 'wallet/' + engine.address.toFriendly({ testOnly: AppConfig.isTestnet }) + '/tonconnect/extensions',
            get: ({ get }) => {
                let apps = get(this.extensions.atom);
                let res: {
                    key: string,
                    url: string,
                    name: string,
                    image: string | null,
                    termsOfUseUrl: string | null,
                    privacyPolicyUrl: string | null,
                }[] = [];

                for (let k in apps.installed) {
                    let app = apps.installed[k];
                    let key = extensionKey(app.url);

                    const persisted = this.engine.persistence.connectDApps.item(key).value;

                    if (!persisted) {
                        continue;
                    }
                    res.push({
                        key: k,
                        url: app.url,
                        name: app.name ?? persisted.name,
                        image: app.iconUrl ?? persisted.iconUrl,
                        privacyPolicyUrl: persisted.privacyPolicyUrl ?? null,
                        termsOfUseUrl: persisted.termsOfUseUrl ?? null
                    });
                }
                return res;
            }
        });
        this._startSync();

        // Refresh on app load
        AppState.addEventListener('change', () => {
            this.extensions.invalidate();
        });
    }

    get ready() {
        return true;
    }

    destroy() {
        if (!this._destroyed) {
            this._destroyed = true;
        }
    }

    close() {
        if (this.eventSource) {
            this.eventSource.removeAllEventListeners();
            this.eventSource.close();
            this.eventSource = null;

            logger.log('sse close');
        }
    }

    async open(connections: ConnectedAppConnection[]) {
        // Clear old connections
        this.close();

        this.connections = connections.filter((item) => item.type === TonConnectBridgeType.Remote) as ConnectedAppConnectionRemote[];

        if (this.connections.length === 0) {
            return;
        }

        const walletSessionIds = this.connections.map((item) => new SessionCrypto(item.sessionKeyPair).sessionId).join(',');
        let url = `${bridgeUrl}/events?client_id=${walletSessionIds}`;
        const lastEventId = await this.getLastEventId();

        if (lastEventId) {
            url += `&last_event_id=${lastEventId}`;
        }

        this.eventSource = new EventSource(url);

        this.eventSource.addEventListener(
            'message',
            (event) => {
                logger.log(`sse connect message: type ${event}`);
                this.handleMessage(event as MessageEvent);
            }
        );

        this.eventSource.addEventListener('open', () => {
            logger.log('sse connect: opened');
        });

        this.eventSource.addEventListener('close', () => {
            logger.log('sse connect: closed');
        });

        this.eventSource.addEventListener('error', (event) => {
            warn('sse connect: error' + JSON.stringify(event));
        });
    }

    private _startSync() {
        const apps = Object.keys(this.extensions.value.installed);
        const connections: ConnectedAppConnection[] = []
        for (let appKey of apps) {
            const appConnections = this.engine.persistence.connectAppConnections.item(appKey).value;
            connections.push(...(appConnections ?? []));
        }
        this.open(connections);
    }

    // 
    // Events
    // 

    private async setLastEventId(lastEventId: string) {
        storage.set('connect_last_event_id', lastEventId);
    }

    private async getLastEventId() {
        return storage.getString('connect_last_event_id');
    }

    async handleConnectDeeplink(query: ConnectQrQuery) {
        try {
            const protocolVersion = Number(query.v);
            const request = JSON.parse(decodeURIComponent(query.r)) as ConnectRequest;
            const clientSessionId = query.id;

            const manifest = await this.getConnectAppManifest(request.manifestUrl);

            return ({
                protocolVersion,
                request,
                clientSessionId,
                manifest
            });
        } catch (err) {
            logger.warn(err);
        }
    }

    // 
    // App Manifests
    // 

    useAppManifest(url: string) {
        return useRecoilValue(this.engine.persistence.connectDApps.item(extensionKey(url)).atom);
    }

    async getConnectAppManifest(url: string) {
        let key = extensionKey(url);
        const isPersisted = this.engine.persistence.connectManifests.item(key).value;
        // fetch and add if does not exist
        if (!isPersisted) {
            try {
                const appData = await fetchManifest(url);
                if (appData) {
                    this.updateConnectAppManifest(appData);
                    this.engine.persistence.connectManifests.item(key).update(() => appData.url);
                    return appData;
                }
            } catch (e) {
                warn(e);
                return null;
            }
            return null;
        }
        const stored = this.engine.persistence.connectDApps.item(isPersisted).value;

        if (!stored) {
            try {
                const appData = await fetchManifest(url);
                if (appData) {
                    this.updateConnectAppManifest(appData);
                    this.engine.persistence.connectManifests.item(key).update(() => appData.url);
                    return appData;
                }
            } catch (e) {
                warn(e);
                return null;
            }
            return null;
        }

        return stored;
    }

    private updateConnectAppManifest(appData: AppManifest) {
        let key = extensionKey(appData.url);
        const app = this.engine.persistence.connectDApps.item(key);
        app.update(() => appData);
    }

    // 
    // Apps & Connections
    // 

    useExtensions() {
        return useRecoilValue(this.#extensionsSelector);
    }

    getExtension(key: string) {
        return this.extensions.value.installed[key];
    }

    findConnectedAppByClientSessionId(clientSessionId: string): { connectedApp: ConnectedApp | null; connection: ConnectedAppConnection | null } {
        const connectedAppsList = Object.values(this.extensions.value.installed);
        let connection: ConnectedAppConnection | null = null;

        const connectedApp = connectedAppsList.find((app) => {
            const connections = this.engine.persistence.connectAppConnections.item(extensionKey(app.url)).value;
            return connections?.find((item) => {
                if (item.type === TonConnectBridgeType.Remote && item.clientSessionId === clientSessionId) {
                    connection = item;
                    return true;
                }

                return false;
            })
        });

        return { connectedApp: connectedApp ?? null, connection };
    };

    getConnectedAppByUrl(url: string): ConnectedApp | null {
        const apps = Object.values(this.extensions.value.installed);
        const fixedUrl = url.replace(/\/$/, '');

        return apps.find((app) => fixedUrl.startsWith(app.url.replace(/\/$/, ''))) ?? null;
    };

    getConnectionByClientSessionId(clientSessionId: string): ConnectedAppConnectionRemote | undefined {
        const connection = this.connections.find((item) => {
            return item.clientSessionId === clientSessionId
        });

        if (!!connection) {
            return connection;
        }

        logger.warn(`connection with clientId "${clientSessionId}" not found!`);
        return;
    }

    saveAppConnection(
        app: { url: string, name: string, iconUrl: string, autoConnectDisabled: boolean },
        connection: ConnectedAppConnection
    ) {
        let key = extensionKey(app.url);

        // Update cloud value
        const connected = this.extensions.value.installed[key];
        if (!!connected) {
            this.extensions.update((doc) => {
                doc.installed[key].iconUrl = app.iconUrl;
                doc.installed[key].name = app.name;
                doc.installed[key].date = Date.now();
                doc.installed[key].autoConnectDisabled = app.autoConnectDisabled;
            });
        } else {
            this.extensions.update((doc) => {
                delete doc.installed[key];
                doc.installed[key] = {
                    url: app.url,
                    iconUrl: app.iconUrl,
                    name: app.name,
                    date: Date.now(),
                    autoConnectDisabled: app.autoConnectDisabled,
                }
            });
        }

        // Persist connection
        this.engine.persistence.connectAppConnections.item(key).update((src) => {
            return [...(src ?? []), connection];
        });

        // Restart sync
        this._startSync();
    }

    removeConnectedApp(url: string) {
        let key = extensionKey(url);

        if (!this.extensions.value.installed[key]) {
            return;
        }
        this.extensions.update((doc) => {
            delete doc.installed[key];
        });

        this._startSync();
    }

    // 
    // Handlers
    // 

    async handleSendTransaction(tx: {
        request: AppRequest<'sendTransaction'>,
        callback: (response: WalletResponse<'sendTransaction'>) => void,
        from: string
    }) {
        const params = JSON.parse(tx.request.params[0]) as SignRawParams;

        const isValidRequest =
            params && typeof params.valid_until === 'number' &&
            Array.isArray(params.messages) &&
            params.messages.every((msg) => !!msg.address && !!msg.amount);

        if (!isValidRequest) {
            tx.callback({
                error: {
                    code: SEND_TRANSACTION_ERROR_CODES.UNKNOWN_ERROR,
                    message: `Bad request`,
                },
                id: tx.request.id.toString(),
            });
            return;
        }

        const { valid_until } = params;

        if (valid_until < getTimeSec()) {
            tx.callback({
                error: {
                    code: SEND_TRANSACTION_ERROR_CODES.UNKNOWN_ERROR,
                    message: `Request timed out`,
                },
                id: tx.request.id.toString(),
            });
            return;
        }

        const current = this.pendingRequestsItem.value ?? [];
        const found = current.find((item) => item.from === tx.from);
        if (found) {
            tx.callback({
                error: {
                    code: SEND_TRANSACTION_ERROR_CODES.UNKNOWN_ERROR,
                    message: `Request already pending`,
                },
                id: tx.request.id.toString(),
            });
            return;
        }
        this.pendingRequestsItem.update((doc) => {
            const temp = doc ?? [];
            temp.push({
                from: tx.from,
                id: tx.request.id.toString(),
                params: tx.request.params,
                method: 'sendTransaction'
            });
            return temp;
        });
    }

    private async handleRequest<T extends RpcMethod>(args: {
        request: AppRequest<T>,
        connectedApp: ConnectedApp | null,
        callback: (response: WalletResponse<T>) => void,
        from: string
    }) {
        if (!args.connectedApp) {
            args.callback({
                error: {
                    code: SEND_TRANSACTION_ERROR_CODES.UNKNOWN_APP_ERROR,
                    message: 'Unknown app',
                },
                id: args.request.id.toString(),
            });
        }

        if (args.request.method === 'sendTransaction') {
            await this.handleSendTransaction(args);
            return;
        }

        args.callback({
            error: {
                code: SEND_TRANSACTION_ERROR_CODES.BAD_REQUEST_ERROR,
                message: `Method "${args.request.method}" is not supported by the wallet app`,
            },
            id: args.request.id.toString(),
        });
    }

    async handleRequestFromRemoteBridge<T extends RpcMethod>(
        request: AppRequest<T>,
        clientSessionId: string,
        callback: (response: WalletResponse<T>) => void,
        from: string
    ) {
        const { connectedApp } = this.findConnectedAppByClientSessionId(clientSessionId);
        this.handleRequest({ request, connectedApp, callback, from });
    }

    private async handleMessage(event: MessageEvent) {
        try {
            if (event.lastEventId) {
                this.setLastEventId(event.lastEventId);
            }

            const { from, message } = JSON.parse(event.data!);

            const connection = this.connections.find((item) => item.clientSessionId === from);

            if (!connection) {
                return;
            }

            const sessionCrypto = new SessionCrypto(connection.sessionKeyPair);

            const request: AppRequest<RpcMethod> = JSON.parse(
                sessionCrypto.decrypt(
                    Base64.decode(message).toUint8Array(),
                    hexToByteArray(from),
                ),
            );

            if (this.activeRequests[from]) {
                await sendTonConnectResponse({
                    response: {
                        error: {
                            code: SEND_TRANSACTION_ERROR_CODES.USER_REJECTS_ERROR,
                            message: 'User has already opened the previous request',
                        },
                        id: request.id.toString(),
                    },
                    sessionCrypto,
                    clientSessionId: from,
                });

                return;
            }

            this.activeRequests[from] = request;

            const callback = (response: WalletResponse<RpcMethod>) => {
                delete this.activeRequests[from];
                sendTonConnectResponse({ response, sessionCrypto, clientSessionId: from });
            }

            this.handleRequestFromRemoteBridge(request, from, callback, from);
        } catch (e) {
            warn(e);
        }
    }

    // 
    // Pending requests
    // 

    usePendingRequests() {
        return useRecoilValue(this.#pendingRequestsSelector);
    }

    deleteActiveRemoteRequest(clientSessionId: string) {
        delete this.activeRequests[clientSessionId];

        this.pendingRequestsItem.update((doc) => {
            const temp = doc ?? [];
            const index = temp.findIndex((item) => item.from === clientSessionId);
            if (index !== -1) {
                temp.splice(index, 1);
            }
            return temp;
        });
    }

    // 
    // Disconnect
    // 

    sendDisconnectEvent(connection: ConnectedAppConnectionRemote) {
        const sessionCrypto = new SessionCrypto(connection.sessionKeyPair);
        const event: DisconnectEvent = { event: 'disconnect', payload: {} };
        sendTonConnectResponse({ response: event, sessionCrypto, clientSessionId: connection.clientSessionId });
    }

    async disconnect(url: string) {
        const connectedApp = this.getConnectedAppByUrl(url);

        if (!connectedApp) {
            return;
        }

        // Disconnect remote connections
        const connections = this.engine.persistence.connectAppConnections.item(extensionKey(connectedApp.url)).value;
        const remoteConnections = (connections ?? []).filter(
            (connection) => connection.type === TonConnectBridgeType.Remote,
        ) as ConnectedAppConnectionRemote[];
        remoteConnections.forEach((connection) => this.sendDisconnectEvent(connection));

        // Remove pending requests
        remoteConnections.forEach((connection) => {
            this.deleteActiveRemoteRequest(connection.clientSessionId);
        });

        // Remove app from cloud
        this.removeConnectedApp(url);

    }

    // 
    // Injected
    //

    async autoConnect(webViewUrl: string): Promise<ConnectEvent> {
        try {
            const connectedApp = this.getConnectedAppByUrl(webViewUrl);
            const connections = this.engine.persistence.connectAppConnections.item(extensionKey(webViewUrl)).value ?? [];

            if (
                !connectedApp ||
                connections.length === 0 ||
                connectedApp.autoConnectDisabled
            ) {
                throw new ConnectEventError(
                    CONNECT_EVENT_ERROR_CODES.UNKNOWN_APP_ERROR,
                    'Unknown app',
                );
            }

            let walletStateInit = '';
            const acc = getCurrentAddress();
            try {
                const contract = await contractFromPublicKey(acc.publicKey);
                const stateInit = new StateInit({ code: contract.source.initialCode, data: contract.source.initialData });
                const initCell = new Cell();
                stateInit.writeTo(initCell);
                walletStateInit = initCell.toBoc({ idx: false }).toString('base64');
            } catch (err) {
                warn(err);
            }

            const replyItems = ConnectReplyBuilder.createAutoConnectReplyItems(
                acc.address.toFriendly({ testOnly: AppConfig.isTestnet, urlSafe: true, bounceable: true }),
                walletStateInit,
            );

            return {
                event: 'connect',
                payload: {
                    items: replyItems,
                    device: tonConnectDeviceInfo,
                },
            };
        } catch (error: any) {
            if (error instanceof ConnectEventError) {
                return error;
            }

            return new ConnectEventError(
                CONNECT_EVENT_ERROR_CODES.UNKNOWN_ERROR,
                error?.message,
            );
        }
    }

    removeInjectedConnection(webViewUrl: string) {
        let key = extensionKey(webViewUrl);

        const app = this.extensions.value.installed[key];
        if (!app) {
            return;
        }

        this.engine.persistence.connectAppConnections.item(key).update((doc) => {
            return (doc ?? []).filter((item) => item.type !== TonConnectBridgeType.Injected);
        });
    }
}