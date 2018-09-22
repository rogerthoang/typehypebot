import * as moment from 'moment';
import * as crypto from 'crypto';
import opn = require('opn');

export function getTimeFromString(time: string, format = 'YYYY-MM-DD HH-mm-ss-SSS'): number {
    return moment(time, format).valueOf();
}

export function wait(milliseconds: number): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, milliseconds);
    });
}

export function containsAnArrayItem(string: string, array: string[]): boolean {
    const realString = string.toLowerCase();

    for(let i = 0; i < array.length; i++) {
        const value = array[i].toLowerCase();
        if(realString.indexOf(value) >= 0) {
            return true;
        }
    }

    return false;
}

export function containsArrayItems(string: string, array: string[]): boolean {
    const realString = string.toLowerCase();

    for(let i = 0; i < array.length; i++) {
        const value = array[i].toLowerCase();

        if(realString.indexOf(value) < 0) {
            return false;
        }
    }

    return true;
}

export function generateRandomString(length: number): string {
    return crypto.randomBytes(length / 2).toString('hex');
}

export function getCheerioElementFormData(cheerioElement: Cheerio): any {
    const formDataArray = cheerioElement.serializeArray();
    const formData = {};

    for(let i = 0; i < formDataArray.length; i++) {
        const data = formDataArray[i];
        formData[data.name] = data.value;
    }

    return formData;
}

export function clipboard(string: string): void {
    const process = require('child_process').spawn('pbcopy');
    process.stdin.write(string);
    process.stdin.end();
}

export function open(url: string): void {
    opn(url);
}

export function clone(object: object): object {
    return JSON.parse(JSON.stringify(object));
}

export function getSiteKey(body: string): string {
    const siteKeyIndex = body.indexOf('data-sitekey="');

    if(siteKeyIndex === -1) {
        return null;
    }

    return body.slice(siteKeyIndex + 14, body.indexOf('"', siteKeyIndex + 14));
}

const isDevelopmentMode = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined;
export { isDevelopmentMode };
