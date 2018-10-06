import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import * as digitalocean from 'digitalocean';
import * as _keygen from 'ssh-keygen';
import * as node_ssh from 'node-ssh';

async function keygen(options) {
    return new Promise((resolve, reject) => {
        _keygen(options, (error, out) => {
            if(error) {
                reject(error);
            }else {
                resolve(out);
            }
        });
    });
}

const defaultCreationParameters: any = {
    image: 'ubuntu-14-04-x64',
    ssh_keys: [],
};

const keyDirectory = `${__dirname}/../../.ssh-keys/`;
const keyIdLocation = `${keyDirectory}digitalocean_id`;
const keyLocation = `${keyDirectory}id_rsa`;

if(!existsSync(keyDirectory)) {
    mkdirSync(keyDirectory, 600);
}

const client: any = null;

async function addSSHIds(client: any): Promise<void> {
    try {
        const data: string = readFileSync(keyIdLocation, 'utf8');
        defaultCreationParameters.ssh_keys.push(data);
    }catch(error) {
        if(error.code === 'ENOENT') { // if key doesn't exist
            try {
                const out: any = await keygen({
                    location: keyLocation,
                    read: true,
                });
                const publicKey = out.pubKey;
                try {
                    const response = await client.account.createSshKey({
                        name: `${Date.now()}-typehypebot`,
                        public_key: publicKey,
                    });
                    writeFileSync(keyIdLocation, response.id);
                    defaultCreationParameters.ssh_keys.push(response.id);
                }catch(error) {
                    console.log(`Couldn\'t add SSH key to account: ${error.message}`);
                }
            }catch(error) {
                console.log(`Could not create SSH keys: ${error.message}`);
            }
        }
    }
}

const doneInit = false;

async function init(client: any): Promise<void> {
    if(!doneInit) {
        await addSSHIds(client);
    }
}

export class DigitalOcean {
    private client;

    constructor(token: string) {
        this.client = digitalocean.client(token);
    }

    async create(name = 'typehypebot', region = 'lon1', size = '512mb'): Promise<number> {
        await init(this.client);
        let realName: string = name;
        if(realName !== 'typehypebot') {
            realName = `typehypebot-${name}`;
        }
        defaultCreationParameters.name = name;
        defaultCreationParameters.region = region;
        defaultCreationParameters.size = size;
        try {
            const response: any = await client.droplets.create(defaultCreationParameters);
            return response.id;
        }catch(error) {
            console.log(`Could not create Droplet: ${error.message}`);
        }
    }

    async delete(id: number): Promise<void> {
        await init(this.client);
        try {
            await client.droplets.delete(id);
        }catch(error) {
            console.log(`Could not delete Droplet: ${error.message}`);
        }
    }

    getSSH(id: number): Promise<any> {
        let resolveSSH: (ssh: any) => void = null;
        const promise: Promise<any> = new Promise(resolve => {
            resolveSSH = resolve;
        });
        const interval = setInterval(async() => { // check if droplet is active
            const response: any = await client.droplets.get(id);
            if(response.status === 'active') {
                const ip: string = response.networks.v4[0].ip_address;
                clearInterval(interval);
                let startedRunning: boolean = false;
                const runCommands: any = async stopInterval => {
                    if(startedRunning) {
                        return;
                    }
                    const ssh: any = new node_ssh();
                    await ssh.connect({
                        host: ip,
                        username: 'root',
                        privateKey: keyLocation,
                    });
                    if(startedRunning) {
                        return;
                    }
                    clearInterval(stopInterval);
                    startedRunning = true;
                    resolveSSH(ssh);
                };
                const connectInterval: any = setInterval(() => {
                    runCommands(connectInterval);
                }, 10000);
            }
        }, 30000);
        return promise;
    }
}
