import { IConfig } from './IConfig';

export interface IStoreConfigData {
    name: string;
    domainsByRegion: { [regionCode: string]: string };
}

export interface IStoresConfigData {
    [referenceName: string]: IStoreConfigData;
}

export interface IStoresConfig extends IConfig<IStoresConfigData> {}
