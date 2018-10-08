import { IConfig } from './IConfig';

export interface IAccountConfigData {
    username: string;
    password: string;
}

export interface IAccountsConfig extends IConfig<IAccountConfigData[]> {}
