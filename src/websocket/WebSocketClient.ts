import * as WebSocket from 'ws';
import {
    IClientAuthenticatedEventDataStructure, IClientAuthenticateEventDataStructure,
    WebSocketEvent,
} from './WebSocketEvent';
import { EventListener } from '../EventListener';
import { IWebSocketMessage } from './WebSocketServer';

export class WebSocketClient extends EventListener {
    public isAuthenticated: boolean = false;

    private messageQueue: IWebSocketMessage[] = [];
    private webSocket: WebSocket;

    constructor(path: string, key: string) {
        super();

        this.webSocket = new WebSocket(path);
        this.send(WebSocketEvent.ClientAuthenticate, <IClientAuthenticateEventDataStructure> {
            key: key,
        }, true);

        this.webSocket.on('message', (webSocketData: WebSocket.Data) => {
            try {
                const { event, data } = JSON.parse(webSocketData.toString());
                this.callEvent(event, data);
            }catch {

            }
        });

        this.webSocket.on('close', () => {
            this.callEvent(WebSocketEvent.Close);
        });

        this.addEventListener(WebSocketEvent.ClientAuthenticated, (data: IClientAuthenticatedEventDataStructure) => {
            if(data.authenticated) {
                this.isAuthenticated = true;
                for(const message of this.messageQueue) {
                    this.send(message.event, message.data);
                }
                this.messageQueue.splice(0, this.messageQueue.length);
            }
        });
    }

    stop(): void {
        this.webSocket.close();
        this.callEvent(WebSocketEvent.Close);
    }

    send(event: string|number, data: any, isAuthenticationMessage: boolean = false): void {
        const send = (message: IWebSocketMessage) => {
            this.webSocket.send(JSON.stringify(message));
        };
        const message: IWebSocketMessage = {
            event: event,
            data: data,
        };
        if(!this.isAuthenticated && isAuthenticationMessage) {
            send(message);
        }else {
            this.messageQueue.push(message);
        }
    }
}
