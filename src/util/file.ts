import { appendFile, existsSync, mkdir, readFileSync as fsReadFileSync } from 'fs';

export function writeFile(path: string, file: string, message: string): void {
    if(!existsSync(path)) {
        mkdir(path, () => {
            appendFile(`${path}/${file}`, `${message}\n`, { encoding: 'utf8' }, err => console.error(`Could not write to file ${file}`, err));
        });
    }else {
        appendFile(`${path}/${file}`, `${message}\n`, { encoding: 'utf8', flag: 'a+' }, err => console.error(`Could not write to file ${file}`, err));
    }
}

export function readFile(path: string, parseJson = false): string|any {
    if(existsSync(path)) {
        const string = fsReadFileSync(path, { encoding: 'utf8' });

        if(parseJson) {
            return JSON.parse(string);
        }

        return string;
    }

    return null;
}
