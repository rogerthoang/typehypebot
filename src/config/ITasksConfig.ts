import { IConfig } from './IConfig';
import { IStoreData } from './IStoresConfig';
import { Order } from '../Order';
import { IAccountData } from './IAccountsConfig';
import { IProxy } from '@util/proxy';

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

export interface IStoreOptionsData {
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
        monitoring: IMonitoringData;
        storeOptions: IStoreOptionsData;
        products: IProductData[];
        interval: number;
    };
    extendedData: any;
    taskSpecificData: any;
}

export interface ITaskData {
    baseData: {
        startTime: number;
        mainProxy: IProxy;
        account: IAccountData;
        order: Order;
        monitoring: IMonitoringData;
        store: IStoreData;
        storeRegion: string;
        products: IProductData[];
        interval: number;
    };
    extendedData: any;
    taskSpecificData: any;
}

export interface ITasksConfig extends IConfig {
    body: ITaskConfigData[];
}
