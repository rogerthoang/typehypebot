import { IConfig } from './IConfig';

export interface IPreCheckout {
    proxies: string[];
    sessionsPerOrder: number;
    delayWithoutProxies: number;
}

export interface ISizes {
    fallback: {
        sizes: number[],
        any: boolean;
    };
    size: number;
}

export interface IProduct {
    search: string;
    filter: {
        title: {
            contains: string[];
            blocked: string[];
        },
    };
}

export interface IEarly {
    name: string;
    url: string;
    extra?: any;
}

export interface IMonitoring {
    isMonitoring: boolean;
    startDelay: number;
}

export interface IBaseTaskData {
    active: boolean;
    monitoring: IMonitoring;
    storeName: string;
    storeDomain: string;
    proxy: string;
    interval: number;
    startTime: string;
    orders: number[]|any;
    extra?: any;
}

export interface ITaskData extends IBaseTaskData {
    sizes: ISizes;
    product: IProduct;
    early?: IEarly;
    cartProxies: string[];
}

export interface IPreCheckoutTaskData extends ITaskData {
    preCheckout: IPreCheckout;
}

export interface ITasksConfig extends IConfig {
    body: ITaskData[];
}
