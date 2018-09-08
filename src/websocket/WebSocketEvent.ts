export enum WebSocketEvent {
    ClientAuthenticate = 'ClientAuthenticate',
    ClientAuthenticated = 'ClientAuthenticated',
    Close = 'Close',
}

export interface IClientAuthenticateEventDataStructure {
    key: string;
}

export interface IClientAuthenticatedEventDataStructure {
    authenticated: boolean;
    message: string;
}
