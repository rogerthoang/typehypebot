import { writeFile } from '@util/file';

function forceDigits(number: number, numberOfDigits: number, after: boolean = true): string {
    const string = number.toString();
    const currentNumberOfDigits = string.length;
    let newString = string;
    for(let i = 0; i < numberOfDigits - currentNumberOfDigits; i++) {
        if(after) {
            newString += '0';
        }else {
            newString = '0' + newString;
        }
    }
    return newString;
}

const timePrefix = Date.now();

export function log(message: string, file: string = 'main.txt') {
    const date = new Date();
    const realMessage = `[${forceDigits(date.getHours(), 2, false)}:${forceDigits(date.getMinutes(), 2, false)}:${forceDigits(date.getSeconds(), 2, false)}:${forceDigits(date.getMilliseconds(), 3, true)}] ${message}`;

    if(file !== null && file !== undefined) {
        const path = `${__dirname}/../../logs/session_${timePrefix}`;
        writeFile(path, file, realMessage);
    }

    console.log(realMessage);
}
