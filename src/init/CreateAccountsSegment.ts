import { IInitSegment } from './IInitSegment';
import { AccountConfigData } from '../config/IAccountsConfig';
import { Account } from '../config/Account';

export class CreateAccountsSegment implements IInitSegment<Account[]> {
    constructor(private accountsConfigData: AccountConfigData[]) {}

    getResult() {
        const accounts: Account[] = [];

        for(const accountConfigData of this.accountsConfigData) {
            accounts.push(Account.createFrom(accountConfigData));
        }

        return accounts;
    }
}
