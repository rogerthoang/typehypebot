import { existsSync, readFileSync, writeFileSync } from 'fs';
import { randomBytes } from 'crypto';

const path: string = __dirname + '/../.secret';

let _secret: string;

if(existsSync(path)) {
    _secret = readFileSync(path, 'utf8');
}else {
    _secret = randomBytes(128).toString('hex');
    writeFileSync(path, _secret, 'utf8');
}

secret = _secret;

export let secret;
