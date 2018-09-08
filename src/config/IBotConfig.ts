import { IConfig } from './IConfig';

export interface IBotOptions {
    localAddress: string;
    remoteServerPort: number;
    proxyFormat: string;
    developer: {
        developerMode: boolean;
        skipPayPalLogin: boolean;
    };
}

export interface IBotConfig extends IConfig {
    body: IBotOptions;
}
