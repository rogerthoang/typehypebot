import { IAccountConfigData } from './IAccountsConfig';
import * as faker from 'faker';
import { generateRandomString } from '@util/generic';

function randomify(string: string, randomStringLength?: number) {
    return string
        .replace(/#randomFirstName#/g, faker.name.firstName().toLowerCase())
        .replace(/#randomLastName#/g, faker.name.lastName().toLowerCase())
        .replace(/#randomWord#/g, faker.random.word().replace(/ /g, '-').toLowerCase())
        .replace(/#randomNumber#/g, faker.random.number().toString())
        .replace(/#randomString#/g, generateRandomString(randomStringLength));
}

export class Account {
    static createFrom(accountConfigData: IAccountConfigData) {
        return new Account(randomify(accountConfigData.username, 12), randomify(accountConfigData.password, 12));
    }

    constructor(public username: string, public password: string) {}
}
