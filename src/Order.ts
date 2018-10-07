import {
    IOrderData, IShippingAddress, IBillingAddress, IPriceRange, IPayment,
} from './config/IOrdersConfig';
import * as faker from 'faker';
import { generateRandomString } from '@util/generic';
import { IStoreData } from './config/IStoresConfig';
import { BaseTask } from './task/BaseTask';

let orderId: number = 0;

function randomify(string: string, randomStringLength: number) {
    return string
        .replace(/#randomFirstName#/g, faker.name.firstName().toLowerCase())
        .replace(/#randomLastName#/g, faker.name.lastName().toLowerCase())
        .replace(/#randomWord#/g, faker.random.word().replace(/ /g, '-').toLowerCase())
        .replace(/#randomNumber#/g, faker.random.number().toString())
        .replace(/#randomString#/g, generateRandomString(randomStringLength));
}

export class Registration {
    private originalEmail: string;
    private _email: string = null;
    private hasChangedEmail: boolean = false;
    private originalPassword: string;
    private _password: string = null;
    private hasChangedPassword: boolean = false;

    constructor(email: string, password: string) {
        this.originalEmail = email;
        this.originalPassword = password;
    }

    get email(): string {
        if(!this.hasChangedEmail) {
            this._email = randomify(this.originalEmail, 10);
            this.hasChangedEmail = true;
        }
        return this._email;
    }

    get password(): string {
        if(!this.hasChangedPassword) {
            this._password = randomify(this.originalPassword, 12);
            this.hasChangedPassword = true;
        }
        return this._password;
    }

    resetEmail(): void {
        this.hasChangedEmail = false;
    }

    resetPassword(): void {
        this.hasChangedPassword = false;
    }

    reset(): void {
        this.resetEmail();
        this.resetPassword();
    }
}

export class Order {
    static createOrder(orderData: IOrderData) {
        return new Order(
            orderData.canBeUsedMultipleTimesAtSameStore,
            orderData.maxUses,
            orderData.registration.email,
            orderData.registration.password,
            orderData.billing,
            orderData.shipping,
            orderData.price,
            orderData.payment,
        );
    }

    public id: number;
    public registration: Registration;

    private uses = 0;
    private usedAtStores: IStoreData[] = [];

    constructor(public canBeUsedMultipleTimesAtSameStore: boolean, public maxUses: number, email: string, password: string, public bulling: IBillingAddress, public shipping: IShippingAddress, private priceRange: IPriceRange, public payment: IPayment) {
        this.id = orderId++;
        this.registration = new Registration(email, password);
    }

    use(task: BaseTask): boolean {
        if(this.maxUses !== null && this.maxUses !== -1 && this.uses + 1 < this.maxUses) {
            if(!this.canBeUsedMultipleTimesAtSameStore) {
                if(this.usedAtStores.indexOf(task.store) > -1) {
                    return false;
                }
            }
            this.usedAtStores.push(task.store);
            this.uses++;
            return true;
        }
        return false;
    }

    checkPrice(price: number): boolean {
        return price <= this.priceRange.maximum && price >= this.priceRange.minimum;
    }
}
