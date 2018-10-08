import { IConfig } from './IConfig';

export interface IBotConfigData {
    localAddress: string;
    remoteServerPort: number;
    proxyFormat: string;
    developer: {
        skipPayPalLogin: boolean;
        isHeadlessBrowser: boolean;
    };
}

export interface IBotConfig extends IConfig<IBotConfigData> {}
