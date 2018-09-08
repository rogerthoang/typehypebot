import { readFileSync } from 'fs';

export function loadConfig(path: string): IConfig {
    return {
        body: JSON.parse(readFileSync(path, 'utf8')),
    };
}

export interface IConfig {
    isJSON?: boolean;
    body: any;
}
