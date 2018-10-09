import { existsSync, readFileSync, writeFileSync } from 'fs';
import { randomBytes } from 'crypto';

const path = `${__dirname}/../.secret`;

let secret = null;

if(existsSync(path)) {
    secret = readFileSync(path, 'utf8');
}else {
    secret = randomBytes(128).toString('hex');
    writeFileSync(path, secret, 'utf8');
}

export { secret };
