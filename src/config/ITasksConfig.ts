import { IConfig } from './IConfig';

export interface ISizesConfigData {
    fallback: {
        sizes: number[],
        any: boolean;
    };
    size: number;
}

export interface IMonitoringConfigData {
    isMonitoring: boolean;
    startDelay: number;
}

export interface IStoreOptionsConfigData {
    referenceName: string;
    region: string;
}

export interface IProductConfigData {
    search?: string;
    early?: {
        name: string;
        url: string;
        [x: string]: any;
    };
    sizes: ISizesConfigData;
    filter: {
        name: {
            contains: string[];
            blocked: string[];
        },
    };
    proxies: string[];
    sessionsPerProxy: number;
}

export interface ITaskConfigData {
    active: boolean;
    baseData: {
        startTime: string;
        mainProxy: string;
        account: number;
        order: number;
        monitoring: IMonitoringConfigData;
        storeOptions: IStoreOptionsConfigData;
        products: IProductConfigData[];
        interval: number;
    };
    extendedData: any;
    taskSpecificData: any;
}

export interface ITasksConfig extends IConfig<ITaskConfigData[]> {}
