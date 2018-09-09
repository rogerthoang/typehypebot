import { IConfig } from './IConfig';

export interface IBotOptions {
    localAddress: string;
    remoteServerPort: number;
    proxyFormat: string;
    developer: {
        skipPayPalLogin: boolean;
        isHeadlessBrowser: boolean;
    };
}

export interface IBotConfig extends IConfig {
    body: IBotOptions;
}
