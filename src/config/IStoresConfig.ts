import { IConfig } from './IConfig';

export type StoreConfigData = {
    name: string;
    domainsByRegion: { [regionCode: string]: string };
};

export type StoresConfigData = {
    [referenceName: string]: StoreConfigData;
};

export interface IStoresConfig extends IConfig<StoresConfigData> {}
