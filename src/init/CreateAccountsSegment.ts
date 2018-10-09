import { IInitSegment } from './IInitSegment';
import { IAccountConfigData } from '../config/IAccountsConfig';
import { Account } from '../config/Account';

export class CreateAccountsSegment implements IInitSegment<Account[]> {
    constructor(private accountsConfigData: IAccountConfigData[]) {}

    getResult() {
        const accounts: Account[] = [];

        for(const accountConfigData of this.accountsConfigData) {
            accounts.push(Account.createFrom(accountConfigData));
        }

        return accounts;
    }
}
