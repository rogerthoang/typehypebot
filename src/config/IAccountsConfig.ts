import { IConfig } from './IConfig';

export type AccountConfigData = {
    username: string;
    password: string;
    isRegistered: boolean;
};

export interface IAccountsConfig extends IConfig<AccountConfigData[]> {}
