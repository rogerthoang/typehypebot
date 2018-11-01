import { IConfig } from './IConfig';

export type SizesConfigData = {
    fallback: {
        sizes: number[];
        any: boolean;
    };
    size: number;
};

export type MonitoringConfigData = {
    isMonitoring: boolean;
    startDelay: number;
};

export type StoreOptionsConfigData = {
    name: string;
    region: string;
};

export type ProductConfigData = {
    search?: string;
    early?: {
        name: string;
        url: string;
        [x: string]: any;
    };
    sizes: SizesConfigData;
    filter: {
        name: {
            contains: string[];
            blocked: string[];
        };
        url: {
            contains: string[];
            blocked: string[];
        };
    };
    proxies: string[];
    sessionsPerProxy: number;
};

export type TaskConfigData = {
    active: boolean;
    baseData: {
        startTime: string;
        mainProxy: string;
        account: number;
        order: number;
        monitoring: MonitoringConfigData;
        storeOptions: StoreOptionsConfigData;
        products: ProductConfigData[];
        interval: number;
    };
    extendedData: any;
    taskSpecificData: any;
};

export interface ITasksConfig extends IConfig<TaskConfigData[]> {}
