import { IConfig } from './IConfig';

export interface IStoreData {
    name: string;
    domainsByRegion: {[regionCode: string]: string};
}

export interface IStores {
    [referenceName: string]: IStoreData;
}

export interface IStoresConfig extends IConfig {
    body: IStores;
}
