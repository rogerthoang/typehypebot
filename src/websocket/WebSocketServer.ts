import * as WebSocket from 'ws';
import {
    IClientAuthenticatedEventDataStructure, IClientAuthenticateEventDataStructure,
    WebSocketEvent,
} from './WebSocketEvent';
import { EventListener } from '../EventListener';

export interface IWebSocketMessage {
    event: string|number;
    data: any;
}

export interface IClient {
    id: number;
    address: string;
    authenticated: boolean;
    send: (event: string|number, data: any) => void;
    socket: WebSocket;
    isAlive: boolean;
}

let clientId = 0;

const authenticateTimeout = 3000;
const pingInterval = 60000;

export class WebSocketServer extends EventListener {
    public server: WebSocket.Server;

    private debug: boolean;
    private authenticationKey: string;

    constructor(port: number, authenticationKey: string, debug = false) {
        super();

        this.debug = debug;
        this.authenticationKey = authenticationKey;
        this.server = new WebSocket.Server({ port: port });

        const clients: IClient[] = [];

        this.server.on('connection', (socket, request) => {
            const client: IClient = {
                id: clientId++,
                address: request.connection.remoteAddress,
                authenticated: false,
                send: (event: string|number, data: any) => {
                    socket.send(JSON.stringify(<IWebSocketMessage> {
                        event: event,
                        data: data,
                    }));
                },
                socket: socket,
                isAlive: true,
            };
            clients.push(client);

            socket.on('message', webSocketData => {
                try {
                    const { event, data } = <IWebSocketMessage> JSON.parse(webSocketData.toString());
                    this.callEvent(event, client, data);
                }catch(error) {

                }
            });

            socket.on('pong', () => {
                client.isAlive = true;
            });

            setTimeout(() => {
                if(!client.authenticated) {
                    client.send(WebSocketEvent.ClientAuthenticated, <IClientAuthenticatedEventDataStructure> {
                        authenticated: false,
                        message: `Authentication timeout (${authenticateTimeout}ms)`,
                    });
                    socket.close();
                    clients.splice(clients.indexOf(client), 1);
                }
            }, authenticateTimeout);
        });

        setInterval(() => {
            for(const client of clients) {
                if(!client.isAlive) {
                    client.socket.terminate();
                    clients.splice(clients.indexOf(client), 1);
                    continue;
                }
                client.isAlive = false;
                client.socket.ping();
            }
        }, pingInterval);

        this.addEventListener(WebSocketEvent.ClientAuthenticate, (client: IClient, data: IClientAuthenticateEventDataStructure) => {
            if(this.authenticationKey === data.key) {
                client.authenticated = true;
                client.send(WebSocketEvent.ClientAuthenticated, <IClientAuthenticatedEventDataStructure> {
                    authenticated: true,
                    message: 'Authenticated successfully',
                });
            }
        });
    }

    stop() {
        this.server.close();
        this.callEvent(WebSocketEvent.Close);
    }
}
