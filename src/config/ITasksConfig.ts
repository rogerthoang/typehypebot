import { IConfig } from './IConfig';

export interface ISizesData {
    fallback: {
        sizes: number[],
        any: boolean;
    };
    size: number;
}

export interface IMonitoringData {
    isMonitoring: boolean;
    startDelay: number;
}

export interface IStoreData {
    referenceName: string;
    region: string;
}

export interface IProductData {
    search?: string;
    early?: {
        name: string;
        url: string;
        [x: string]: any;
    };
    sizes: ISizesData;
    filter: {
        title: {
            contains: string[];
            blocked: string[];
        },
    };
    proxies: string[];
    sessionsPerProxy: number;
}

export interface ITaskData {
    baseData: {
        active: boolean;
        startTime: string;
        mainProxy: string;
        account: number;
        monitoring: IMonitoringData;
        store: IStoreData;
        products: IProductData[];
        interval: number;
        orders: number[];
    };
    extendedData: any;
    taskSpecificData: any;
}

export interface ITasksConfig extends IConfig {
    body: ITaskData[];
}
