import { IConfig } from './IConfig';

export type BotConfigData = {
    localAddress: string;
    remoteServerPort: number;
    proxyFormat: string;
    developer: {
        skipPayPalLogin: boolean;
        isHeadlessBrowser: boolean;
    };
};

export interface IBotConfig extends IConfig<BotConfigData> {}
