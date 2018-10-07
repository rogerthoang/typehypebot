import { IInitSegment } from './IInitSegment';
import { IBotConfig } from '../config/IBotConfig';
import { ITokensConfig } from '../config/ITokensConfig';
import { INotifiersConfig } from '../config/INotifiersConfig';
import { IAccountsConfig } from '../config/IAccountsConfig';
import { IOrdersConfig } from '../config/IOrdersConfig';
import { IStoresConfig } from '../config/IStoresConfig';
import { ITasksConfig } from '../config/ITasksConfig';
import { IConfig } from '../config/IConfig';
import { readFileSync } from 'fs';

export type LoadedConfigs = {
    botConfig: IBotConfig;
    tokensConfig: ITokensConfig;
    notifiersConfig: INotifiersConfig;
    accountsConfig: IAccountsConfig;
    ordersConfig: IOrdersConfig;
    storesConfig: IStoresConfig;
    tasksConfig: ITasksConfig;
};

export class LoadConfigsSegment implements IInitSegment<LoadedConfigs> {
    constructor(private path: string) {}

    getResult() {
        const botConfig = this.loadConfig<IBotConfig>(`${this.path}/bot.json`);
        const tokensConfig = this.loadConfig<ITokensConfig>(`${this.path}/tokens.json`);
        const notifiersConfig = this.loadConfig<INotifiersConfig>(`${this.path}/notifiers.json`);
        const accountsConfig = this.loadConfig<IAccountsConfig>(`${this.path}/accounts.json`);
        const ordersConfig = this.loadConfig<IOrdersConfig>(`${this.path}/orders.json`);
        const storesConfig = this.loadConfig<IStoresConfig>(`${this.path}/stores.json`);
        const tasksConfig = this.loadConfig<ITasksConfig>(`${this.path}/tasks.json`);

        return {
            botConfig,
            tokensConfig,
            notifiersConfig,
            accountsConfig,
            ordersConfig,
            storesConfig,
            tasksConfig,
        };
    }

    private loadConfig<ConfigType extends IConfig>(fileName: string): ConfigType {
        return <ConfigType> {
            body: JSON.parse(readFileSync(`${this.path}/${fileName}`, 'utf8')),
        };
    }
}
