import { readFileSync } from 'fs';

export function loadConfig<ConfigType extends IConfig>(path: string): ConfigType {
    return <ConfigType> {
        body: JSON.parse(readFileSync(path, 'utf8')),
    };
}

export interface IConfig {
    isJSON?: boolean;
    body: any;
}
