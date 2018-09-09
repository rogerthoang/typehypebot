import { IConfig } from './IConfig';

export interface IStoreData {
    name: string;
    domainsByRegion: {[regionCode: string]: string};
}

export interface IStoresConfig extends IConfig {
    body: {[referenceName: string]: IStoreData};
}
