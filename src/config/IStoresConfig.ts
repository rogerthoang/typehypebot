import { IConfig } from './IConfig';

export type DomainsByRegion = { [regionCode: string]: string };

export type StoreConfigData = {
    name: string;
    domainsByRegion: DomainsByRegion;
};

export type StoresConfigData = {
    [name: string]: StoreConfigData;
};

export interface IStoresConfig extends IConfig<StoresConfigData> {}
