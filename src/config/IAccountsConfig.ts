import { IConfig } from './IConfig';

export interface IAccountData {
    username: string;
    password: string;
}

export interface IAccountsConfig extends IConfig {
    body: IAccountData[];
}
